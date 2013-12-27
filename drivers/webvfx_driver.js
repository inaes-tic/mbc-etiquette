var Etiquette   = require('../models/Etiquette')
,   mbc         = require('mbc-common')
,   logger      = mbc.logger().addLogger('webvfx_driver')
,   http_driver = require('./http_driver')
;

function webvfx_driver() {
    logger.info("Creating new instance");
    this.events = Etiquette.Events();
    this.objects = Etiquette.Objects();
}

webvfx_driver.prototype = new http_driver('webvfx_driver');

webvfx_driver.prototype.init = function() {
    logger.info("Initializing driver");
    var self = this;
    this.addGet("/events", function(req, res) {
        self.events.getNextEvent(function(event) {
            if (event) {
                res.json(event);
            } else {
                res.json({"type": "none"});
            }
        });
    });

    this.addGet("/init", function(req, res) {
        self.objects.getAllObjects(function(objects) {
            res.json({elements: objects});
        });
    });
};

exports = module.exports = function() {
    var driver = new webvfx_driver();
    return driver;
};