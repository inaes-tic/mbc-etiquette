module.exports = function(server) {
    var path = require('path')
    , folio = require('folio')
    , jade = require('jade')
    , po2json = require('po2json')
    , i18n = require('i18n-abide')
    , _ = require('underscore')
    , fs  = require('fs')
    , mbc = require('mbc-common')
    , conf = mbc.config.Webvfx
    , logger  = mbc.logger().addLogger('webvfx_routes')
    , imageFiles = []
    , watchr  = require('watchr')
    , url = require('url')
    , elements = []
    , events = []
    ;

    var files = fs.readdirSync(conf.Dirs.uploads);
    files.forEach(function(element){
       imageFiles.push({ name: element });
    });

    watchr.watch({
        paths: [conf.Dirs.uploads],
        listeners: {
            error: function(err){
                logger.error("Error while watching images dir", err);
            },
            watching: function(err, watcherInstance, isWatching){
                if (err) {
                    logger.error("Error while watching images dir", err);
                } else {
                    logger.info("Watching playlists dir");
                }
            },
            change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
                var name = filePath.substring(filePath.lastIndexOf("/") + 1);

                if (changeType === "create") {
                    logger.debug("Image added: " + name);
                    imageFiles.push({ name: name });
                } else if (changeType === "update") {
                    logger.debug("Image updated: " + name);
                } else if (changeType === "delete") {
                    logger.debug("Image deleted: " + name);
                    imageFiles = _.reject(imageFiles, function(item) {
                        return item.name === name;
                    });
                }
            }
        }
    });

    server.all('/events', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    server.all('/init', function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    });

    server.get("/events", function(req, res) {
        var event = _.findWhere(events, {consumed: false});
        if (event) {
            event.consumed = true;
            res.json(event);
            logger.debug(event);
        } else {
            res.json({"type": "none"});
            logger.debug('NONE');
        }
    });

    server.get("/init", function(req, res) {
        res.json({elements: elements});
        events = _.reject(events, function(event) {
            return event.type === 'add' || event.type === 'remove';
        });
    });

    server.post('/addImage', function(req, res){
        var full_url = url.format( { protocol: req.protocol, host: req.get('host'), pathname: 'images/' + req.body.images });
        var element = {};
        element.id = req.body.id;
        element.type = 'image';
        element.src = full_url;
        element.top = req.body.top;
        element.left = req.body.left;
        element.bottom = req.body.bottom;
        element.right = req.body.right;
        element.height = req.body.height;
        element.width = req.body.width;
        var event = {};
        event.type = 'addImage';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements.push(element);
        res.redirect('/manual');
    });

    server.post('/addBanner', function(req, res){
        var element = {};
        element.id = req.body.id;
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
        res.redirect('/manual');
    });

    server.post('/remove', function(req, res){
        var element = {};
        element.id = req.body.elements;
        var event = {};
        event.type = 'remove';
        event.element = element;
        event.consumed = false;
        events.push(event);
        elements = _.reject(elements, function(item) {
            return item.id === element.id;
        });
        res.redirect('/manual');
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
        res.redirect('/manual');
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
        res.redirect('/manual');
    });

    server.post('/uploadImage', function(req, res){
        fs.readFile(req.files.uploadedFile.path, function (err, data) {
            if(err) {
                logger.error(err);
                return;
            }
            var newPath = __dirname + "/../public/images/" + req.files.uploadedFile.name;
            fs.writeFile(newPath, data, function (err) {
                res.redirect('/manual');
            });
        });
    });

    server.get('/live.webm',function(req,res){
        logger.info("Enter to ask for video tcp!");
        res.writeHead(200, {
            'Content-Type':'video/mp4',
        });
        videoSocket.pipe(res);
    });

    server.get('/Effects', function(req, res) {
        var effects = ["flash", "bounce", "shake", "tada", "swing", "wobble", "wiggle", "pulse", "flip", "flipInX",
            "flipOutX", "flipInY", "flipOutY", "fadeIn", "fadeInUp", "fadeInDown", "fadeInLeft", "fadeInRight",
            "fadeInUpBig", "fadeInDownBig", "fadeInLeftBig", "fadeInRightBig", "fadeOut", "fadeOutUp", "fadeOutDown",
            "fadeOutLeft", "fadeOutRight", "fadeOutUpBig", "fadeOutDownBig", "fadeOutLeftBig", "fadeOutRightBig",
            "bounceIn", "bounceInDown", "bounceInUp", "bounceInLeft", "bounceInRight", "bounceOut", "bounceOutDown",
            "bounceOutUp", "bounceOutLeft", "bounceOutRight", "rotateIn", "rotateInDownLeft", "rotateInDownRight",
            "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight",
            "rotateOutUpLeft", "rotateOutUpRight", "lightSpeedIn", "lightSpeedOut", "hinge", "rollIn", "rollOut"];
        effects = effects.map(function(item) { return { name: item }; } );
        return res.json(effects);
    });

    server.get('/ImageFiles', function(req, res) {
        return res.json(imageFiles);
    });

    server.get('/Elements', function(req, res) {
        return res.json(elements);
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
        require.resolve('knockout-client/knockout.js'),
        require.resolve('knockback/knockback-core.js'),
        path.join(lib_dir, 'kinetic-v4.5.2.js'),
        path.join(lib_dir, 'bootstrap.min.js'),
    ], {minify: false}); //XXX Hack Dont let uglify minify this: too slow

    // serve using express
    server.get('/js/vendor.js', folio.serve(vendorJs));


    /**
     * Views Javascript Package
     */
    var views = ['manual',
                 'editor',
                 'header'
                ];

    var viewsJs = new folio.Glossary(
        views.map (function (e) {
            return path.join(__dirname, '..', 'public/js/views/', e + '.js');
        })
        ,{minify:server.get('minify')}
    );

    server.get('/js/views.js', folio.serve(viewsJs));

    /**
     * Models Javascript Package
     */

    var models = ['Default', 'Editor', 'Manual', 'Sketch'];

    var modelsJs = new folio.Glossary(
        models.map (function (e) {
            return require.resolve(path.join(__dirname, '../models', e));
        //    return require.resolve('mbc-common/models/' + e);
        })
    );

    server.get('/js/models.js', folio.serve(modelsJs));


    /**
     * Template Javascript Package
     *
     * We are going to use pre-compiled
     * jade on the client-side.
     */

    var templates = ['editor',
                     'manual',
                     'header',
                     'objects',
                    ];

    var getFileName = function (e) {
                return path.join(__dirname, '..', 'views/templates/', e + '.jade');
            };

    var templateJs = new folio.Glossary([
        require.resolve('jade/runtime.js'),
        path.join(__dirname, '..', 'views/templates/js/header.js')].concat(
            templates.map (getFileName)
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
/*
    return appCollection;
*/
}
