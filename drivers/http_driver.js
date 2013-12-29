var _         = require('underscore')
,   mbc       = require('mbc-common')
,   logger    = mbc.logger().addLogger('http_driver')
;

function http_driver(name) {
    logger.debug('Creating new instance');
    this.get = [];
    this.post = [];
    this.name = name;
    this.accessControl = function(req, res, next) {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "X-Requested-With");
        next();
    };    
}

http_driver.prototype.processRoutes = function(server) {
    var self = this;
    _.each(this.getGetRoutes(), function(route) {
        logger.debug('Adding get route:', route);
        server.all(route, self.accessControl);
        server.get(route, self.getGetCallback(route));
    });
    _.each(this.getPostRoutes(), function(route) {
        logger.debug('Adding post route:', route);
        server.all(route, self.accessControl);
        server.post(route, self.getPostCallback(route));
    });
}

http_driver.prototype.getName = function() {
    return this.name;
};

http_driver.prototype.addGet = function(route, callback) {
    this.get.push({route: route, callback: callback});
};

http_driver.prototype.addPost = function(route, callback) {
    this.post.push({route: route, callback: callback});
};

http_driver.prototype.getRoutes = function() {
    return _.union(_.pluck(this.get, 'route'), _.pluck(this.post, 'route'));
};

http_driver.prototype.getGetRoutes = function() {
    var routes = _.pluck(this.get, 'route');
    logger.debug('Retriving get routes:', routes.length);
    return routes;
};

http_driver.prototype.getPostRoutes = function() {
    var routes = _.pluck(this.post, 'route');
    logger.debug('Retriving post routes:', routes.length);
    return routes;
};

http_driver.prototype.getGetCallback = function(route) {
    return _.findWhere(this.get, {route: route}).callback;
};

http_driver.prototype.get = function(route, req, res) {
    var callback = this.getGetCallback(route);
    if (callback)
        callback(req, res);
};

http_driver.prototype.getPostCallback = function(route) {
    return _.findWhere(this.post, {route: route}).callback;
};

http_driver.prototype.post = function(route, req, res) {
    var callback = this.getPostCallback(route);
    if (callback)
        callback(req, res);
};

exports = module.exports = http_driver;