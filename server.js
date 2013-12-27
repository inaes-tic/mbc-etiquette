var express = require("express"),
    _       = require("underscore"),
    exec    = require('child_process').exec,
    i18n    = require('i18n-abide'),
    maxage = 365 * 24 * 60 * 60 * 1000,
    backboneio = require('backbone.io'),
    mbc = require('mbc-common'),
    conf = mbc.config.Webvfx,
    logger = mbc.logger().addLogger('webvfx_server'),
    url = require('url'),
    collections = mbc.config.Common.Collections,
    uuid = require('node-uuid'),
    scheduler = require('./scheduler'),
    webvfx_driver = require('./drivers/webvfx_driver'),
    editor_driver = require('./drivers/editor_driver')
    ;

var loggerStream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

/* make sure at runtime that we atempt to get the dirs we need */
for (d in conf.Dirs) {
    /* HACK: but I'm not going to waist time writing mkdir -p */
    exec ('mkdir -p ' + conf.Dirs[d], function (error, stdout, stderr) {
        if (error !== null) {
            logger.error('exec error: ' + error);
        }
    });
}

var server = express();

server.configure(function(){
    server.use(i18n.abide({
        supported_languages: ['en-US', 'es', 'db-LB', 'it-CH'],
        default_lang: 'es',
        debug_lang: 'it-CH',
        translation_directory: 'locale'
    }));

    server.set('port', process.env.PORT || 3100);
    server.set('views', conf.Dirs.views);
    server.set('view engine', 'jade');
    server.use(express.logger({ stream: loggerStream, format: 'dev' }));
    server.use(express.compress());
    server.use(express.bodyParser());
    server.use(express.methodOverride());
    server.use(express.cookieParser());
    server.use(express.cookieSession({ secret: 'your secret here', cookie: { maxAge: maxage }}));
    server.use(require('less-middleware')({
        src:  conf.Dirs.styles,
        dest: conf.Dirs.pub,
        compress: true}
    ));
    server.use(express.static(conf.Dirs.pub, {maxAge: maxage}));
    server.use('/models', express.static(conf.Dirs.models, {maxAge: maxage}));
    server.use('/lib',    express.static(conf.Dirs.vendor, {maxAge: maxage}));
    server.use(server.router);
});

server.configure('development', function(){
  server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  server.set('io.loglevel', 100);
  server.set('minify', false);
});

server.configure('production', function(){
  server.use(express.errorHandler());
  server.set('io.loglevel', 1);
  server.set('minify', true);
});

/* DRIVERS INITIALIZATION */
var wdriver = new webvfx_driver();
var edriver = new editor_driver(server);
var drivers = [wdriver, edriver];

require('./routes')(server, drivers);

function debug_backend (backend) {
    backend.use(function(req, res, next) {
        logger.debug('Backend: ', req.backend);
        logger.debug('Method: ', req.method);
        logger.debug('Channel: ', req.channel);
        logger.debug('Options: ', JSON.stringify(req.options));
        logger.debug('Model: ', JSON.stringify(req.model));
        next();
    });
}

function id_middleware(req, res, next) {
    if( req.method == 'create' && req.model._id === undefined) {
        req.model._id = uuid.v1();
    }
    next();
}

var db = mbc.db();
var appbackend = backboneio.createBackend();
var sketchbackend = backboneio.createBackend();
var sketchschedulebackend = backboneio.createBackend();

var backends = [ appbackend, sketchbackend, sketchschedulebackend ];
_(backends).each (debug_backend);

appbackend.use(backboneio.middleware.configStore());

sketchbackend.use(id_middleware);
sketchbackend.use(backboneio.middleware.mongoStore(db, collections.Sketchs, {}));

sketchschedulebackend.use(id_middleware);
sketchschedulebackend.use(backboneio.middleware.mongoStore(db, collections.SketchSchedules, {}));

var io = backboneio.listen(server.listen(server.get('port'), function(){
    logger.info("Express server listening on port " + server.get('port') + " in mode " + server.settings.env);
}), { appbackend: appbackend,
      sketchbackend: sketchbackend,
      sketchschedulebackend: sketchschedulebackend,
    });

io.configure('production', function(){
    io.enable('browser client minification');   // send minified client
    io.enable('browser client etag');           // apply etag caching logic based on version number
    io.enable('browser client gzip');           // gzip the file
});

if (process.env.HEROKU) {
    io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
    });
}

io.set('logger', logger); // Log socket.io with custom logger

scheduler.initScheduler();