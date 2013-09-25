var express = require("express"),
    _       = require("underscore"),
    fs      = require('fs'),
    watchr  = require('watchr'),
    maxage = 365 * 24 * 60 * 60 * 1000,
    mbc = require('mbc-common'),
    logger = mbc.logger().addLogger('webvfx_server'),
    url = require('url'),
    net = require('net')
    ;

var loggerStream = {
    write: function(message, encoding) {
        logger.info(message);
    }
};

var server = express();
var events = [];
var elements = [];
var imageFiles = [];
var videoSocket = undefined;

var effects = ["flash", "bounce", "shake", "tada", "swing", "wobble", "wiggle", "pulse", "flip", "flipInX",
    "flipOutX", "flipInY", "flipOutY", "fadeIn", "fadeInUp", "fadeInDown", "fadeInLeft", "fadeInRight",
    "fadeInUpBig", "fadeInDownBig", "fadeInLeftBig", "fadeInRightBig", "fadeOut", "fadeOutUp", "fadeOutDown",
    "fadeOutLeft", "fadeOutRight", "fadeOutUpBig", "fadeOutDownBig", "fadeOutLeftBig", "fadeOutRightBig",
    "bounceIn", "bounceInDown", "bounceInUp", "bounceInLeft", "bounceInRight", "bounceOut", "bounceOutDown",
    "bounceOutUp", "bounceOutLeft", "bounceOutRight", "rotateIn", "rotateInDownLeft", "rotateInDownRight",
    "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight",
    "rotateOutUpLeft", "rotateOutUpRight", "lightSpeedIn", "lightSpeedOut", "hinge", "rollIn", "rollOut"];

var tcpServer = net.createServer(function (socket) {
//    socket.on('data', function (data) {
//      res.write(data);
//    });
//    socket.on('close', function(had_error) {
//        res.end();
//    });
    videoSocket = socket;
});
tcpServer.on('error', function(error) {
    console.error(error);
});
tcpServer.maxConnections = 1;
tcpServer.listen(1111, function() {
    console.log("Server started");
});

server.configure(function(){
    server.set('port', process.env.PORT || 3100);
    server.use(express.logger({ stream: loggerStream, format: 'dev' }));
    server.use(express.compress());
    server.use(express.static(__dirname + '/public', {maxAge: maxage}));
    server.use(express.bodyParser());
});

server.configure('development', function(){
  server.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  server.set('minify', false);
});

server.configure('production', function(){
  server.use(express.errorHandler());
  server.set('minify', true);
});

server.all('/events', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

server.all('/init', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });

server.get("/events", function(req, res) {
    var event = _.findWhere(events, {consumed: false});
    if (event) {
        event.consumed = true;
        res.json(event);
        logger.debug(event);
    } else {
        res.json({"type": "none"});
        logger.debug('NONE');
    }
});

server.get("/init", function(req, res) {
    res.json({elements: elements});
    events = _.reject(events, function(event) {
        return event.type === 'add' || event.type === 'remove';
    });
});

