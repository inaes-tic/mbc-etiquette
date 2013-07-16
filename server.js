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
    res.write("<table border='0'><tr><td valign='top' style='padding:0 10px 0 15px;'><font size='6em'>Upload</font><br/>");
    res.write("<form id='uploadImage' action='uploadImage' method='post' , enctype='multipart/form-data'>");
    res.write("<input type='file' name='uploadedFile'></input><br/><br/>");
    res.write("<input type='submit' value='Upload'></input>");
    res.write("</form></td>");

    res.write("<td valign='top' style='padding:0 10px 0 15px;'><font size='6em'>Add</font><br/>");
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
    res.write("<form id='removeImage' action='removeImage' method='post'>");
    res.write("<table border='0'>");
    res.write("<tr><td>Id: </td><td><select name='images'/>");
    images.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("</select></td></tr></table><br/>");
    res.write("<input type='submit' value='Remove'></input>");
    res.write("</form></td>");

    res.write("<td valign='top'><font size='6em' style='padding:0 10px 0 15px;'>Effects</font><br/>");
    res.write("<form id='images' action='addEffect' method='post'>");
    res.write("<table border='0'>");
    res.write("<tr><td>Id: </td><td><select name='images'/>");
    images.forEach(function(item) {
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
    res.write("<tr><td>Id: </td><td><select name='images'/>");
    images.forEach(function(item) {
        res.write("<option>" + item.id + "</option>");
    });
    res.write("<tr><td>X: </td><td><input type='text' name='x'/></td></tr>");
    res.write("<tr><td>Y: </td><td><input type='text' name='y'/></td></tr>");
    res.write("<tr><td>Duration: </td><td><input type='text' name='duration'/></td></tr></table><br/>");
    res.write("<input type='submit' name='move' value='Move'></input>");
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

server.post('/removeImage', function(req, res){
    var image = {};
    image.id = req.body.images;
    event = {};
    event.type = 'remove';
    event.image = image;
    images = _.reject(images, function(item) {
        return item.id === image.id;
    });
    res.redirect('/');
});

server.post('/addEffect', function(req, res){
    var image = {};
    image.id = req.body.images;
    var animation = {};
    animation.name = req.body.effects;
    animation.duration = req.body.duration;
    animation.iterations = req.body.iterations;
    animation.delay = req.body.delay;
    event = {};
    event.type = 'animation';
    event.image = image;
    event.animation = animation;
    res.redirect('/');
});

server.post('/move', function(req, res){
    var image = {};
    image.id = req.body.images;
    var move = {};
    move.x = req.body.x;
    move.y = req.body.y;
    move.duration = req.body.duration;
    event = {};
    event.type = 'move';
    event.image = image;
    event.move = move;
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
            console.error("Error while watching images dir", err);
        },
        watching: function(err, watcherInstance, isWatching){
            if (err) {
                console.error("Error while watching images dir", err);
            } else {
                console.log("Finish watching playlists dir");
            }
        },
        change: function(changeType, filePath, fileCurrentStat, filePreviousStat){
            var name = filePath.substring(filePath.lastIndexOf("/") + 1);

            if (changeType === "create") {
                console.log("Image added: " + name);
                imageFiles.push(name);
            } else if (changeType === "update") {
                console.log("Image updated: " + name);
            } else if (changeType === "delete") {
                console.log("Image deleted: " + name);
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

server.listen(3100);
