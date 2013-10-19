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
        $(this.el).html(template.objects({
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
    addEvents: function(model) {
    },
});

window.WebvfxTextView = WebvfxBaseView.extend({
    addEvents: function(model) {
        var id = model.id;
        var self = this;

        this.$('text', id).live('keyup', function() {
            model.kObj.setText($(this).val());
            model.layer.draw();
            if (webfvfxEditor.get('realTimeEdition')) {
                self.collection.sendAll();
            }
        });

        this.$('fill', id).live('change', function() {
            model.kObj.setFill($(this).val());
            model.layer.draw();
            if (webfvfxEditor.get('realTimeEdition')) {
                self.collection.sendAll();
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
        this.collection.bind('add remove', this.render, this);
        this.render();
    },

    updateSort: function(event, model, index) {
        this.collection.remove(model);
        this.collection.add(model, {at: index});
        if (webfvfxEditor.get('realTimeEdition')) {
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
            var empty = i18n.gettext('No objects');
            this.$el.prepend($('<h3/>').text(empty));
        }

        // Show data for the last added object
        if (this.collection.new) {
            this.collection.new = false;
            var lastId = this.collection.models[this.collection.length -1].id
            $('#webvfx-data-' + lastId).show();
        }
    }
});

window.EditorView = Backbone.View.extend({
    el: $('#content'),

    events: {
        "click #save-sketch"    : "saveSketch",
        "click #load-sketch"    : "loadSketch",
        "click #del-sketch"     : "delSketch",
        "click #new-sketch"     : "newSketch",
        "click #safe-area"      : "safeArea",
        "click #video-preview"  : "videoPreview",
        "click #real-time-edition" : "realTimeEdition",
        "click #addText"        : "addText",
        "keyup #text"           : "keyUp",
        "click #update"         : "updateVideo",
        "click #clear-all"      : "clearAll",
        "dragover #container"   : "dragOver",
        "dragleave #container"  : "dragLeave",
        "drop #container"       : "drop",
        "change #files"         : "filesChange",
    },

    initialize: function() {
        this.render();
    },

    render: function() {
        var self = this;
        $(this.el).html(template.editor());

        var webvfxCollection = new WebvfxCollection();
        this.webvfxCollection = webvfxCollection;

        var sketchs = new Sketch.Collection();
        this.sketchs = sketchs;

        this.sketchs.fetch({ success: function() {
                self.getSketchs();
            }
        });

        var webvfxCollectionView = new WebvfxCollectionView({
            collection: this.webvfxCollection,
            el: $("#webvfx-collection", self.$el)
        });

        window.webvfxEditor = new WebvfxEditor({
            width: self.getParameterByName('width', 720),
            height: self.getParameterByName('height', 570),
            scale: self.getParameterByName('scale', 1),
        });

        $(document).ready(function() {
            self.makeSortable();
            self.updateCss();
            self.updateVideoStream();
            self.updateStatusBar();
        });
    },

    saveSketch: function () {
        var self = this;

        var key = $('#sketchs').val();
        var objects = [];
        this.webvfxCollection.each(function(e) {
            objects.push(e.getDataToStore());
        });

        if (key == '[select]') {
            var description = i18n.gettext('New Sketch name:')
            this.prompt(
                description,
                function (new_key) {
                    if(new_key) {
                        self.sketchs.create({ name: new_key, data: objects }, {success: function() {
                            console.log('Success creating sketch: '+ new_key);
                        }});
                        $('#sketchs').append($('<option>').html(new_key).prop('selected', true));
                    } else {
                        var description = i18n.gettext('You must enter a new sketch name to save it');
                        self.alert(description);
                    }
                },
                function() {
                    return;
                }
            );

        } else {
            var keyExists = _.contains(this.sketchs.pluck('name'), key);
            if(keyExists) {
                var description = i18n.translate('Overwrite sketch %s').fetch(key);
                this.confirm(description,
                    function () {
                        var model = self.sketchs.findWhere({name: key});
                        if (model) {
                            model.set({name: key, data: objects});
                            model.save();
                            console.log('sketch "' + key + '" saved');
                        } else {
                            console.log('tried to save: "' + key + '"but not found in sketchs');
                        }
                    },
                    function() {
                        var description = i18n.gettext('Must select a new name');
                        self.alert(description);
                    }
                );
            }
        }
    },
    loadSketch: function() {
        var self = this;
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var description = i18n.gettext('You must select a sketch to load');
            this.alert(description);
            return;
        }
        this.webvfxCollection.destroyAll();

        _.each(this.sketchs.findWhere({name: key}).get('data'), function(s) {
            if (s.type == 'Image') {
                s.image = new Image();
                s.image.src = '/uploads/' + s.name;
                s.image.name = s.name;
                self.webvfxCollection.add(new WebvfxImage(s));
            }
            if (s.type == 'Text') {
                self.webvfxCollection.add(new WebvfxText(s));
            }
        });

        console.log('sketch "' + key + '" loaded');
    },
    delSketch: function () {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var description = i18n.gettext('You must select a sketch to delete');
            this.alert(description);
            return;
        }

        var self = this;
        var description = i18n.translate('Do you want to delete the sketch "%s" ?').fetch(key);
        this.confirm(
            description,
            function () {
                var model = self.sketchs.findWhere({ name: key });
                if (model) {
                    model.destroy();
                    $('#sketchs option').filter(
                        function() {
                            return $(this).html() == key;
                        }
                    ).remove();
                    console.log('sketch "' + key + '" deleted');
                } else {
                    console.log('tried to delete: "' + key + '" but not found in sketchs');
                }
            },
            function () {
                console.log('Not deleting sketch "' + key + '"');
            }
        );
    },
    newSketch: function() {
        this.clearAll();
        var key = $('#sketchs').val('[select]');
    },
    getSketchs: function () {
        var keys = this.sketchs.pluck('name');
        _.each(keys, function(k) {
            $('#sketchs').append($('<option>').html(k));
        });
    },
    safeArea: function() {
        if (this.safeAreaLayer === undefined) {
            console.log('creating safe area');
            this.createSafeArea();
        }
        if ($("#safe-area").is(':checked')) {
            console.log('showing safe area');
            this.safeAreaLayer.show();
            this.safeAreaLayer.draw();
        } else {
            console.log('hiding safe area');
            this.safeAreaLayer.hide();
        }
    },
    createSafeArea: function() {
        this.safeAreaLayer = new Kinetic.Layer();

        var invisibleWidth = Math.round(1920 * webvfxEditor.get('scale'));
        var invisibleHeight = Math.round(1080 * webvfxEditor.get('scale'));

        var invisibleArea = this.getArea(
            invisibleWidth,
            invisibleHeight,
            webvfxEditor.get('actionSafe').width,
            webvfxEditor.get('actionSafe').height,
            '#333'
        );

        var actionSafeArea = this.getArea(
            webvfxEditor.get('actionSafe').width,
            webvfxEditor.get('actionSafe').height,
            webvfxEditor.get('titleSafe').width,
            webvfxEditor.get('titleSafe').height,
            '#888'
        );

        invisibleArea.setX((webvfxEditor.get('width') - invisibleWidth) / 2);
        invisibleArea.setY((webvfxEditor.get('height') - invisibleHeight) / 2);

        actionSafeArea.setX((webvfxEditor.get('width') - webvfxEditor.get('actionSafe').width) / 2);
        actionSafeArea.setY((webvfxEditor.get('height') - webvfxEditor.get('actionSafe').height) / 2);

        this.safeAreaLayer.add(actionSafeArea);
        this.safeAreaLayer.add(invisibleArea);
        this.safeAreaLayer.hide();
        this.safeAreaLayer.setListening(false);
        webvfxEditor.get('stage').add(this.safeAreaLayer);
    },
    getArea : function(outWidth, outHeight, inWidth, inHeight, color) {
        var base = new Kinetic.Rect({
            fill: color,
        });

        var top = base.clone({
            width: outWidth,
            height: (outHeight - inHeight) / 2,
            x: 0,
            y: 0
        });

        var bottom = top.clone({
            y: inHeight + ((outHeight - inHeight) / 2)
        });

        var left = base.clone({
            width: (outWidth - inWidth) / 2,
            height: inHeight,
            x: 0,
            y: (outHeight - inHeight) / 2
        });

        var right = left.clone({
            x: inWidth + ((outWidth - inWidth) / 2)
        });

        var area = new Kinetic.Group({
            'opacity': .4
        });
        area.add(top);
        area.add(bottom);
        area.add(left);
        area.add(right);

        return area;
    },
    videoPreview: function() {
        if ($("#video-preview").is(':checked')) {
            console.log('showing video preview');
            $('#container').removeClass('container-background');
            $(video).show();
        } else {
            console.log('hiding video preview');
            $(video).hide();
            $('#container').addClass('container-background');
        }
    },
    realTimeEdition: function () {
        webvfxEditor.set('realTimeEdition', $("#real-time-edition").is(':checked'));
        console.log('real time edition ' + (webvfxEditor.get('realTimeEdition') ? 'on' : 'off'));
    },
    addText: function () {
        var text = $('#text').val();
        if (text != '') {
            this.webvfxCollection.new = true;
            this.webvfxCollection.add(new WebvfxText({text: text}));
            $('#text').val('');
        }
    },
    keyUp: function (ev) {
        if (ev.keyCode == 13) {
            this.addText();
        }
    },
    updateVideo:  function () {
        console.log('manual update');
        this.webvfxCollection.sendAll();
    },
    clearAll: function() {
        if (this.webvfxCollection.models.length) {
            var self = this;
            var description = i18n.gettext('Clear all objects?');
            this.confirm(description, function () {
                self.webvfxCollection.destroyAll();
                console.log('clear all');
            });
        } else {
            this.alert("Nothing to clear");
        }
    },
    processFiles : function(files) {
        if (files && typeof FileReader !== "undefined") {
            for (var i = 0; i < files.length; i++) {
                this.readFile(files[i]);
            }
        }
    },
    readFile : function(file) {
        if( (/image/i).test(file.type) ) {
            var self = this;
            var reader = new FileReader();
            reader.onload = function(e) {
                console.log('loaded ' + file.name);
                self.uploadImage(file);
                image = new Image();
                image.name = file.name;
                image.type = file.type;
                image.src = e.target.result;
                self.webvfxCollection.new = true;
                self.webvfxCollection.add(
                    new WebvfxImage({image: image, name: file.name})
                );
            };
            reader.readAsDataURL(file);
        } else {
            var description = i18n.gettext('File format not supported');
            this.alert(description);
        }
    },
    uploadImage : function(file) {
        var formdata = new FormData();
        formdata.append('uploadedFile', file);
        $.ajax({
            url: 'uploadImage',
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: function(res) {
                console.log('uploaded ' + file.name);
            }
        });
    },
    dragOver : function() {
        console.log('dragover');
        $("#container").addClass('hover');
        return false;
    },
    dragLeave : function() {
        console.log('dragleave');
        $("container").removeClass('hover');
        return false;
    },
    drop: function(ev) {
        console.log('drop');
        ev.stopPropagation();
        ev.preventDefault();
        $("#container").removeClass('hover');
        var files = ev.originalEvent.dataTransfer.files;
        this.processFiles(files);
        return false;
    },
    filesChange: function (ev) {
        this.processFiles(ev.currentTarget.files);
    },
    makeSortable: function () {
        $("#webvfx-collection").sortable({
            cursor: 'move',
            stop: function(event, ui) {
                var total = $('.webvfx-obj').length - 1;
                var index = ui.item.index();
                ui.item.trigger('drop', total - index);
            }
        });
        //$("#webvfx-collection").disableSelection();
    },
    updateCss: function () {
        var top = 20;
        var left = 20;

        $('#container').css({
            top: top + 'px',
            left: left + 'px',
            width: webvfxEditor.get('width') + 'px',
            height: webvfxEditor.get('height') + 'px'
        });

        $('#player-container').css({
            top: top + 'px',
            left: left + 'px',
            width: webvfxEditor.get('width') + 'px',
            height: webvfxEditor.get('height') + 'px'
        });

        $('#main-controls').css({
            top: (webvfxEditor.get('height') + top) + 'px',
            left: left + 'px',
            width: webvfxEditor.get('width') + 'px'
        });

        $('#webvfx-collection').css({
            top: top + 'px',
            left: (webvfxEditor.get('width') + (left * 2)) + 'px'}
        );
    },
    updateVideoStream: function() {
        window.video = $('#player').get(0);
        video.width = webvfxEditor.get('width');
        video.height = webvfxEditor.get('height');
    },
    updateStatusBar: function() {
        var getStatusBarInfo = function() {
            var pos = webvfxEditor.get('stage').getMousePosition();
            if (pos === undefined) {
                var mouseX = 0;
                var mouseY = 0;
            } else {
                var mouseX = parseInt(pos.x / webvfxEditor.get('scale'));
                var mouseY = parseInt(pos.y / webvfxEditor.get('scale'));
            }
            return [
                'size: ' + webvfxEditor.get('width') + 'x' + webvfxEditor.get('height') + 'px',
                'scale: ' + webvfxEditor.get('scale'),
                'pointer at (' + mouseX + 'px,' + mouseY + 'px)'
            ].join(', ');
        }

        $('#status-bar').html(getStatusBarInfo());

        $(webvfxEditor.get('stage').getContent()).on('mousemove', function(event) {
            $('#status-bar').html(getStatusBarInfo());
        });
    },
    getParameterByName : function(name, defaultValue) {
        var name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
        var results = regex.exec(location.search);
        return results == null ? defaultValue : decodeURIComponent(results[1].replace(/\+/g, " "));
    },
    alert: function(description) {
        var title = i18n.gettext('Alert');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalAlert({ title: title, description: description }).render().el);
    },
    confirm: function(description, yesCallback, noCallback) {
        var yesCallback = yesCallback || function() {return; };
        var noCallback = noCallback || function() { return; };
        var title = i18n.gettext('Confirm');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalConfirm({ title: title, description: description, yesCallback: yesCallback, noCallback: noCallback }).render().el);
    },
    prompt: function (description, submitCallback, cancelCallback) {
        var submitCallback = submitCallback || function() {};
        var cancelCallback = cancelCallback || function() {};
        var title = i18n.gettext('Prompt');
        var description = description || i18n.gettext('Wait there was a problem');
        $('#modal').html(new ModalPrompt({ title: title, description: description, submitCallback: submitCallback, cancelCallback: cancelCallback }).render().el);
    }
});

var ModalAlert = Backbone.Modal.extend({
    initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.alert(this.options);
        return _.template(parse_tpl);
    },
    cancelEl: '.bbm-button'
});

var ModalConfirm = Backbone.Modal.extend({
     initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.confirm(this.options);
        return _.template(parse_tpl);
    },
    cancelEl: '.no',
    submitEl: '.yes',
    events: {
        "click .yes": function() { this.options.yesCallback(); },
        "click .no" : function() { this.options.noCallback();  },
    }
});

var ModalPrompt = Backbone.Modal.extend({
     initialize: function (options) {
        this.options = options || {};
    },
    template: function() {
        var parse_tpl = template.prompt(this.options);
        return _.template(parse_tpl);
    },
    submitEl: '.submit',
    cancelEl: '.cancel',
    events: {
        "click .submit": function(e) { this.options.submitCallback($('#text').val()); },
        "click .cancel": function() { this.options.cancelCallback(); },
    }
});
