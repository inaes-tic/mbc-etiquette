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

    accessRoutes = [ '/events', '/init', '/addImage', '/addBanner', '/addWidget', '/addAnimation', '/remove', '/removeAll', '/addEffect', '/move', '/uploadFile' ];
    _.each(accessRoutes, function(route) {
        server.all(route, accessControl);
    });

    server.get("/events", function(req, res) {
        var event = _.findWhere(events, {consumed: false});
        if (event) {
            logger.debug(event);
            event.consumed = true;
            res.json(event);
        } else {
            logger.debug('Event: NONE');
            res.json({"type": "none"});
        }
    });

    server.get("/init", function(req, res) {
        logger.debug(elements);
        res.json({elements: elements});
        events = _.reject(events, function(event) {
            return event.type === 'add' || event.type === 'remove';
        });
    });

    server.post('/addImage', function(req, res){
        var full_url = url.format( { protocol: req.protocol, host: req.get('host'), pathname: 'uploads/' + req.body.images });
        var element = {};
        element.id = req.body.id;
        remove(element.id);
        element.type = 'image';
        element.src = full_url;
        element.top = req.body.top;
        element.left = req.body.left;
        element.bottom = req.body.bottom;
        element.right = req.body.right;
        element.height = req.body.height;
        element.width = req.body.width;
        element.zindex = req.body.zindex;
        var event = {};
        event.type = 'addImage';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements.push(element);
        return res.json({});
    });

    server.post('/addBanner', function(req, res){
        var element = {};
        element.id = req.body.id;
        remove(element.id);
        element.type = 'banner';
        element.top = req.body.top;
        element.left = req.body.left;
        element.bottom = req.body.bottom;
        element.right = req.body.right;
        element.height = req.body.height;
        element.width = req.body.width;
        element.background_color = req.body.background_color;
        element.color = req.body.color;
        element.text = req.body.text;
        element.scroll = req.body.scroll;
        var event = {};
        event.type = 'addBanner';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements.push(element);
        return res.json({});
    });

    server.post('/addWidget', function(req, res){
        var element = {};
        element.id = req.body.id;
        remove(element.id);
        element.type = 'widget';
        element.options = JSON.parse(req.body.options);
        element.options.woeid = commonConf.Widgets.WeatherWoeid;
        element.zindex = req.body.zindex;
        var event = {};
        event.type = 'addWidget';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements.push(element);
        return res.json({});
    });

    server.post('/addAnimation', function(req, res){
        var element = {};
        element.id = req.body.id;
        remove(element.id);
        element.type = 'animation';
        element.options = req.body;
        element.options.frameRate = mbc.config.Mosto.General.fps;
        element.options.image = url.format({
            protocol: req.protocol,
            host: req.get('host'),
            pathname: 'uploads/' + req.body.name
        });
        var event = {};
        event.type = 'addAnimation';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements.push(element);
        return res.json({});
    });

    var remove = function(id) {
        elements = _.reject(elements, function(item) {
            if (item.id === id) {
                events.push({
                    type: 'remove',
                    element: {id: id},
                    consumed: false
                });
                return true;
            } else {
                return false;
            }
        });
    };

    server.post('/remove', function(req, res){
        remove(req.body.elements);
        return res.json({});
    });

    server.post('/removeAll', function(req, res){
        events = [];
        _.each(elements, function(e) {
            var event = {};
            event.type = 'remove';
            event.element = {id: e.id};
            event.consumed = false;
            events.push(event);
        })
        elements = [];
        return res.json({});
    });

    server.post('/addEffect', function(req, res){
        var element = {};
        element.id = req.body.elements;
        var animation = {};
        animation.name = req.body.effects;
        animation.duration = req.body.duration;
        animation.iterations = req.body.iterations;
        animation.delay = req.body.delay;
        var event = {};
        event.type = 'animation';
        event.element = element;
        event.animation = animation;
        event.consumed = false;
        events.push(event);
        return res.json({});
    });

    server.post('/move', function(req, res){
        var element = {};
        element.id = req.body.elements;
        var move = {};
        move.x = req.body.x;
        move.y = req.body.y;
        move.duration = req.body.duration;
        var event = {};
        event.type = 'move';
        event.element = element;
        event.move = move;
        event.consumed = false;
        events.push(event);
        return res.json({});
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

    var vendorJs = new folio.Glossary([
        require.resolve('jquery-browser/lib/jquery.js'),
        require.resolve('jqueryui-browser/ui/jquery-ui.js'),
        require.resolve('underscore/underscore.js'),
        require.resolve('backbone/backbone.js'),
        require.resolve('jed'),
        require.resolve('knockout/build/output/knockout-latest.js'),
        require.resolve('knockback/knockback-core.js'),
        path.join(lib_dir, 'kinetic-v4.5.2.min.js'),
        path.join(lib_dir, 'backbone.modal-min.js'),
        require.resolve('backbone-pageable/lib/backbone-pageable.js'),
    ], {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express
    server.get('/js/vendor.js', folio.serve(vendorJs));


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

    var models = ['Default', 'App', 'Editor', 'Sketch'];

    var modelsJs = new folio.Glossary(
        models.map (function (e) {
            return require.resolve('mbc-common/models/' + e);
        })
    );

    server.get('/js/models.js', folio.serve(modelsJs));

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
