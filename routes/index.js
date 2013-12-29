module.exports = function(server) {

    var path = require('path')
    , folio = require('folio')
    , jade = require('jade')
    , po2json = require('po2json')
    , i18n = require('i18n-abide')
    , _ = require('underscore')
    , mbc = require('mbc-common')
    , conf = mbc.config.Webvfx
    , commonConf = mbc.config.Common
    , logger  = mbc.logger().addLogger('webvfx_routes')
    , moment = require('moment')
    , uuid = require('node-uuid')
    ;

    var self = require ('mbc-common/models/App.js')
    , appCollection = new self.Collection();

    var accessControl = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    };
    
    var accessRoutes = [];
    _.each(accessRoutes, function(route) {
        server.all(route, accessControl);
    });

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
        require.resolve('moment/moment.js'),
        require.resolve('node-uuid/uuid.js'),
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
                           'schedulePrompt',
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

};
