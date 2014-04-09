module.exports = function(app) {

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

    accessRoutes = [ '/images/', '/images/:filename', '/uploadFile' ];
    _.each(accessRoutes, function(route) {
        app.all(route, accessControl);
    });

    app.get("/images", function(req, res) {
        fs.readdir(conf.Dirs.uploads, function(err, files) {
            files.sort();
            return res.json({images: files});
        });
    });

    app.get("/images/:filename", function(req, res) {
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

    app.post('/uploadFile', function(req, res) {
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

    app.get('/live.webm', function(req, res) {
        if(conf.Editor.stream_url) {
            res.redirect(conf.Editor.stream_url);
        } else {
            res.json({});
        }
    });

    app.get('/po/:id', function (req, res) {
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

    var lib_dir                 = path.join(__dirname, '..', 'vendor')
    var common_dir              = path.join('node_modules','mbc-common')
    var common_lib_dir          = path.join(__dirname, '..', common_dir, 'vendor')
    var bower_common_lib_dir    = path.join(__dirname, '..', common_dir, 'bower_components')

    var addPath = function (dir, libs) {
        return _.map(libs, function(lib) {
            return path.join(dir, lib);
        });
    }

    var commonBower = [
        'jquery/jquery.min.js',
        'underscore/underscore.js',
        'backbone/backbone-min.js',
        'knockout.js/knockout.js',
        'knockback/knockback-core.min.js',
    ];

    var vendorBower = [
        'kineticjs/kinetic.min.js',
        'jqueryui/ui/minified/jquery-ui.min.js',
        'node-uuid/uuid.js',
        'moment/moment.js',
        'jed/jed.js',
        'backbone-modal/backbone.modal-min.js',
        'backbone-pageable/lib/backbone-pageable.js'
    ];

    var commonVendor = addPath(bower_common_lib_dir, commonBower);

    var vendorJs = new folio.Glossary(
        commonVendor.concat( addPath(bower_common_lib_dir, vendorBower)),
    {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express
    app.get('/js/vendor.js', folio.serve(vendorJs));

    /**
     * Filter Vendor Javascript Package
     */
    vendorFilterJs = new folio.Glossary(commonVendor.concat([
    ]), {minify: false});

    app.get('/js/vendor_filter.js', folio.serve(vendorFilterJs));

    var vendorOtherBower = [
        'backbone-relational/backbone-relational.js',
    ];

    /* Ko binding need to load after all filter widgets */
    vendorOthersJs = new folio.Glossary([
        path.join(lib_dir, 'knockout-common-binding.js'),
    ].concat(addPath(bower_common_lib_dir, vendorOtherBower)));

    app.get('/js/vendor_others.js', folio.serve(vendorOthersJs));

    /**
     * Views Javascript Package
     */

    var getFileName = function (e) {
        return path.join(__dirname, '..', 'views/templates/', e + '.jade');
    };

    var getViewFileName = function(e) {
        return path.join(__dirname, '..', 'public/js/views/', e + '.js');
    };

    var views = {
        header: {
            js:         [ getViewFileName('header') ],
            templates:  [ getFileName('header') ],
            styles:     [],
            images:     [],
            models:     [],
        },
        liveview: {
            js:         [ getViewFileName('liveview') ],
            templates:  [ getFileName('liveview') ],
            styles:     [],
            images:     [],
            models:     ['App.js', 'Sketch.js'],
            widgets:    ['WebvfxSimpleWidget', 'WebvfxAnimationWidget'],
        }
    };

    _.extend(mbc.views.views, views);

    var merge = mbc.views.mergeViews('header','editor');
    var folios = mbc.views.makeViewFolios(merge);

    app.get('/js/views.js', folio.serve(folios.js));
    app.get('/js/models.js', folio.serve(folios.models));
    app.get('/js/templates.js', folio.serve(folios.templates));
    app.get('/js/widgets.js', folio.serve(folios.widgets));

    mbc.views.views.liveview = mbc.views.setupView(mbc.views.views.liveview);
    var merge = mbc.views.mergeViews('liveview');
    var folios = mbc.views.makeViewFolios(merge);

    app.get('/js/views_filter.js', folio.serve(folios.js));
    app.get('/js/models_filter.js', folio.serve(folios.models));
    app.get('/js/templates_filter.js', folio.serve(folios.templates));
    app.get('/js/widgets_filter.js', folio.serve(folios.widgets));

    app.get('/filter', function(req, res) {
        res.render('filter', {});
    });

    app.get('*',  function(req, res) {
        res.render('index', { name: conf.Branding.name, description: conf.Branding.description });
    });

    return appCollection;

}
