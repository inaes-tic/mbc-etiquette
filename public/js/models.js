window.WebvfxBase = Backbone.Model.extend({

    initialize: function() {
        this.layer = stage.children[0];
        self = this;
        ['width', 'height', 'x', 'y', 'radius'].forEach(function(e) {
            if (self.attributes[e] !== undefined) {
                self.attributes[e] *= window.stageScale;
            }
        });
    },

    createEvents: function(kobj) {
        kobj.on('mouseover', function() {
            document.body.style.cursor = 'pointer';
        });

        kobj.on('dragstart', function() {
            document.body.style.cursor = 'move';
        });

        kobj.on('dragend', function() {
            var aPos = kobj.getAbsolutePosition();
            document.body.style.cursor = 'pointer';
            console.log('dragend to ' + aPos.x + ',' + aPos.y);
        });

        kobj.on('mouseout', function() {
            document.body.style.cursor = 'default';
        });
    },

});

window.WebvfxRect = WebvfxBase.extend({

    defaults: {
        id: Date.now(),
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fill: 'gray',
        stroke: 'black',
        name: 'rect',
        draggable: true,
    },

    initialize: function() {
        WebvfxRect.__super__.initialize.apply(this, arguments);
        this.kobj = new Kinetic.Rect(this.toJSON());
        this.createEvents(this.kobj);
        this.layer.add(this.kobj);
        this.layer.draw();
    },

    getView: function() {
        return new WebvfxRectView({model: this});
    }

});

window.WebvfxCircle = WebvfxBase.extend({

    defaults: {
        id: Date.now(),
        x: 0,
        y: 0,
        radius: 25,
        fill: 'gray',
        stroke: 'black',
        name: 'circle',
        draggable: true,
    },

    initialize: function() {
        WebvfxCircle.__super__.initialize.apply(this, arguments);
        this.kobj = new Kinetic.Circle(this.toJSON());
        this.createEvents(this.kobj);
        this.layer.add(this.kobj);
        this.layer.draw();
    },

    getView: function() {
        return new WebvfxCircleView({model: this});
    }

});

window.WebvfxImage = WebvfxBase.extend({

    defaults: {
        id: Date.now(),
        x: 0,
        y: 0,
        image: null,
        width: null,
        height: null,
        name: 'image',
        draggable: true,
    },

    initialize: function() {
        WebvfxImage.__super__.initialize.apply(this, arguments);
        this.kobj = this.createImage();
        this.createEvents(this.kobj);
        this.layer.add(this.kobj);
        this.layer.draw();
    },

    createImage: function() {
        var kimage = new Kinetic.Image(this.toJSON());
        var imageWidth = kimage.getWidth();
        var imageHeight = kimage.getHeight();

        var x = Math.round((stage.getWidth() / 2) - (imageWidth / 2));
        var y = Math.round((stage.getHeight() / 2) - (imageHeight / 2));

        var group = new Kinetic.Group({
            x: x,
            y: y,
            draggable: true
        });

        group.add(kimage);
        this.addAnchor(group, 0, 0, 'topLeft');
        this.addAnchor(group, imageWidth, 0, 'topRight');
        this.addAnchor(group, imageWidth, imageHeight, 'bottomRight');
        this.addAnchor(group, 0, imageHeight, 'bottomLeft');
        window.group = group;
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
            dragOnTop: false
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
    },

    getView: function() {
        return new WebvfxImageView({model: this});
    }
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
        this.model.kobj.setZIndex(index);
        this.model.layer.draw();
        this.$el.trigger('updateSort', [this.model, index]);
    },

});

window.WebvfxRectView = WebvfxBaseView.extend({
    template: _.template('Rect <%= title %>, <%= fill %>'),
});

window.WebvfxCircleView = WebvfxBaseView.extend({
    template: _.template('Circle <%= title %>, <%= fill %>'),
});

window.WebvfxImageView = WebvfxBaseView.extend({
    template: _.template('Image <%= title %>'),
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
            console.log(webvfxObj);
            var webvfxView = webvfxObj.getView();
            this.$el.prepend(webvfxView.el);
        }, this)
    }

});

