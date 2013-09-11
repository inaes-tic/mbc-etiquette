window.WebvfxBase = Backbone.Model.extend({

    initialize: function() {
        this.layer = stage.children[0];
        this.id = this.cid;
        self = this;
        ['width', 'height', 'x', 'y', 'radius', 'strokeWidth', 'fontSize'].forEach(function(e) {
            if (self.attributes[e] !== undefined) {
                self.attributes[e] *= window.stageScale;
            }
        });
    },

    createEvents: function(kObj) {
        self = this;

        kObj.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            self.showInfo(kObj);
        });

        kObj.on('dragmove', function() {
            self.showInfo(kObj);
        });

        kObj.on('dragend', function() {
            if (window.realTimeEdition) {
                window.webvfxCollection.sendAll();
            }
            var aPos = kObj.getAbsolutePosition();
            console.log('dragend to ' + aPos.x + ',' + aPos.y);
        });

        kObj.on('mouseout', function() {
            document.body.style.cursor = 'default';
            $('#info').html('');
        });

        kObj.on('mousedown', function() {
            $('.webvfx-obj div').hide();
            $('#webvfx-data-' + kObj.webvfxObj.id).show();
        });
    },

    getRealValue: function(value) {
        return Math.round(value / window.stageScale);
    },

    showInfo: function(kObj) {
        var id = kObj.webvfxObj.id;
        var info = kObj.webvfxObj.getInfo();
        $('#width-' + id).val(info.width);
        $('#height-' + id).val(info.height);
        $('#top-' + id).val(info.top);
        $('#left-' + id).val(info.left);
        $('#right-' + id).val(info.right);
        $('#bottom-' + id).val(info.bottom);
    },

    getInfo: function() {
        return {
            type: this.getType(),
            width: this.getRealValue(this.getWidth()),
            height: this.getRealValue(this.getHeight()),
            top: this.getRealValue(this.getTop()),
            left: this.getRealValue(this.getLeft()),
            right: this.getRealValue(this.getRight()),
            bottom: this.getRealValue(this.getBottom()),
        }
    },

    setInitialPosition: function(args) {
        if ( !('x' in args || 'y' in args) ) {
            var size = this.kObj.getSize();
            var x = Math.round((stage.getWidth() / 2) - (size.width / 2));
            var y = Math.round((stage.getHeight() / 2) - (size.height / 2));
            this.kObj.setPosition(x, y);
        }
    },

    addEffect: function(id, effect, duration, iterations, delay) {
        webvfxClient.addEffect({
            elements: id,
            effects: effect,
            duration: duration,
            iterations: iterations,
            delay: delay,
        });
    },

    move: function(id, x, y, duration) {
        webvfxClient.move({
            elements: id,
            x: x + 'px',
            y: y + 'px',
            duration: duration,
        });
    },

    remove: function() {
        webvfxClient.remove({elements: this.id});
    },

    destroy: function() {
        this.remove();
        this.kObj.destroy();
        this.layer.draw();
        webvfxCollection.remove(this);
    },

});

window.WebvfxRect = WebvfxBase.extend({

    defaults: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fill: 'gray',
        stroke: 'black',
        strokeWidth: 2,
        name: '',
        draggable: true,
    },

    initialize: function() {
        WebvfxRect.__super__.initialize.apply(this, arguments);
        this.kObj = new Kinetic.Rect(this.toJSON());
        this.kObj.webvfxObj = this;
        this.setInitialPosition(arguments[0]);
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
        this.layer.draw();
    },

    getView: function() {
        return new WebvfxRectView({model: this});
    },

    getInfo: function() {
        return {error: 'getInfo not implemented on Rect ' + this.cid}
    },

});

window.WebvfxCircle = WebvfxBase.extend({

    defaults: {
        x: 0,
        y: 0,
        radius: 25,
        fill: 'gray',
        stroke: 'black',
        strokeWidth: 2,
        name: '',
        draggable: true,
    },

    initialize: function() {
        WebvfxCircle.__super__.initialize.apply(this, arguments);
        this.kObj = new Kinetic.Circle(this.toJSON());
        this.kObj.webvfxObj = this;
        this.setInitialPosition(arguments[0]);
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
        this.layer.draw();
    },

    getView: function() {
        return new WebvfxCircleView({model: this});
    },

    getInfo: function() {
        return {error: 'getInfo not implemented on Circle ' + this.cid}
    },

});

