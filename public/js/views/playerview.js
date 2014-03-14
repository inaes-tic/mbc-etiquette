window.PlayerView= function(options) {

    options = options || {};
    collection = options['collection'];
    this.collection = collection;

    var el = options['el'] || $('body');
    this.el = el;

    var viewModel = kb.ViewModel.extend({
        constructor: function(collection) {
            kb.ViewModel.prototype.constructor.apply(this, arguments);

            var self = this;
            this.items = kb.collectionObservable(collection);

            this.items.subscribe(function() {
                self.scaleWidgets(self.scale());
            })

            this.__scale = ko.observable(1);
            this.scale = ko.computed({
                read: function() {
                    return self.__scale();
                },
                write: function(scale) {
                    self.scaleVideo(scale);
                    self.scaleWidgets(scale);
                    self.__scale(scale);
                }
            });

            this.scaleVideo = function(scale) {
                var video = $("#video");
                var width = video.css('width');
                var height = video.css('height');
                video.css({
                    width: this.getScaledValue(width, scale),
                    height: this.getScaledValue(height, scale),
                    'margin-left': "-" + this.getScaledValue(width, scale, .5),
                });
                $("#content").css({
                    'margin-left': "-" + this.getScaledValue(width, scale, .5),
                });
            }

            this.scaleWidgets = function(scale) {
                _.each(self.items(), function(vm) {
                    console.log('vm.scale', vm.scale, 'vm.type()', vm.type());
                    if (vm.scale == undefined || vm.scale != scale) {
                        vm.scale = scale;
                        switch (vm.type()) {
                            case 'image':
                            case 'animation':
                                var attrs = ['width', 'height', 'top', 'left'];
                                _.each(attrs, function(attr) {
                                    var value = self.getScaledValue(vm[attr](), scale);
                                    vm[attr](value);
                                })
                                break;
                            case 'widget':
                                var o = _.clone(vm.options());
                                var attrs = [
                                    'width', 'height', 'left',
                                    'top', 'font-size', 'line-height'
                                ];
                                _.each(attrs, function(attr) {
                                    var value = self.getScaledValue(o.style[attr], scale);
                                    o.style[attr] = value;
                                })
                                vm.options(o);
                                break;
                        }
                    }
                });
            }

            this.getScaledValue = function(value, scale, mul) {
                var scale = (scale == this.scale())
                          ? scale
                          : scale / this.scale();

                switch (typeof value) {
                    case 'string':
                        var unit = value.match(/px|em$/);
                        unit = (unit === null) ? '' : unit[0];
                        value = parseFloat(value) * scale;
                        if (mul) value *= mul;
                        return value + unit;
                    case 'number':
                        if (mul) value *= mul;
                        return value * scale;
                }
            }

        }
    });

    this.view_model = new viewModel(collection);
    window.vmc = this.view_model;

    function render(time) {
        webvfx.getImage("video").assignToHTMLImageElement(document.getElementById("image"));
    }

    function init() {
        webvfx.renderRequested.connect(render);
        webvfx.imageTypeMap = { "video" : webvfx.SourceImageType };
        webvfx.readyRender(true);
    }

    if (typeof webvfx != 'undefined') {
        init();
    }

    el.html(template.playerview({}));
    ko.applyBindings(this.view_model, el[0]);
};
