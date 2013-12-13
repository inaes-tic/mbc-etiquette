var _    = require('underscore')
, mbc    = require('mbc-common')
, logger = mbc.logger().addLogger('event_manager')
;

var EventManager = {};

EventManager.events = [];
EventManager.elements = [];

EventManager.getNextEvent = function() {
    logger.debug("getNextEvent invoked");
    var event = _.findWhere(EventManager.events, {consumed: false});
    logger.debug("Event to serve:", event);
    if (event) {
        logger.debug(event);
        event.consumed = true;
        return event;
    } else {
        logger.debug('Event: NONE');
        return false;
    }
};

EventManager.getAllElements = function() {
    logger.debug("getAllElements invoked");
    logger.debug("Elements to serve:", EventManager.elements);
    EventManager.events = _.reject(EventManager.events, function(event) {
        return event.type === 'add' || event.type === 'remove';
    });
    return EventManager.elements;
};

EventManager.addImage = function(image) {
    logger.debug("addImage invoked");
    logger.debug("Image to add", image);
    var element = EventManager.getBaseElement(image);
    element.type = 'image';
    element.src = image.src;
    EventManager.addElement(element);
};

EventManager.addBanner = function(banner) {
    logger.debug("addBanner invoked");
    logger.debug("Banner to add:", banner);
    var element = EventManager.getBaseElement(banner);
    element.type = 'banner';
    element.background_color = banner.background_color;
    element.color = banner.color;
    element.text = banner.text;
    element.scroll = banner.scroll;
    EventManager.addElement(element);
};

EventManager.addWidget = function(widget) {
    logger.debug("addWidget invoked");
    logger.debug("Widget to add:", widget);
    var element = {};
    element.id = widget.id;
    element.type = 'widget';
    element.options = JSON.parse(widget.options);
    element.zindex = widget.zindex;
    EventManager.addElement(element);
};

EventManager.getBaseElement = function(object) {
    var element = {};
    element.id = object.id;
    element.top = object.top;
    element.left = object.left;
    element.bottom = object.bottom;
    element.right = object.right;
    element.height = object.height;
    element.width = object.width;
    return object;
};

EventManager.addElement = function(element) {
    logger.debug("addElement invoked");
    logger.debug("Element to add:", element);
    EventManager.removeElement(element.id, true);
    var type = undefined;
    if (element.type === 'image') 
        type = 'addImage';
    else if (element.type === 'banner')
        type = 'addBanner';
    else if (element.type === 'widget')
        type = 'addWidget';
    EventManager.addEvent(type, element);
    EventManager.elements.push(element);
};

EventManager.addEvent = function(type, element, extra) {
    logger.debug("addEvent invoked for type:", type);
    logger.debug("Element:", element);
    if (extra)
        logger.debug("Extra:", extra);
    var event = {};
    event.type = type;
    event.element = element;
    event.consumed = false;
    if (type === 'animation')
        event.animation = extra;
    else if (type === 'move') 
        event.move = extra;
    EventManager.events.push(event);
};

EventManager.removeElement = function(id, skipEvent) {
    logger.debug("removeElement invoked");
    logger.debug("Element to remove", id);
    var element = {};
    element.id = id;
    if (!skipEvent)
        EventManager.addEvent('remove', element);
    EventManager.elements = _.reject(EventManager.elements, function(item) {
        return item.id === element.id;
    });
};

EventManager.addEffect = function(elementId, effect) {
    logger.debug("addEffect invoked for element:", elementId);
    logger.debug("Effect to add:", effect);
    var element = {};
    element.id = elementId;
    var animation = {};
    animation.name = effect.name;
    animation.duration = effect.duration;
    animation.iterations = effect.iterations;
    animation.delay = effect.delay;
    EventManager.addEvent('animation', element, animation);
};

EventManager.moveElement = function(elementId, movement) {
    logger.debug("moveElement invoked for element:", elementId);
    logger.debug("Movement to add:", movement);
    var element = {};
    element.id = elementId;
    var move = {};
    move.x = movement.x;
    move.y = movement.y;
    move.duration = movement.duration;
    EventManager.addEvent('move', element, move);
};

exports = module.exports = EventManager;