window.WebvfxImage = WebvfxBase.extend({

    defaults: {
        x: 0,
        y: 0,
        image: null,
        width: 0,
        height: 0,
        name: '',
    },

    initialize: function() {
        WebvfxImage.__super__.initialize.apply(this, arguments);
        this.kObj = this.createImage();
        this.kObj.webvfxObj = this;
        this.setInitialPosition(arguments[0]);
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
        this.layer.draw();
        if (window.realTimeEdition) {
            this.send();
        }
    },

    createImage: function() {
        var kImage = new Kinetic.Image(this.toJSON());
        kImage.setSize(
            kImage.getWidth() * window.stageScale,
            kImage.getHeight() * window.stageScale
        );
        var imageWidth = kImage.getWidth();
        var imageHeight = kImage.getHeight();

        var group = new Kinetic.Group({
            width: imageWidth,
            height: imageHeight,
            draggable: true
        });

        group.on('mouseover', function() {
            this.get('Circle').each(function(circle) {
                circle.show();
            });
            this.getLayer().draw();
        });

        group.on('mouseout', function() {
            this.get('Circle').each(function(circle) {
                circle.hide();
            });
            this.getLayer().draw();
        });

        group.add(kImage);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, imageWidth, 0, 'topRight');
        this.addAnchor(group, imageWidth, imageHeight, 'bottomRight');
        this.addAnchor(group, 0, imageHeight, 'bottomLeft');
        return group;
    },

    addAnchor: function(group, x, y, name) {
        var anchor = new Kinetic.Circle({
            x: x,
            y: y,
            stroke: '#666',
            fill: '#ddd',
            strokeWidth: 2,
            radius: 6,
            name: name,
            draggable: true,
            dragOnTop: false,
        });

        var self = this;

        anchor.on('dragmove', function(e) {
            self.update(this, e.shiftKey);
            self.layer.draw();
        });

        anchor.on('mousedown touchstart', function() {
            group.setDraggable(false);
            this.moveToTop();
        });

        anchor.on('dragend', function() {
            group.setDraggable(true);
            self.layer.draw();
        });

        anchor.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            this.setStrokeWidth(4);
            self.layer.draw();
        });

        anchor.on('mouseout', function() {
            document.body.style.cursor = 'default';
            this.setStrokeWidth(2);
            self.layer.draw();
        });

        group.add(anchor);
    },

    update: function(activeAnchor, fixed) {
        var group = activeAnchor.getParent();

        var topLeft = group.get('.topLeft')[0];
        var topRight = group.get('.topRight')[0];
        var bottomRight = group.get('.bottomRight')[0];
        var bottomLeft = group.get('.bottomLeft')[0];
        var image = group.children[0];

        var anchorX = activeAnchor.getX();
        var anchorY = activeAnchor.getY();

        if (fixed) {
            console.log('Shift key pressed!');
        }

        switch (activeAnchor.getName()) {
            case 'topLeft':
                if (fixed) {
                    var newWidth = bottomRight.getX() - anchorX;
                    var newHeight = newWidth * image.getHeight() / image.getWidth();
                    activeAnchor.setY(bottomRight.getY() - newHeight);
                    topRight.setY(bottomRight.getY() - newHeight);
                    bottomLeft.setX(anchorX);
                } else {
                    topRight.setY(anchorY);
                    bottomLeft.setX(anchorX);
                }
                break;
            case 'topRight':
                if (fixed) {
                    var newWidth = anchorX - bottomLeft.getX();
                    var newHeight = newWidth * image.getHeight() / image.getWidth();
                    activeAnchor.setY(bottomLeft.getY() - newHeight);
                    topLeft.setY(bottomLeft.getY() - newHeight);
                    bottomRight.setX(anchorX);
                } else {
                    topLeft.setY(anchorY);
                    bottomRight.setX(anchorX);
                }
                break;
            case 'bottomRight':
                if (fixed) {
                    var newWidth = anchorX - topLeft.getX();
                    var newHeight = newWidth * image.getHeight() / image.getWidth();
                    activeAnchor.setY(topLeft.getY() + newHeight);
                    bottomLeft.setY(topLeft.getY() + newHeight);
                    topRight.setX(anchorX);
                } else {
                    bottomLeft.setY(anchorY);
                    topRight.setX(anchorX); 
                }
                break;
            case 'bottomLeft':
                if (fixed) {
                    var newWidth = topRight.getX() - anchorX;
                    var newHeight = newWidth * image.getHeight() / image.getWidth();
                    activeAnchor.setY(topRight.getY() + newHeight);
                    bottomRight.setY(topRight.getY() + newHeight);
                    topLeft.setX(anchorX);
                } else {
                    bottomRight.setY(anchorY);
                    topLeft.setX(anchorX); 
                }
                break;
        }


        image.setPosition(topLeft.getPosition());

        var width = topRight.getX() - topLeft.getX();
        var height = bottomLeft.getY() - topLeft.getY();
        if (width && height) {
            image.setSize(width, height);
        }
    },

    getName: function() {
        return this.kObj.children[0].attrs.name;
    },

    getType: function() {
        return 'Image';
    },

    getWidth: function() {
        return this.kObj.children[0].getWidth();
    },

    getHeight: function() {
        return this.kObj.children[0].getHeight();
    },

    getTop: function() {
        return this.kObj.children[0].getAbsolutePosition()['y'];
    },

    getLeft: function() {
        return this.kObj.children[0].getAbsolutePosition()['x'];
    },

    getRight: function() {
        return window.stageWidth - this.getLeft() - this.getWidth();
    },

    getBottom: function() {
        return window.stageHeight - this.getTop() - this.getHeight();
    },

    getView: function() {
        return new WebvfxImageView({model: this});
    },

    setWidth: function(width) {
        var realWidth = width * window.stageScale;
        this.kObj.children[0].setWidth(realWidth);
        var leftX = this.kObj.get('.topLeft')[0].getX();
        this.kObj.get('.topRight')[0].setX(leftX + realWidth);
        this.kObj.get('.bottomRight')[0].setX(leftX + realWidth);
        this.draw();
    },

    setHeight: function(height) {
        var realHeight = height * window.stageScale;
        this.kObj.children[0].setHeight(realHeight);
        var topY = this.kObj.get('.topLeft')[0].getY();
        this.kObj.get('.bottomLeft')[0].setY(topY + realHeight);
        this.kObj.get('.bottomRight')[0].setY(topY + realHeight);
        this.draw();
    },

    setTop: function(top) {
        this.kObj.setY(top * window.stageScale);
        this.draw();
    },

    setLeft: function(left) {
        this.kObj.setX(left * window.stageScale);
        this.draw();
    },

    setRight: function(right) {
        var realRight = right * window.stageScale;
        this.kObj.setX(window.stageWidth - right - this.getWidth());
        this.draw();
    },

    setBottom: function(bottom) {
        var realBottom = bottom * window.stageScale;
        this.kObj.setY(window.stageHeight - bottom - this.getHeight());
        this.draw();
    },

    draw: function() {
        this.layer.draw();
        if (window.realTimeEdition) {
            window.webvfxCollection.sendAll();
        }
    },

    send: function() {
        this.remove();
        var kImage = this.kObj.children[0];
        webvfxClient.addImage({
            images: kImage.attrs.name,
            name: kImage.attrs.name,
            id: this.id,
            top: this.getRealValue(this.getTop()) + 'px',
            left: this.getRealValue(this.getLeft()) + 'px',
            right: this.getRealValue(this.getRight()) + 'px',
            bottom: this.getRealValue(this.getBottom()) + 'px',
            width: this.getRealValue(this.getWidth()) + 'px',
            height: this.getRealValue(this.getHeight()) + 'px',
        });
    },

});

