var Etiquette   = require('../models/Etiquette')
,   mbc         = require('mbc-common')
,   logger      = mbc.logger().addLogger('editor_driver')
,   conf        = mbc.config.Webvfx
,   url         = require('url')
,   fs          = require('fs')
,   path        = require('path')
,   http_driver = require('./http_driver')
,   scheduler   = require('../scheduler')
;

function editor_driver() {
    logger.info("Creating new instance");
    this.events = Etiquette.Events();
    this.objects = Etiquette.Objects();
    this.init();
}

editor_driver.prototype = new http_driver('editor_driver');

editor_driver.prototype.init = function() {
    logger.info("Initializing driver");
    var self = this;
    this.addPost('/addImage', function(req, res){
        conf.Dirs.uploads
        var full_url = url.format( { protocol: req.protocol, host: req.get('host'), pathname: 'uploads/' + req.body.images });
        if (req.body.images.indexOf("http") >= 0)
            req.body.src = req.body.images;
        else
            req.body.src = full_url;
        self.objects.addImage(req.body);
        return res.json({});
    });

    this.addPost('/addWidget', function(req, res){
        self.objects.addWidget(req.body);
        return res.json({});
    });

    this.addPost('/remove', function(req, res){
        self.objects.removeObject(req.body.elements);
        return res.json({});
    });

    this.addPost('/removeAll', function(req, res){
        self.objects.removeAll();
        return res.json({});
    });

    this.addPost('/addEffect', function(req, res){
        req.body.name = req.body.effects;
        self.events.addAnimation(req.body.elements, req.body);
        return res.json({});
    });

    this.addPost('/move', function(req, res){
        self.events.addMovement(req.body.elements, req.body);
        return res.json({});
    });

    this.addPost('/uploadImage', function(req, res){
        fs.readFile(req.files.uploadedFile.path, function (err, data) {
            if(err) {
                logger.error('Uploading file: ' + err);
                return;
            }
            var newPath = path.join(conf.Dirs.uploads, req.files.uploadedFile.name);
            fs.writeFile(newPath, data, function (err) {
                return res.json({});
            });
        });
    });
    
    this.addPost('/reloadSchedules', function(req, res){
        scheduler.checkSchedules();
        return res.json({});
    });
};

exports = module.exports = function(server) {
    var driver = new editor_driver(server);
    return driver;
};