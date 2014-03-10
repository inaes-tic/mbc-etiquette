/* require all the libs we use */
var _              = require('underscore'),
    express        = require('express'),
    path           = require('path'),
    exec           = require('child_process').exec,
    i18n           = require('i18n-abide'),
    backboneio     = require('backbone.io'),
    uuid           = require('node-uuid'),
    url            = require('url'),
/* shared mbc code */
    mbc            = require('mbc-common'),
    conf           = mbc.config.Webvfx,
    common_conf    = mbc.config.Common,
    collections    = common_conf.Collections,
    db             = mbc.db(),
    logger         = mbc.logger().addLogger('webvfx_server'),
/* utilities */
    backends       = require('./backends')(db),
    iobackends     = new mbc.iobackends(db, backends)
;

iobackends.patchBackbone();

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

var app = express();

app.configure(function(){
    app.use(i18n.abide({
        supported_languages: ['en-US', 'es', 'db-LB', 'it-CH'],
        default_lang: 'es',
        debug_lang: 'it-CH',
        translation_directory: 'locale'
    }));

    app.set('port', process.env.PORT || 3100);
    app.set('views', conf.Dirs.views);
    app.set('view engine', 'jade');
    app.use(express.logger({ stream: loggerStream, format: 'dev' }));
    app.use(express.compress());
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.cookieSession({ secret: 'your secret here', cookie: { maxAge: common_conf.Others.maxage }}));
    app.use(require('less-middleware')({
        src:  conf.Dirs.styles,
        dest: conf.Dirs.pub,
        compress: true}
    ));
    app.use(express.static(conf.Dirs.pub, {maxAge: common_conf.Others.maxage}));
    app.use('/models', express.static(conf.Dirs.models, {maxAge: common_conf.Others.maxage}));
    app.use('/lib',    express.static(conf.Dirs.vendor, {maxAge: common_conf.Others.maxage}));
    app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.set('io.loglevel', 100);
  app.set('minify', false);
});

app.configure('production', function(){
  app.use(express.errorHandler());
  app.set('io.loglevel', 1);
  app.set('minify', true);
});

require('./routes')(app);

var ios = iobackends.get_ios();
var server = app.listen(app.get('port'), function(){
    logger.info("Express server");
    logger.info("listening on port: " + app.get('port'));
    logger.info("--------- in mode: " + app.settings.env);
    logger.info("  active backends: " + _.keys(ios));
});
server.on ('error', function (err) {
    logger.error ('Fatal Error starting Express Server:', err.message);
    process.exit(1);
});
var io = backboneio.listen(server, ios);

io.configure('production', function(){
    // send minified client
    io.enable('browser client minification');
    // apply etag caching logic based on version number
    io.enable('browser client etag');
    // gzip the file
    io.enable('browser client gzip');
});

if (process.env.HEROKU) {
    io.configure(function () {
        io.set("transports", ["xhr-polling"]);
        io.set("polling duration", 10);
    });
}

io.set('logger', logger); // Log socket.io with custom logger
