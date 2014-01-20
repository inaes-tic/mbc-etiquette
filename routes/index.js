module.exports = function(server) {

    var path = require('path')
    , folio = require('folio')
    , jade = require('jade')
    , po2json = require('po2json')
    , i18n = require('i18n-abide')
    , _ = require('underscore')
    , os = require('os')
    , fs = require('fs')
    , exec = require('child_process').exec
    , mbc = require('mbc-common')
    , conf = mbc.config.Webvfx
    , commonConf = mbc.config.Common
    , logger  = mbc.logger().addLogger('webvfx_routes')
    , imageFiles = []
    , watchr  = require('watchr')
    , url = require('url')
    , elements = []
    , events = []
    ;

    var self = require ('mbc-common/models/App.js')
    , appCollection = new self.Collection();

    var accessControl = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    };

    accessRoutes = [ 'images', '/uploadFile' ];
    _.each(accessRoutes, function(route) {
        server.all(route, accessControl);
    });

    server.get("/images", function(req, res) {
        fs.readdir(conf.Dirs.uploads, function(err, files) {
            files.sort();
            return res.json({images: files});
        });
    });

    server.get("/images/:filename", function(req, res) {
        var opcodeKey = "OPCODE:";
        var filepath = path.join(conf.Dirs.uploads, req.params.filename);
        var cmd = 'identify -format "%[' + opcodeKey + '*]" ' + filepath;
        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                logger.error('Getting image info: ' + error);
                return res.json({error: 'getting image info'});
            }

            var metadata = {};
            var stdoutLines = stdout.trim().split("\n");
            _.each(stdoutLines, function(line) {
                line = line.replace(opcodeKey, '');
                chunks = line.split("=");
                metadata[chunks[0]] = chunks[1];
            })
            type = ('frames' in metadata) ? 'animation' : 'image';
            return res.json({filename: req.params.filename, type: type, metadata: metadata});
        });
    });

    var regexFileTypes = /\.(zip|tar.gz|tgz)$/i;

    server.post('/uploadFile', function(req, res) {
        var uploadedFileName = req.files.uploadedFile.name;
        var uploadedFilePath = req.files.uploadedFile.path;

        if (regexFileTypes.test(uploadedFileName)) {
            createAnimation(uploadedFileName, uploadedFilePath, function (err, data) {
                if (err) {
                    logger.error('Creating animation: ' + err);
                    return res.json({error: err});
                }
                return res.json({
                    type: 'animation',
                    filename: data.filename,
                    frames: data.frames,
                });
            });
        } else {
            fs.readFile(uploadedFilePath, function (err, data) {
                if (err) {
                    logger.error('Uploading file: ' + err);
                    return res.json({error: 'uploading files'});
                }
                var newPath = path.join(conf.Dirs.uploads, uploadedFileName);
                fs.writeFile(newPath, data, function (err) {
                    if (err) {
                        logger.error('Writing file: ' + err);
                        return res.json({error: 'writing file'});
                    }
                    return res.json({
                        type: 'image',
                        filename: uploadedFileName
                    });
                });
            });
        }
    });

    var createAnimation = function(uploadedFileName, uploadedFilePath, callback) {
        var tmpDir = uploadedFilePath + '.d';
        fs.mkdirSync(tmpDir);

        var cmd = /\.zip$/i.test(uploadedFileName)
                ? "unzip -x " + uploadedFilePath + " -d " + tmpDir
                : "tar xzf " + uploadedFilePath + " -C " + tmpDir;

        exec(cmd, function(error, stdout, stderr) {
            if (error) {
                callback('decompressing file');
            }

            var cmd = "find " + tmpDir + " -iname '*.png' | sort";

            exec(cmd, function(error, stdout, stderr) {
                if (error) {
                    callback('finding png files');
                }

                var files = stdout;
                var frames = files.trim().split("\n").length;
                var filename = uploadedFileName.replace(regexFileTypes, '.png');
                var filepath = path.join(conf.Dirs.uploads, filename);

                var cmd = "convert '" + files.trim().replace(/\n/g, "' '") + "' "
                        + "+append -set 'OPCODE:frames' " + frames + " " + filepath;

                exec(cmd, function(error, stdout, stderr) {
                    if (error) {
                        callback('creating single png');
                    }

                    callback(null, {filename: filename, frames: frames});
                });
            })
        });
    }

    server.get('/live.webm', function(req, res) {
        if(conf.Editor.stream_url) {
            res.redirect(conf.Editor.stream_url);
        } else {
            res.json({});
        }
    });

    server.get('/po/:id', function (req, res) {
        var lang = req.params.id;
        var locale = i18n.localeFrom(lang);
        var jsondata = '';
        try {
            jsondata = po2json.parseSync('locale/' + locale + '/LC_MESSAGES/messages.po');
            res.send (jsondata);
        } catch (e) {
            logger.error(e);
        }
    });

    /**
     * Vendor Javascript Package
     */

    var lib_dir = path.join(__dirname, '..', 'vendor')

    var commonVendor = [
        require.resolve('jquery-browser/lib/jquery.js'),
        require.resolve('underscore/underscore.js'),
        require.resolve('backbone/backbone.js'),
        require.resolve('knockout/build/output/knockout-latest.js'),
        require.resolve('knockback/knockback-core.js'),
    ];

    var vendorJs = new folio.Glossary(commonVendor.concat([
        require.resolve('jqueryui-browser/ui/jquery-ui.js'),
        require.resolve('node-uuid'),
        require.resolve('jed'),
        path.join(lib_dir, 'kinetic-v4.5.2.min.js'),
        path.join(lib_dir, 'backbone.modal-min.js'),
        require.resolve('backbone-pageable/lib/backbone-pageable.js'),
    ]), {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express
    server.get('/js/vendor.js', folio.serve(vendorJs));

    /**
     * Filter Vendor Javascript Package
     */
    vendorFilterJs = new folio.Glossary(commonVendor.concat([
    ]), {minify: false});

    server.get('/js/vendor_filter.js', folio.serve(vendorFilterJs));

    /* Ko binding need to load after all filter widgets */
    vendorOthersJs = new folio.Glossary([
        path.join(lib_dir, 'knockout-common-binding.js'),
    ]);

    server.get('/js/vendor_filter_others.js', folio.serve(vendorOthersJs));

    /**
     * Views Javascript Package
     */
    var localViews = [ 'header' ];
    var commonViews = [ 'editor' ];

    var localViewsFiles  = localViews.map( function(e) {
        return path.join(__dirname, '..', 'public/js/views/', e + '.js');
    });
    var commonViewsFiles = commonViews.map( function(e) {
        return require.resolve('mbc-common/views/js/' + e);
    });

    var viewsJs = new folio.Glossary(
        localViewsFiles.concat(commonViewsFiles),
        { minify:server.get('minify') }
    );

    server.get('/js/views.js', folio.serve(viewsJs));

    /**
     * Models Javascript Package
     */

    var folioModels = function(models) {
        return new folio.Glossary(
            models.map (function (e) {
                return require.resolve('mbc-common/models/' + e);
            })
        );
    };

    var models = ['Default', 'App', 'Editor', 'Sketch'];
    server.get('/js/models.js', folio.serve(folioModels(models)));

    var models_filter = [ 'Sketch' ];
    server.get('/js/models_filter.js', folio.serve(folioModels(models_filter)));

    commonConf.Widgets.Files.forEach(function(widget) {
        server.get(
            '/js/widgets/' + widget + '.js',
            folio.serve(
                new folio.Glossary([
                    require.resolve('mbc-common/widgets/' + widget)
                ])
            )
        );
    });

    /**
     * Filter Widgets Javascript Package
     */
    var widgets = [ 'WebvfxSimpleWidget', 'WebvfxAnimationWidget' ];

    var widgetsJs = new folio.Glossary(
        widgets.map (function(widget) {
            return require.resolve('mbc-common/widgets/' + widget);
        })
    );

    server.get('/js/widgets_filter.js', folio.serve(widgetsJs));

    /**
     * Template Javascript Package
     *
     * We are going to use pre-compiled
     * jade on the client-side.
     */

    var localTemplates = ['header'];

    var commonTemplates = ['editor',
                           'objects',
                           'alert',
                           'confirm',
                           'prompt',
                          ];

    var getFileName = function (e) {
        return path.join(__dirname, '..', 'views/templates/', e + '.jade');
    };

    var getCommonFileName = function (e) {
        return require.resolve('mbc-common/views/templates/' + e + '.jade');
    };

    var templateJs = new folio.Glossary([
        require.resolve('jade/runtime.js'),
        path.join(__dirname, '..', 'views/templates/js/header.js')].concat(
            localTemplates.map(getFileName), commonTemplates.map(getCommonFileName)
        ),
        {
        compilers: {
            jade: function (name, source) {
                return 'template[\'' + name + '\'] = ' +
                    jade.compile(source, {
                        filename: getFileName(name),
                        client: true,
                        compileDebug: false
                    }) + ';';
            }
        }
    });

    // serve using express
    server.get('/js/templates.js', folio.serve(templateJs));

    server.get('*',  function(req, res) {
        res.render('index', { name: conf.Branding.name, description: conf.Branding.description });
    });

    return appCollection;

}