window.WebvfxText = WebvfxBase.extend({

    defaults: {
        x: 0,
        y: 0,
        text: '',
        fontSize: 36,
        fontFamily: 'Calibri',
        fill: 'black',
        name: '',
        scroll: false,
        draggable: true,
    },

    initialize: function() {
        WebvfxText.__super__.initialize.apply(this, arguments);
        this.kObj = new Kinetic.Text(this.toJSON());
        this.kObj.webvfxObj = this;
        this.setInitialPosition(arguments[0]);
        this.createEvents(this.kObj);
        this.layer.add(this.kObj);
        this.layer.draw();
        if (window.realTimeEdition) {
            this.send();
        }
    },

    getName: function() {
        text = this.kObj.getText();
        if (text.split(' ').length > 5) {
            return text.split(' ').slice(0, 5).join(' ') + '...';
        }
        return text;
    },

    getType: function() {
        return 'Text';
    },

    getWidth: function() {
        return this.kObj.getSize()['width'];
    },

    getHeight: function() {
        return this.kObj.getSize()['height'];
    },

    getTop: function() {
        return this.kObj.getAbsolutePosition()['y'];
    },

    getLeft: function() {
        return this.kObj.getAbsolutePosition()['x'];
    },

    getRight: function() {
        return window.stageWidth - this.getLeft() - this.getWidth();
    },

    getBottom: function() {
        return window.stageHeight - this.getTop() - this.getHeight();
    },

    setWidth: function(width) {
    },

    setHeight: function(height) {
    },

    setTop: function(top) {
        this.kObj.setY(top * window.stageScale);
        this.draw();
    },

    setLeft: function(left) {
        this.kObj.setX(left * window.stageScale);
        this.draw();
    },

    setRight: function(right) {
        var realRight = right * window.stageScale;
        this.kObj.setX(window.stageWidth - right - this.getWidth());
        this.draw();
    },

    setBottom: function(bottom) {
        var realBottom = bottom * window.stageScale;
        this.kObj.setY(window.stageHeight - bottom - this.getHeight());
        this.draw();
    },

    draw: function() {
        this.layer.draw();
        if (window.realTimeEdition) {
            window.webvfxCollection.sendAll();
        }
    },

    getView: function() {
        return new WebvfxTextView({model: this});
    },

    send: function() {
        this.remove();
        webvfxClient.addText({
            text: this.kObj.getText(),
            id: this.id,
            top: this.getRealValue(this.getTop()) + 'px',
            left: this.getRealValue(this.getLeft()) + 'px',
            bottom: this.getRealValue(this.getBottom()) + 'px',
            right: this.getRealValue(this.getRight()) + 'px',
            width: this.getRealValue(this.getWidth()) + 'px',
            height: this.getRealValue(this.getHeight()) + 'px',
            background_color: '',
            color: this.kObj.getFill(),
            scroll: '',
        });
    },

});

window.WebvfxCollection = Backbone.Collection.extend({

    sendAll: function() {
        this.each(function(e) {
            e.send();
        });
    },

});


// vim: set foldmethod=indent foldlevel=0 foldnestmax=1 :

