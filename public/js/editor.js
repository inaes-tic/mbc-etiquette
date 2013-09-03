$(document).ready(function() {

    var stage = new Kinetic.Stage({
        container: 'container',
        width: 960,
        height: 540,
    });
    //window.stage = stage;

    $('#add').click(function() {
        addText($('#text').val());
        $('#text').val('');
    });

    $('#files').change(function () {
        processFiles(this.files);
    });

    var dropzone = $('#container');

    dropzone.on('dragover', function() {
        console.log('dragover');
        dropzone.addClass('hover');
        return false;
    });

    dropzone.on('dragleave', function() {
        console.log('dragleave');
        dropzone.removeClass('hover');
        return false;
    });

    dropzone.on('drop', function(e) {
        console.log('drop');
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');
        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);
        return false;
    });

    var processFiles = function(files) {
        if (files && typeof FileReader !== "undefined") {
            for(var i = 0; i < files.length; i++) {
                readFile(files[i]);
            }
        }
    };

    var readFile = function(file) {
        if( (/image/i).test(file.type) ) {
            var reader = new FileReader();
            reader.onload = function(e) {
                console.log('loaded ' + file.name);
                image = new Image();
                image.name = file.name;
                image.type = file.type;
                image.src = e.target.result;
                image.id = Date.now();
                addImage(image);
            };
            reader.readAsDataURL(file);
        } else {
            alert('File format not supported');
        }
    };

    var addText = function(text) {
        var layer = new Kinetic.Layer();

        var ktext = new Kinetic.Text({
            x: 0,
            y: 0,
            text: text,
            fontSize: 30,
            fontFamily: 'Calibri',
            fill: 'black',
            draggable: true,
        });
        //window.ktext = ktext;

        ktext.on('dragend', function() {
            var w = this.getWidth();
            var h = this.getHeight();
            var x = this.getX();
            var y = this.getY();
            $('#info').html('<pre>text: ' + text + '\nwidth: ' + w +
                            '\nheight: ' + h + '\nx: ' + x +
                            '\ny: ' + y + '\n</pre>');
        });

        layer.add(ktext);
        stage.add(layer);
        addElement(ktext);
    };

    var addImage = function(image) {
        var group = new Kinetic.Group({
            x: (stage.getWidth() / 2) - (image.width / 2),
            y: (stage.getHeight() / 2) - (image.height / 2),
            draggable: true
        });

        var layer = new Kinetic.Layer();

        var kimage = new Kinetic.Image({
            x: 0,
            y: 0,
            image: image,
            width: image.width,
            height: image.height,
            name: 'image'
        });

        layer.add(group);
        stage.add(layer);
        addElement(kimage);

        group.add(kimage);
        addAnchor(group, 0, 0, 'topLeft');
        addAnchor(group, image.width, 0, 'topRight');
        addAnchor(group, image.width, image.height, 'bottomRight');
        addAnchor(group, 0, image.height, 'bottomLeft');

        group.on('dragend', function() {
            var i = this.get('.image')[0];
            var name = i.attrs.image.name;
            var w = i.attrs.width;
            var h = i.attrs.height;
            var x = this.getX();
            var y = this.getY();
            $('#info').html('<pre>image: ' + name + '\nwidth: ' + w +
                            '\nheight: ' + h + '\nx: ' + x +
                            '\ny: ' + y + '\n</pre>');
        });

        stage.draw();
    };

    var addAnchor = function(group, x, y, name) {
        var stage = group.getStage();
        var layer = group.getLayer();

        var anchor = new Kinetic.Circle({
            x: x,
            y: y,
            stroke: '#666',
            fill: '#ddd',
            strokeWidth: 2,
            radius: 4,
            name: name,
            draggable: true,
            dragOnTop: false
        });

        anchor.on('dragmove', function() {
            update(this);
            layer.draw();
        });

        anchor.on('mousedown touchstart', function() {
            group.setDraggable(false);
            this.moveToTop();
        });

        anchor.on('dragend', function() {
            group.setDraggable(true);
            layer.draw();
        });

        anchor.on('mouseover', function() {
            var layer = this.getLayer();
            document.body.style.cursor = 'pointer';
            this.setStrokeWidth(4);
            layer.draw();
        });

        anchor.on('mouseout', function() {
            var layer = this.getLayer();
            document.body.style.cursor = 'default';
            this.setStrokeWidth(2);
            layer.draw();
        });

        group.add(anchor);
    };

    var update = function(activeAnchor) {
        var group = activeAnchor.getParent();

        var topLeft = group.get('.topLeft')[0];
        var topRight = group.get('.topRight')[0];
        var bottomRight = group.get('.bottomRight')[0];
        var bottomLeft = group.get('.bottomLeft')[0];
        var image = group.get('.image')[0];

        var anchorX = activeAnchor.getX();
        var anchorY = activeAnchor.getY();

        // update anchor positions
        switch (activeAnchor.getName()) {
            case 'topLeft':
                topRight.setY(anchorY);
                bottomLeft.setX(anchorX);
                break;
            case 'topRight':
                topLeft.setY(anchorY);
                bottomRight.setX(anchorX);
                break;
            case 'bottomRight':
                bottomLeft.setY(anchorY);
                topRight.setX(anchorX); 
                break;
            case 'bottomLeft':
                bottomRight.setY(anchorY);
                topLeft.setX(anchorX); 
                break;
        }

        image.setPosition(topLeft.getPosition());

        var width = topRight.getX() - topLeft.getX();
        var height = bottomLeft.getY() - topLeft.getY();
        if (width && height) {
            image.setSize(width, height);
        }
    };

    var addElement = function(el) {
        var a = $('<a/>').attr('href', '#').text('delete').click(function () {
            el.getLayer().destroy();
            $(this).parent().remove();
        });
        if (el.className == 'Image') {
            liText = el.attrs.image.name + ' ';
        } else {
            liText = el.attrs.text + ' ';
        }
        var li = $('<li/>').text(liText).append(a);
        $('#elements ul').append(li);
    };

});

