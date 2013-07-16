var express = require("express"),
    _       = require("underscore"),
    fs      = require('fs'),
    watchr  = require('watchr');

var server = express();
var event = false;
var images = [];
var imageFiles = [];
var effects = ["flash", "bounce", "shake", "tada", "swing", "wobble", "wiggle", "pulse", "flip", "flipInX", 
    "flipOutX", "flipInY", "flipOutY", "fadeIn", "fadeInUp", "fadeInDown", "fadeInLeft", "fadeInRight", 
    "fadeInUpBig", "fadeInDownBig", "fadeInLeftBig", "fadeInRightBig", "fadeOut", "fadeOutUp", "fadeOutDown", 
    "fadeOutLeft", "fadeOutRight", "fadeOutUpBig", "fadeOutDownBig", "fadeOutLeftBig", "fadeOutRightBig", 
    "bounceIn", "bounceInDown", "bounceInUp", "bounceInLeft", "bounceInRight", "bounceOut", "bounceOutDown", 
    "bounceOutUp", "bounceOutLeft", "bounceOutRight", "rotateIn", "rotateInDownLeft", "rotateInDownRight", 
    "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft", "rotateOutDownRight", 
    "rotateOutUpLeft", "rotateOutUpRight", "lightSpeedIn", "lightSpeedOut", "hinge", "rollIn", "rollOut"];

server.configure(function(){
    server.use(express.static(__dirname + '/public'));
    server.use(express.bodyParser());
});

server.all('/events', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
 });
 
server.get("/events", function(req, res) {
    if (event) {
        res.json(event);
        event = false;
    } else {
        res.json({"type": "none"});
    }
});

server.get("/", function(req, res) {
    res.writeHead(200, {"Content-Type": "text/html"});
    res.write("<table border='0'><tr><td valign='top'><font size='6em'>Add Image</font><br/>");
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
    res.write("<input type='submit' value='Add Image'></input>");
    res.write("</form></td>");
    //res.write("<br/>");
    //res.write("<br/>");
//    res.write("<td valign='top'><font size='6em'>Remove Image</font><br/>");
//    res.write("<form id='removeImage' action='removeImage' method='post'>");
//    res.write("<table border='0'>")
//    res.write("<tr><td>Id: </td><td><input type='text' name='id'/></td></table><br/>");
//    res.write("<input type='submit' value='Remove Image'></input>");
//    res.write("</form></td>");
    res.write("<td valign='top'><font size='6em'>Images</font><br/>");
    res.write("<form id='images' action='images' method='post'>");
    res.write("<table border='0'>")
    res.write("<tr><td>Id: </td><td><select name='images'/>");
    images.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("</select></td></table><br/>");
    res.write("<input type='submit' name='remove' value='Remove'></input>");
    res.write("<input type='submit' name='flash' value='Flash'></input>");
    res.write("<input type='submit' name='rotateIn' value='RotateIn'></input>");
    res.write("</form></td></tr></table>");
    res.end();
});

server.post('/addImage', function(req, res){
    var image = {};
    image.id = req.body.id;
    image.src = 'http://localhost:3100/images/' + req.body.images;
    image.top = req.body.top;
    image.left = req.body.left;
    image.bottom = req.body.bottom;
    image.right = req.body.right;
    image.height = req.body.height;
    image.width = req.body.width;
    event = {};
    event.type = 'add';
    event.image = image;
    images.push(image);
    res.redirect('/');
});

server.post('/images', function(req, res){
    var image = {};
    image.id = req.body.images;
    if (req.body.remove) {
        event = {};
        event.type = 'remove';
        event.image = image;
        images = _.reject(images, function(item) {
            return item.id === image.id;
        });
    } else if (req.body.flash) {
        event = {};
        event.type = 'animation';
        event.image = image;
        var animation = {};
        animation.name = "flash";
        event.animation = animation;
    } else if (req.body.rotateIn) {
        event = {};
        event.type = 'animation';
        event.image = image;
        var animation = {};
        animation.name = "rotateIn";
        event.animation = animation;
    }
    res.redirect('/');
});
var files = fs.readdirSync("./public/images");
files.forEach(function(element){
    imageFiles.push(element);
});

server.listen(3100);
