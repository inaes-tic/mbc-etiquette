window.WebvfxBase = Backbone.Model.extend({

    initialize: function() {
        this.layer = stage.children[0];
        self = this;
        ['width', 'height', 'x', 'y', 'radius', 'strokeWidth'].forEach(function(e) {
            if (self.attributes[e] !== undefined) {
                self.attributes[e] *= window.stageScale;
            }
        });
    },

    createEvents: function(kObj) {
        kObj.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
            var info = kObj.webvfxObj.getInfo();
            var pre = '';
            for (var key in info) {
                pre += key + ': ' + info[key] + '\n';
            }
            $('#info').html('<pre>' + pre + '</pre>');
        });

        kObj.on('dragstart', function() {
            document.body.style.cursor = 'move';
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

        var x = Math.round((stage.getWidth() / 2) - (imageWidth / 2));
        var y = Math.round((stage.getHeight() / 2) - (imageHeight / 2));

        var group = new Kinetic.Group({
            x: x,
            y: y,
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

        anchor.on('dragmove', function() {
            self.update(this);
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

    update: function(activeAnchor) {
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
            x: Math.round(aPos.x / window.stageScale),
            y: Math.round(aPos.y / window.stageScale),
            width: Math.round(kImage.getWidth() / window.stageScale),
            height: Math.round(kImage.getHeight() / window.stageScale),
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

