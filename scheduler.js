var moment       = require('moment')
,   _            = require('underscore')
,   mbc          = require('mbc-common')
,   collections  = mbc.config.Common.Collections
,   logger       = mbc.logger().addLogger('webvfx_scheduler')
,   conf         = mbc.config.Webvfx
,   Etiquette    = require('./models/Etiquette')
;

function scheduler() {
    logger.debug("New instance created");
    this.loadedSchedules = Etiquette.Schedules();
    this.currentScheds = new Etiquette.SchedulesCollection();
}

scheduler.prototype.initScheduler = function() {
    logger.info("Starting Scheduler");
    var self = this;
    var db = mbc.db();
    self.schedules = db.collection(collections.SketchSchedules);
    self.sketchs = db.collection(collections.Sketchs);
    self.checkSchedules();
};

scheduler.prototype.checkSchedules = function() {
    var self = this;
    logger.debug("Checking schedules...");
//    logger.debug("Loaded schedules:", self.loadedSchedules);
//    var now = moment().valueOf();
    //TODO: load only x hours of schedules???
    var query = {};
//    query.date = { $lte: now };
    this.currentScheds.reset();
    self.schedules.findItems(query, function(err, scheds) {
        if (err) {
            logger.error("Error obtaining schedules: ", err);
            return;
        }
        if (scheds) {
            logger.debug("Processing sched list:", scheds);
            scheds.forEach(function(sched) {
                logger.debug("Processing sched:", sched);
                self.addSched(sched);
            });
        }
    });
    var toRemove = [];
    this.loadedSchedules.forEach(function(sched) {
        if (!self.currentScheds.contains(sched))
            toRemove.push(sched.id);
    });
    if (toRemove.length > 0)
        this.loadedSchedules.unloadSchedules(toRemove);
};

scheduler.prototype.addSched = function(sched) {
    logger.info("Adding sched:", sched);
    var self = this;
    self.sketchs.findById(sched.sketch_id, function(err, sketch) {
        var objects = new Etiquette.WebVfxObjectCollection();
        _.each(sketch.data, function(s) {
            logger.debug("Adding object:", s);
            var element = {};
            //TODO: UGLY HACK FOR NOT REPEATING IDS
            element.id = sched._id + "---" + s.id;
            if (s.type === 'image') {
                if (s.top)
                    element.top = s.top + 'px';
                if (s.left)
                    element.left = s.left + 'px';
                if (s.height)
                    element.height = s.height + 'px';
                if (s.width)
                    element.width = s.width + 'px';
                element.type = 'image';
                element.src = (conf.server || 'http://localhost:3100') + '/uploads/' + s.name;
                objects.add(new Etiquette.WebVfxImage(element));
            } else {
                element.type = 'widget';
                s.id = element.id;
                element.options = s;
                objects.add(new Etiquette.WebVfxWidget(element));
            }
        });
        sched.objects = objects;
        var schedule = new Etiquette.Schedule(sched);
        self.loadedSchedules.addSchedule(schedule);
        self.currentScheds.add(schedule);
    });
};

exports = module.exports = scheduler;

scheduler.__proto__ = new scheduler;
