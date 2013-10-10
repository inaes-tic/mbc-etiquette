window.ManualView = Backbone.View.extend({
    el: $("#content"),
    initialize:function (options) {
        this.effects = 'effects' in options ? options['effects'] : [];
        this.imageFiles = 'imageFiles' in options ? options['imageFiles'] : [];
        this.elements = 'elements' in options ? options['elements'] : [];

        var self = this;
        this.effects.fetch({
            success: function() {
                self.imageFiles.fetch({
                    success: function() {
                        self.elements.fetch({
                            success: function() {
                                self.render();
                            }
                        });
                    }
                });
            }
        });
    },

    render:function () {
        $(this.el).html(template.manual({
            imageFiles: this.imageFiles.toJSON(),
            elements: this.elements.toJSON(),
            effects: this.effects.toJSON()
        }));
        return this;
    }

});
