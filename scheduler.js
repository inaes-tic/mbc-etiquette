var moment = require('moment')
, _ = require('underscore')
, mbc = require('mbc-common')
, collections = mbc.config.Common.Collections
, logger = mbc.logger().addLogger('webvfx_scheduler')
, conf = mbc.config.Webvfx
, Sketch = require('mbc-common/models/Sketch')
;

function scheduler() {
    logger.debug("New instance created");
}

scheduler.prototype.initScheduler = function() {
    logger.info("Starting Scheduler");
    var proceed = _.after(3, function() {
        self.loadSchedules(self.scheds);
    });
    this.scheds = new Sketch.ScheduleCollection();
    this.scheds.bindBackend();
    var self = this;
    this.scheds.fetch({success: function() {
        self.scheds.on({"add": function(sched, col, opts) {
                            logger.debug("ADD received", sched.toJSON());
                            if (!opts.ignore)
                                self.processSched.bind(self)(sched);
                        },
                        "remove": function(sched, col, opts) {
                            logger.debug("REMOVE received", sched.toJSON());
                            if (!opts.ignore)
                                self.removeSched.bind(self)(sched);
                        }
        });
        proceed();
    }});
    this.sketchs = new Sketch.Collection();
    this.sketchs.bindBackend();
    this.sketchs.fetch({success: proceed});
    this.live = new Sketch.LiveCollection();
    this.live.bindBackend();
    this.live.fetch({success: proceed});
};

scheduler.prototype.loadSchedules = function(col) {
    logger.info("Loading Schedules");
    logger.debug("Schedules", col.toJSON());
    var self = this;
    col.forEach(function(sched) {
        self._processSched(sched);
    });
};

scheduler.prototype.processSched = function(sched) {
    var self = this;
    this.sketchs.fetch({success: function() {
        self._processSched.bind(self)(sched);
    }});
};

scheduler.prototype._processSched = function(sched) {
    logger.info("Processing sched", sched.toJSON());
    var self = this;
    var now = moment().valueOf();
    var start = sched.get("date");
    var end = false;
    if (sched.get("length"))
        end = start + sched.get("length");
    if (!end || (end > now))
        self.addSched.bind(self)(sched, start, end, now);
    else
        self.removeSched.bind(self)(sched);
};

scheduler.prototype.removeSched = function(sched) {
    logger.info("Removing sched", sched.toJSON());
    if (sched.get("startTimeout"))
        cancelTimeout(sched.get("startTimeout"));
    if (sched.get("endTimeout"))
        cancelTimeout(sched.get("endTimeout"));
    this.unloadSketch(sched.get("sketch_id"));
    this.scheds.remove(sched.get("id"));
    sched.destroy({ignore: true});
};

scheduler.prototype.addSched = function(sched, start, end, now) {
    logger.debug("Adding sched", start, end, now, sched.toJSON());
    var self = this;
    if (now === undefined)
        now = moment.valueOf();
    if (start === undefined)
        start = sched.get("date");
    if (end === undefined) {
        end = false;
        if (sched.get("length"))
            end = start + sched.get("length");
    }

    if (start > now)
        sched.set("startTimeout", self.getTimeout(sched.get("sketch_id"), true, start - now));
    else
        self.loadSketch(sched.get("sketch_id"));

    if (end) {
        if (end > now)
            sched.set("endTimeout", self.getTimeout(sched.get("sketch_id"), false, end - now));
        else
            self.unloadSketch(sched.get("sketch_id"));
    }
};

scheduler.prototype.getTimeout = function(sketch_id, load, timeout) {
    logger.info("Setting timeout for " + (load ? 'load' : "unload") + " in " + timeout + " millis");
    var self = this;
    return setTimeout(function() {
        if (load)
            self.loadSketch(sketch_id);
        else
            self.unloadSketch(sketch_id);
    }, timeout);
};

scheduler.prototype.loadSketch = function(id) {
    var self = this;
    var sketch = this.sketchs.get(id);
    if (sketch) {
        logger.info("Loading sketch", sketch.attributes.name);
        _.each(sketch.attributes.data, function(data) {
            data.origin = 'server';
            var new_model = new Sketch.Live(data);
            self.live.add(new_model);
            new_model.save();
        });
        logger.debug("Sketch " + sketch.attributes.name + " loaded");
    }
};

scheduler.prototype.unloadSketch = function(id) {
    var self = this;
    var sketch = this.sketchs.get(id);
    if (sketch) {
        logger.info("Unloading sketch", sketch.attributes.name);
        self.live.fetch({success: function() {
            _.each(sketch.attributes.data, function(data) {
                var model = self.live.findWhere({element_id: data.element_id});
                model.destroy();
                logger.info('Sketch unloaded', sketch.attributes.name);
            });
        }});
        logger.debug("Sketch " + sketch.attributes.name + " unloaded");
    }
};

exports = module.exports = scheduler;

scheduler.__proto__ = new scheduler;
