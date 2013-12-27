var Backbone  = require('backbone')
,   mbc       = require('mbc-common')
,   logger    = mbc.logger().addLogger('models')
,   semaphore = require('semaphore')
,   _         = require('underscore')
,   moment    = require('moment')
;

var Etiquette = {};

Etiquette.WebVfxObject = Backbone.Model.extend({
    /* ATTRS:
     * id
     * zindex
     * type
     */
});

Etiquette.WebVfxImage = Etiquette.WebVfxObject.extend({
    /* ATTRS:
     * src
     * top
     * left
     * bottom
     * right
     * height
     * width
     */
    defaults: {
        type: 'image'
    }
});

Etiquette.WebVfxWidget = Etiquette.WebVfxObject.extend({
    /* ATTRS:
     * options:
     *      id
     *      type
     *      text
     *      interval
     *      animation
     *      style:
     *          width
     *          height
     *          top
     *          left
     */
    defaults: {
        type: 'widget'
    }
});

Etiquette.WebVfxObjectCollection = Backbone.Collection.extend({
    model: Etiquette.WebVfxObject
});

Etiquette.LoadedWebVfxObjectCollection = Etiquette.WebVfxObjectCollection.extend({
    lock: {
        sem: semaphore(1),
        take: function(callback) {
            logger.debug("Objects semaphore taken");
            this.sem.take(callback);
        },
        leave: function() {
            logger.debug("Objects semaphore leaved");
            this.sem.leave();
        }
    },
    
    getObject: function(id, callback) {
        logger.debug("getObject invoked");
        var self = this;
        this.lock.take(function() {
            var object = self.get(id);
            self.lock.leave();
            logger.debug("Object to serve:", object);
            callback(object);
        });
    },

    getAllObjects: function(callback) {
        logger.debug("getAllObjects invoked");
        var self = this;
        this.lock.take(function() {
            var objects = self.models;
            self.lock.leave();
            logger.debug("Objects to serve:", objects);
            callback(objects);
        });
    },

    addObject: function(object) {
        logger.debug("addObject invoked:", object);
        var self = this;
        this.lock.take(function() {
            logger.debug("Adding object:", object);
            self.add(object, {merge: true});
            var events = Etiquette.Events();
            var event = new Etiquette.WebVfxEvent({type: events.getEventName(object.get('type')), object: object});
            events.addEvent(event, function() {
                self.lock.leave();
            });
        });
    },

    addImage: function(attrs) {
        logger.debug("addImage invoked:", attrs);
        var image = new Etiquette.WebVfxImage(attrs);
        this.addObject(image);
    },
    
    addWidget: function(attrs) {
        logger.debug("addWidget invoked:", attrs);
        if (_.isString(attrs.options))
            attrs.options = JSON.parse(attrs.options);
        var widget = new Etiquette.WebVfxWidget(attrs);
        this.addObject(widget);
    },
            
    removeObject: function(id) {
        logger.debug("removeObject invoked:", id);
        var self = this;
        this.lock.take(function() {
            logger.debug("Removing object:", id);
            var object = self.get(id);
            if (!object) {
                logger.debug("Object not found!");
                self.lock.leave();
                return;
            }
            var events = Etiquette.Events();
            var event = new Etiquette.WebVfxEvent({type: events.getEventName('remove'), object: object});
            logger.debug("Sending remove event:", event);
            events.addEvent(event, function() {
                logger.debug("Removing object from collection");
                self.remove(object);
                self.lock.leave();
            });
        });
    }, 
    
    removeAll: function() {
        logger.debug("removeAll invoked");
        var self = this;
        this.lock.take(function() {
            logger.debug("Removing all objects");
            var events = Etiquette.Events();
            events.removeAll(function() {
                var done = _.after(self.length, function() {
                    self.reset();
                    self.lock.leave();
                });
                self.forEach(function(object) {
                    var event = new Etiquette.WebVfxEvent({type: events.getEventName('remove'), object: object});
                    events.addEvent(event, done);
                });
            });
        });
    }
    
});

Etiquette.WebVfxEvent = Backbone.Model.extend({
    /* ATTRS:
     * type
     * object
     */
});

Etiquette.WebVfxAnimation = Etiquette.WebVfxEvent.extend({
    /* ATTRS:
     * animation:
     *      name
     *      duration
     *      iteration
     *      delay
     */
    defaults: {
        type: 'animation'
    }
});

Etiquette.WebVfxMovement = Etiquette.WebVfxEvent.extend({
    /* ATTRS:
     * move:
     *      x
     *      y
     *      duration
     */
    defaults: {
        type: 'move'
    }
});