server.get("/", function(req, res) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<table border='0'><tr><td valign='top' style='padding:0 10px 0 15px;'><font size='6em'>Add Banner</font><br/>");
    res.write("<form id='addBanner' action='addBanner' method='post'>");
    res.write("<table border='0'>")
    res.write("<tr><td>Id: </td><td><input type='text' name='id'/></td>");
    res.write("<tr><td>Text: </td><td><input type='text' name='text'/></td>");
    res.write("<tr><td>Background Color: </td><td><input type='text' name='background_color'/></td>");
    res.write("<tr><td>Color: </td><td><input type='text' name='color'/></td>");
    res.write("<tr><td>Scroll: </td><td><input type='checkbox' name='scroll'/></td>");
    res.write("<tr><td>Top: </td><td><input type='text' name='top'/></td>");
    res.write("<tr><td>Left: </td><td><input type='text' name='left'/></td>");
    res.write("<tr><td>Bottom: </td><td><input type='text' name='bottom'/></td>");
    res.write("<tr><td>Right: </td><td><input type='text' name='right'/></td>");
    res.write("<tr><td>Height: </td><td><input type='text' name='height'/></td>");
    res.write("<tr><td>Width: </td><td><input type='text' name='width'/></td></table><br/>");
    res.write("<input type='submit' value='Add'></input>");
    res.write("</form></td>");

    res.write("<td valign='top' style='padding:0 10px 0 15px;'><font size='6em'>Add Image</font><br/>");
    res.write("<form id='addImage' action='addImage' method='post'>");
    res.write("<table border='0'>")
    res.write("<tr><td>Id: </td><td><input type='text' name='id'/></td>");
    res.write("<tr><td>Image: </td><td><select name='images'/>");
    imageFiles.forEach(function(item) {
        res.write("<option>" + item + "</option>");
    });
    res.write("</select></td></tr>");
    res.write("<tr><td>Top: </td><td><input type='text' name='top'/></td>");
    res.write("<tr><td>Left: </td><td><input type='text' name='left'/></td>");
    res.write("<tr><td>Bottom: </td><td><input type='text' name='bottom'/></td>");
    res.write("<tr><td>Right: </td><td><input type='text' name='right'/></td>");
    res.write("<tr><td>Height: </td><td><input type='text' name='height'/></td>");
    res.write("<tr><td>Width: </td><td><input type='text' name='width'/></td></table><br/>");
    res.write("<input type='submit' value='Add'></input>");
    res.write("</form></td>");

    res.write("<td valign='top'><font size='6em' style='padding:0 10px 0 15px;'>Remove</font><br/>");
    res.write("<form id='remove' action='remove' method='post'>");
    res.write("<table border='0'>");
    res.write("<tr><td>Id: </td><td><select name='elements'/>");
    elements.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("</select></td></tr></table><br/>");
    res.write("<input type='submit' value='Remove'></input>");
    res.write("</form></td>");

    res.write("<td valign='top'><font size='6em' style='padding:0 10px 0 15px;'>Effects</font><br/>");
    res.write("<form id='addEffect' action='addEffect' method='post'>");
    res.write("<table border='0'>");
    res.write("<tr><td>Id: </td><td><select name='elements'/>");
    elements.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("</select></td></tr>");
    res.write("<tr><td>Effect: </td><td><select name='effects'/>");
    effects.forEach(function(item) {
        res.write("<option>" + item + "</option>");
    });
    res.write("</select></td></tr>");
    res.write("<tr><td>Duration: </td><td><input type='text' name='duration'/></td></tr>");
    res.write("<tr><td>Iterations: </td><td><input type='text' name='iterations'/></td></tr>");
    res.write("<tr><td>Delay: </td><td><input type='text' name='delay'/></td></tr></table><br/>");
    res.write("<input type='submit' name='animate' value='Add'></input>");
    res.write("</form></td>");

    res.write("<td valign='top'><font size='6em' style='padding:0 10px 0 15px;'>Move</font><br/>");
    res.write("<form id='move' action='move' method='post'>");
    res.write("<table border='0'>");
    res.write("<tr><td>Id: </td><td><select name='elements'/>");
    elements.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("<tr><td>X: </td><td><input type='text' name='x'/></td></tr>");
    res.write("<tr><td>Y: </td><td><input type='text' name='y'/></td></tr>");
    res.write("<tr><td>Duration: </td><td><input type='text' name='duration'/></td></tr></table><br/>");
    res.write("<input type='submit' name='move' value='Move'></input>");
    res.write("</form></td></tr>");

    res.write("<tr><td valign='top' style='padding:0 10px 0 15px;'><font size='6em'>Upload image</font><br/>");
    res.write("<form id='uploadImage' action='uploadImage' method='post' , enctype='multipart/form-data'>");
    res.write("<input type='file' name='uploadedFile'></input><br/><br/>");
    res.write("<input type='submit' value='Upload'></input>");
    res.write("</form></td></tr></table>");

    res.end();
});

