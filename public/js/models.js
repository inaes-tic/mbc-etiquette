window.webvfxClient = {

    remove: function(data) {
        this.request('remove', data, function(res) {
            console.log('remove object ' + data.elements);
        });
    },

    addImage: function(data) {
        this.request('addImage', data, function(res) {
            console.log('image added: ' + data.name);
        });
    },

    addText: function(data) {
        this.request('addBanner', data, function(res) {
            console.log('text added: ' + data.text);
        });
    },

    addEffect: function(data) {
        this.request('addEffect', data, function(res) {
            console.log('effect ' + data.effects + ' added on ' + data.elements);
        });
    },

    move: function(data) {
        this.request('move', data, function(res) {
            console.log('moved object ' + data.elements);
        });
    },

    request: function(url, data, callback) {
        var formdata = new FormData();
        for (var key in data) {
            formdata.append(key, data[key]);
        }
        $.ajax({
            url: url,
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: callback
        });
    }

};

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
        if (fixed) console.log('Shift key pressed!');
        var group = activeAnchor.getParent();

        var topLeft = group.get('.topLeft')[0];
        var topRight = group.get('.topRight')[0];
        var bottomRight = group.get('.bottomRight')[0];
        var bottomLeft = group.get('.bottomLeft')[0];
        var image = group.children[0];

        var anchorX = activeAnchor.getX();
        var anchorY = activeAnchor.getY();

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

window.WebvfxBaseView = Backbone.View.extend({

    tagName: 'div',
    className: 'webvfx-obj',

    colors: [
        'black', 'red', 'blue', 'green', 'pink', 'orange'
    ],

    effects: [
        "flash", "bounce", "shake", "tada", "swing", "wobble",
        "wiggle", "pulse", "flip", "flipInX", "flipOutX", "flipInY",
        "flipOutY", "fadeIn", "fadeInUp", "fadeInDown", "fadeInLeft",
        "fadeInRight", "fadeInUpBig", "fadeInDownBig", "fadeInLeftBig",
        "fadeInRightBig", "fadeOut", "fadeOutUp", "fadeOutDown", 
        "fadeOutLeft", "fadeOutRight", "fadeOutUpBig", "fadeOutDownBig",
        "fadeOutLeftBig", "fadeOutRightBig", "bounceIn", "bounceInDown",
        "bounceInUp", "bounceInLeft", "bounceInRight", "bounceOut",
        "bounceOutDown", "bounceOutUp", "bounceOutLeft", "bounceOutRight",
        "rotateIn", "rotateInDownLeft", "rotateInDownRight",
        "rotateInUpLeft", "rotateInUpRight", "rotateOut", "rotateOutDownLeft",
        "rotateOutDownRight", "rotateOutUpLeft", "rotateOutUpRight",
        "lightSpeedIn", "lightSpeedOut", "hinge", "rollIn", "rollOut"
    ],

    events: {
        drop: 'drop'
    },

    elements: [],

    initialize: function() {
        this.render();
    },

    render: function() {
        this.$el.html(this.template({
            id: this.model.id,
            model: this.model,
            colors: this.colors,
            effects: this.effects,
        }));
        if (this.elements.indexOf(this.model.id) < 0) {
            this.elements.push(this.model.id);
            this.addCommonEvents(this.model);
            this.addEvents(this.model);
        }
    },

    drop: function(event, index) {
        this.model.kObj.setZIndex(index);
        this.model.layer.draw();
        this.$el.trigger('updateSort', [this.model, index]);
    },

    $: function(name, id) {
        return $('#' + name + '-' + id);
    },

    addCommonEvents: function(model) {

        var id = model.id;
        var self = this;

        this.$('title', id).live('click', function() {
            var selfId = self.$('webvfx-data', id).attr('id');
            $('.webvfx-obj div').each(function() {
                console.log(selfId);
                if ($(this).attr('id') != selfId) {
                    console.log('hide ' + $(this).attr('id'));
                    $(this).hide();
                }
            });
            self.$('webvfx-data', id).toggle();
        });

        this.$('title', id).live('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        this.$('title', id).live('mouseout', function() {
            document.body.style.cursor = 'default';
        });

        this.$('width', id).live('keyup', function() {
            model.setWidth($(this).val());
            self.$('right', id).val(model.getRealValue(model.getRight()));
        });

        this.$('height', id).live('keyup', function() {
            model.setHeight($(this).val());
            self.$('bottom', id).val(model.getRealValue(model.getBottom()));
        });

        this.$('top', id).live('keyup', function() {
            model.setTop($(this).val());
            self.$('bottom', id).val(model.getRealValue(model.getBottom()));
        });

        this.$('left', id).live('keyup', function() {
            model.setLeft($(this).val());
            self.$('right', id).val(model.getRealValue(model.getRight()));
        });

        this.$('right', id).live('keyup', function() {
            model.setRight($(this).val());
            self.$('left', id).val(model.getRealValue(model.getLeft()));
        });

        this.$('bottom', id).live('keyup', function() {
            model.setBottom($(this).val());
            self.$('top', id).val(model.getRealValue(model.getTop()));
        });

        this.$('add-effect', id).live('click', function() {
            model.addEffect(
                id,
                self.$('effect', id).val(),
                self.$('duration', id).val(),
                self.$('iterations', id).val(),
                self.$('delay', id).val()
            );
        });

        this.$('move', id).live('click', function() {
            model.move(
                id,
                self.$('x', id).val(),
                self.$('y', id).val(),
                self.$('move-duration', id).val()
            );
        });

        this.$('remove', id).live('click', function() {
            model.destroy();
        });

    },

});