Etiquette.WebVfxEventCollection = Backbone.Collection.extend({
    model: Etiquette.WebVfxEvent,
    lock: {
        sem: semaphore(1),
        take: function(callback) {
            logger.debug("Events semaphore taken");
            this.sem.take(callback);
        },
        leave: function() {
            logger.debug("Events semaphore leaved");
            this.sem.leave();
        }
    },
    events: [
        {type: 'image', name: 'addImage'},
        {type: 'widget', name: 'addWidget'},
        {type: 'remove', name: 'remove'}
    ],
    
    getEventName: function(objName) {
        var event = _.findWhere(this.events, {type: objName});
        return event.name;
    },

    getNextEvent: function(callback) {
        logger.debug("getNextEvent invoked");
        var self = this;
        this.lock.take(function() {
            logger.debug("Checking events:", self.length);
            if (self.length) {
                var event = self.at(0);
                event = self.remove(event);
                self.lock.leave();
                logger.debug("Event to serve:", event);
                callback(event);
            } else {
                self.lock.leave();
                logger.debug("No events");
                callback(false);
            }
        });
    },
            
    addEvent: function(event, callback) {
        logger.debug("addEvent invoked:", event);
        var self = this;
        this.lock.take(function() {
            logger.debug("Adding event:", event);
            self.add(event);
            self.lock.leave();
            if (callback)
                callback();
        });
    },
            
    removeAll: function(callback) {
        logger.debug("removeAll invoked");
        var self = this;
        self.lock.take(function() {
            logger.debug("Removing all events");
            self.reset();
            self.lock.leave();
            if (callback)
                callback();
        });
    },
            
    addAnimation: function(objectId, attrs) {
        logger.debug("addAnimation invoked", attrs);
        var self = this;
        this.lock.take(function() {
            logger.debug('Adding animation', attrs);
            Objects.getObject(objectId, function(object) {
                var event = new Etiquette.WebVfxAnimation({object: object, animation: attrs});
                self.add(event);
                self.lock.leave();
            });
        });
    },

    addMovement: function(objectId, attrs) {
        logger.debug("addMovement invoked", attrs);
        var self = this;
        this.lock.take(function() {
            logger.debug('Adding movement', attrs);
            Objects.getObject(objectId, function(object) {
                var event = new Etiquette.WebVfxMovement({object: object, move: attrs});
                self.add(event);
                self.lock.leave();
            });
        });
    }

});

Etiquette.Schedule = Backbone.Model.extend({
    /* ATTRS
     * id
     * sketch_id
     * start
     * end
     * startTimeout
     * endTimeout
     * source
     * objects
     */
    defaults: {
        startTimeout: false,
        endTimeout: false
    },
    initialize: function(attributes) {
        this.set('start', attributes.date);
        if (attributes.length) 
            this.set('end', attributes.date + attributes.length);
        else
            this.set('end', false);
        if (!attributes.id)
            this.set('id', attributes._id);
    }
});

Etiquette.SchedulesCollection = Backbone.Collection.extend({
    model: Etiquette.Schedule
});

Etiquette.LoadedSchedulesCollection = Etiquette.SchedulesCollection.extend({
    addSchedule: function(schedule) {
        logger.debug('Adding schedule', schedule);
        this.unloadSchedule(schedule.id);
        var now = moment().valueOf();
        var start = -1;
        var end = -1;
        
        /* check if it should start in the future */
        if (schedule.get('start') > now) 
            start = schedule.get('start') - now;
        
        /* check if it should end in the future */
        if (schedule.get('end') && schedule.get('end') > now) 
            end = schedule.get('end') - now;

        /* if start was past and it should end in the future or it shouldnt end at all, set start = 0 */
        if (start < 0 && (end >= 0 || !schedule.get('end')))
            start = 0;
        
        logger.debug("Sched start:", start);
        logger.debug("Sched end:", end);
        var self = this;
        if (start >= 0) {
            logger.debug("Setting start timeout for schedule:", schedule.id, start);
            schedule.set('startTimeout', setTimeout(function() {
                self.loadSchedule(schedule.id);
            }, start));
            if (end >= 0) {
                logger.debug("Setting end timeout for schedule:", schedule.id, end);
                schedule.set('endTimeout', setTimeout(function() {
                    self.unloadSchedule(schedule.id);
                }, end));
            }
            this.add(schedule);
        }
    }, 
    loadSchedule: function(id) {
        logger.debug("Loading schedule:", id);
        var schedule = this.get(id);
        if (schedule) {
            schedule.get('objects').forEach(function(object) {
                Etiquette.Objects().addObject(object);
            });
        }
    },
    unloadSchedule: function(id) {
        logger.debug("Unloading schedule:", id);
        var schedule = this.get(id);
        if (schedule) {
            schedule.get('objects').forEach(function(object) {
                Etiquette.Objects().removeObject(object.id);
            });
            this.removeSchedule(id);
        }
    },
    unloadSchedules: function(ids) {
        var self = this;
        _.each(ids, function(id) {
            self.unloadSchedule(id);
        });
    },
    removeSchedule: function(id) {
        logger.debug("Removing schedule:", id);
        var schedule = this.remove(id);
        if (schedule) {
            clearTimeout(schedule.get('startTimeout'));
            if (schedule.get('endTimeout'))
                clearTimeout('endTimeout');
        }
    }
});

Etiquette._globals = {};

Etiquette.Events = function() {
    return Etiquette._globals.events || (Etiquette._globals.events = new Etiquette.WebVfxEventCollection());
};

Etiquette.Objects = function() {
    return Etiquette._globals.objects || (Etiquette._globals.objects = new Etiquette.LoadedWebVfxObjectCollection());
};

Etiquette.Schedules = function() {
    return Etiquette._globals.schedules || (Etiquette._globals.schedules = new Etiquette.LoadedSchedulesCollection());
};

exports = module.exports = Etiquette;