window.WebvfxBase = Backbone.Model.extend({

    initialize: function() {
        this.layer = stage.children[0];
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
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        fill: 'gray',
        stroke: 'black',
        name: self.cid,
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
        x: 0,
        y: 0,
        radius: 25,
        fill: 'gray',
        stroke: 'black',
        name: self.cid,
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

