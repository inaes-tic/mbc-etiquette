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

