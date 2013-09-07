window.WebvfxBase = Backbone.Model.extend({

    initialize: function() {
        this.layer = stage.children[0];
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

        kObj.on('dragstart', function() {
            document.body.style.cursor = 'move';
        });

        kObj.on('dragmove', function() {
            self.showInfo(kObj);
        });

        kObj.on('dragend', function() {
            var aPos = kObj.getAbsolutePosition();
            document.body.style.cursor = 'pointer';
            console.log('dragend to ' + aPos.x + ',' + aPos.y);
        });

        kObj.on('mouseout', function() {
            document.body.style.cursor = 'default';
            $('#info').html('');
        });
    },

    showInfo: function(kObj) {
        var info = kObj.webvfxObj.getInfo();
        var pre = '';
        for (var key in info) {
            pre += key + ': ' + info[key] + '\n';
        }
        $('#info').html('<pre>' + pre + '</pre>');
    },

    setInitialPosition: function(args) {
        if ( !('x' in args || 'y' in args) ) {
            var size = this.kObj.getSize();
            var x = Math.round((stage.getWidth() / 2) - (size.width / 2));
            var y = Math.round((stage.getHeight() / 2) - (size.height / 2));
            this.kObj.setPosition(x, y);
        }
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

    getView: function() {
        return new WebvfxImageView({model: this});
    },

    getInfo: function() {
        var kImage = this.kObj.children[0];
        var aPos = kImage.getAbsolutePosition();
        return {
            name: kImage.attrs.name,
            x: Math.round(aPos.x / window.stageScale) + ' px',
            y: Math.round(aPos.y / window.stageScale) + ' px',
            width: Math.round(kImage.getWidth() / window.stageScale) + ' px',
            height: Math.round(kImage.getHeight() / window.stageScale) + ' px',
        }
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
    },

    getView: function() {
        return new WebvfxTextView({model: this});
    },

    getInfo: function() {
        var aPos = this.kObj.getAbsolutePosition();
        var size = this.kObj.getSize();
        return {
            name: this.kObj.attrs.name,
            text: this.kObj.attrs.text,
            x: Math.round(aPos.x / window.stageScale) + ' px',
            y: Math.round(aPos.y / window.stageScale) + ' px',
            width: Math.round(size.width / window.stageScale) + ' px',
            height: Math.round(size.height / window.stageScale) + ' px',
        }
    },

});

window.WebvfxBaseView = Backbone.View.extend({

    tagName: 'div',

    events: {
        drop: 'drop'
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        this.$el.html(this.template(this.model.toJSON()));
    },

    drop: function(event, index) {
        this.model.kObj.setZIndex(index);
        this.model.layer.draw();
        this.$el.trigger('updateSort', [this.model, index]);
    },

});

window.WebvfxRectView = WebvfxBaseView.extend({
    template: _.template('Rect <%= name %>, <%= fill %>'),
});

window.WebvfxCircleView = WebvfxBaseView.extend({
    template: _.template('Circle <%= name %>, <%= fill %>'),
});

window.WebvfxImageView = WebvfxBaseView.extend({
    template: _.template('Image <%= name %>'),
});

window.WebvfxTextView = WebvfxBaseView.extend({
    template: _.template('Text <%= name %>'),
});

window.WebvfxCollection = Backbone.Collection.extend({
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
    },

    render: function() {
        this.$el.empty();
        this.collection.each(function(webvfxObj) {
            var webvfxView = webvfxObj.getView();
            this.$el.prepend(webvfxView.el);
        }, this)
    }

});

// vim: set foldmethod=indent foldlevel=0 foldnestmax=1 :