server.get("/editor", function(req, res) {
    res.redirect('/editor.html');
});

server.get('/live.webm',function(req,res){
    console.log("Entro a pedir el video tcp!");
    res.writeHead(200, {
        'Content-Type':'video/mp4',
    });
    videoSocket.pipe(res);
});

server.post('/addImage', function(req, res){
    var full_url = url.format( { protocol: req.protocol, host: req.get('host'), pathname: 'images/' + req.body.images });
    var element = {};
    element.id = req.body.id;
    element.type = 'image';
    element.src = full_url;
    element.top = req.body.top;
    element.left = req.body.left;
    element.bottom = req.body.bottom;
    element.right = req.body.right;
    element.height = req.body.height;
    element.width = req.body.width;
    var event = {};
    event.type = 'addImage';
    event.element = element;
    event.consumed = false;
    events.push(event);
    elements.push(element);
    res.redirect('/');
});

server.post('/addBanner', function(req, res){
    var element = {};
    element.id = req.body.id;
    element.type = 'banner';
    element.top = req.body.top;
    element.left = req.body.left;
    element.bottom = req.body.bottom;
    element.right = req.body.right;
    element.height = req.body.height;
    element.width = req.body.width;
    element.background_color = req.body.background_color;
    element.color = req.body.color;
    element.text = req.body.text;
    element.scroll = req.body.scroll;
    var event = {};
    event.type = 'addBanner';
    event.element = element;
    event.consumed = false;
    events.push(event);
    elements.push(element);
    res.redirect('/');
});

server.post('/remove', function(req, res){
    var element = {};
    element.id = req.body.elements;
    var event = {};
    event.type = 'remove';
    event.element = element;
    event.consumed = false;
    events.push(event);
    elements = _.reject(elements, function(item) {
        return item.id === element.id;
    });
    res.redirect('/');
});

server.post('/addEffect', function(req, res){
    var element = {};
    element.id = req.body.elements;
    var animation = {};
    animation.name = req.body.effects;
    animation.duration = req.body.duration;
    animation.iterations = req.body.iterations;
    animation.delay = req.body.delay;
    var event = {};
    event.type = 'animation';
    event.element = element;
    event.animation = animation;
    event.consumed = false;
    events.push(event);
    res.redirect('/');
});

server.post('/move', function(req, res){
    var element = {};
    element.id = req.body.elements;
    var move = {};
    move.x = req.body.x;
    move.y = req.body.y;
    move.duration = req.body.duration;
    var event = {};
    event.type = 'move';
    event.element = element;
    event.move = move;
    event.consumed = false;
    events.push(event);
    res.redirect('/');
});

server.post('/uploadImage', function(req, res){
    fs.readFile(req.files.uploadedFile.path, function (err, data) {
        var newPath = __dirname + "/public/images/" + req.files.uploadedFile.name;
        fs.writeFile(newPath, data, function (err) {
            res.redirect('/');
        });
    });
});

watchr.watch({
    paths: ["./public/images"],
    listeners: {
        error: function(err){
            logger.error("Error while watching images dir", err);
        },
        watching: function(err, watcherInstance, isWatching){
            if (err) {
                logger.error("Error while watching images dir", err);
            } else {
                logger.info("Watching playlists dir");
            }
        },
        change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
            var name = filePath.substring(filePath.lastIndexOf("/") + 1);

            if (changeType === "create") {
                logger.debug("Image added: " + name);
                imageFiles.push(name);
            } else if (changeType === "update") {
                logger.debug("Image updated: " + name);
            } else if (changeType === "delete") {
                logger.debug("Image deleted: " + name);
                imageFiles = _.reject(imageFiles, function(item) {
                    return item === name;
                });
            }
        }
    }
});
var files = fs.readdirSync("./public/images");
files.forEach(function(element){
    imageFiles.push(element);
});

server.listen(server.get('port'), function() {
    logger.info("Express server listening on port " + server.get('port') + " in mode " + server.settings.env);
});
