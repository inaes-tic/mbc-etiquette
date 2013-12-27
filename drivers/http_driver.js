var _         = require('underscore')
,   mbc       = require('mbc-common')
,   logger    = mbc.logger().addLogger('http_driver')
;

function http_driver(name) {
    logger.debug('Creating new instance');
    this.get = [];
    this.post = [];
    this.name = name;
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