window.WebvfxRectView = WebvfxBaseView.extend({
    template: _.template('Rect <%= name %>, <%= fill %>'),
});

window.WebvfxCircleView = WebvfxBaseView.extend({
    template: _.template('Circle <%= name %>, <%= fill %>'),
});

window.WebvfxImageView = WebvfxBaseView.extend({

    template: _.template($('#webvfx-obj-template').html()),

    addEvents: function(model) {

    },

});

window.WebvfxTextView = WebvfxBaseView.extend({

    template: _.template($('#webvfx-obj-template').html()),

    addEvents: function(model) {

        var id = model.id;
        var self = this;

        this.$('text', id).live('keyup', function() {
            model.kObj.setText($(this).val());
            model.layer.draw();
            if (window.realTimeEdition) {
                window.webvfxCollection.sendAll();
            }
        });

        this.$('fill', id).live('change', function() {
            model.kObj.setFill($(this).val());
            model.layer.draw();
            if (window.realTimeEdition) {
                window.webvfxCollection.sendAll();
            }
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

window.WebvfxCollectionView = Backbone.View.extend({

    el: $('#webvfx-collection'),

    tagName: 'div',

    events: {
        updateSort: 'updateSort'
    },

    initialize: function(collection) {
        this.collection = collection;
        this.collection.bind('add remove', this.render, this);
        this.render();
    },

    updateSort: function(event, model, index) {
        this.collection.remove(model);
        this.collection.add(model, {at: index});
        if (window.realTimeEdition) {
            this.collection.sendAll();
        }
    },

    render: function() {
        this.$el.empty();
        if (this.collection.length) {
            this.collection.each(function(webvfxObj) {
                var webvfxView = webvfxObj.getView();
                this.$el.prepend(webvfxView.el);
            }, this);
        } else {
            this.$el.prepend($('<h3/>').text('No objects'));
        }

        // Show data for the last added object
        if (this.collection.new) {
            this.collection.new = false;
            var lastId = this.collection.models[this.collection.length -1].id
            $('#webvfx-data-' + lastId).show();
        }
    }

});

// vim: set foldmethod=indent foldlevel=0 foldnestmax=1 :

