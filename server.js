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
    collections    = mbc.config.Common.Collections,
    db             = mbc.db(),
    logger         = mbc.logger().addLogger('webvfx_server'),
/* utilities */
    maxage         = 365 * 24 * 60 * 60 * 1000,
    backends       = require('./backends')(db),
    iobackends     = new mbc.iobackends(db, backends)
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

require('./routes')(server);

var ios = iobackends.get_ios();
var io = backboneio.listen(server.listen(server.get('port'), function(){
    logger.info("Express server listening on port " + server.get('port') + " in mode " + server.settings.env + '\nactive backends: ' +  _.keys(ios));
}), ios);

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
