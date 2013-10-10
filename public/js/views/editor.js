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

window.EditorView = Backbone.View.extend({
    el: $('#content'),

    events: {
        "click #save-sketch"    : "saveSketch",
        "click #load-sketch"    : "loadSketch",
        "click #del-sketch"     : "delSketch",
        "click #safe-area"      : "safeArea",
        "click #video-preview"  : "videoPreview",
        "click #real-time-edition" : "realTimeEdition",
        "click #addText"        : "addText",
        "keyup #text"           : "keyUp",
        "click #update"         : "updateVideo",
        "click #delete-all"     : "deleteAll",
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

        $(document).ready(function() {
            self.makeSortable();
            self.ready();
        });
    },

    saveSketch: function () {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var key = prompt('name');
            if (!key) return;
        }

        var objects = [];
        this.webvfxCollection.each(function(e) {
            objects.push(e.getDataToStore());
        });

        var keyExists = _.contains(this.sketchs.pluck('name'), key);
        if (keyExists && !confirm('overwrite sketch "' + key + '" ?')) {
            return;
        }

        if (!keyExists) {
            var model = { name: key,  data: objects };
            this.sketchs.create(model, {success: function() {
            }});
            $('#sketchs').append($('<option>').html(key).prop('selected', true));
        } else {
            var model = this.sketchs.findWhere({name: key});
            model.set({ name:key , data: objects });
        }

        console.log('sketch "' + key + '" saved');
    },
    loadSketch: function() {
        var self = this;
        var key = $('#sketchs').val();
        if (key == '[select]') {
            alert('select a sketch to load');
            return;
        }
        this.webvfxCollection.destroyAll();

        _.each(this.sketchs.findWhere({name: key}).get('data'), function(s) {
            if (s.type == 'Image') {
                s.image = new Image();
                s.image.src = s.src;
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
            alert('select a sketch to del');
            return;
        }
        if (confirm('the sketch "' + key + '" will be deleted')) {
            var model = this.sketchs.findWhere({ name: key });
            this.sketchs.remove(model);

            $('#sketchs option').filter(
                function() {
                    return $(this).html() == key;
                }
            ).remove();
            console.log('sketch "' + key + '" deleted');
        }
    },
    getSketchs: function () {
        var keys = this.sketchs.pluck('name');
        _.each(keys, function(k) {
            $('#sketchs').append($('<option>').html(k));
        });
    },
    safeArea: function() {
        if (window.safeArea === undefined) {
            console.log('creating safe area');
            window.createSafeArea();
        }
        if ($("#safe-area").is(':checked')) {
            console.log('showing safe area');
            window.safeArea.show();
            window.safeArea.draw();
        } else {
            console.log('hiding safe area');
            window.safeArea.hide();
        }
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
        window.realTimeEdition = $("#real-time-edition").is(':checked') ? true : false;
        console.log('real time edition ' + (window.realTimeEdition ? 'on' : 'off'));
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
    deleteAll: function() {
        if (this.webvfxCollection.models.length && confirm('delete all objects?')) {
            this.webvfxCollection.destroyAll();
            console.log('delete all');
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
            alert('File format not supported');
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
    ready: function() {
        var self = this;
        var getParameterByName = function(name, defaultValue) {
            var name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
            var results = regex.exec(location.search);
            return results == null ? defaultValue : decodeURIComponent(results[1].replace(/\+/g, " "));
        }

        var width = getParameterByName('width', 720);
        var height = getParameterByName('height', 570);

        window.stageScale = getParameterByName('scale', 1);
        window.stageWidth = Math.round(width * stageScale);
        window.stageHeight = Math.round(height * stageScale);

        window.actionSafe = {
            'width': Math.round(648 * stageScale),
            'height': Math.round(518 * stageScale)
        };
        window.titleSafe = {
            'width': Math.round(576 * stageScale),
            'height': Math.round(460 * stageScale)
        };

      /**
        * Canvas
        */
        window.stage = new Kinetic.Stage({
            container: 'container',
            width: window.stageWidth,
            height: window.stageHeight,
        });
        stage.add(new Kinetic.Layer());

        /**
         * Setting css for ui elements according to scale
         */
        var top = 20;
        var left = 20;

        $('#container').css({
            top: top + 'px',
            left: left + 'px',
            width: window.stageWidth + 'px',
            height: window.stageHeight + 'px'
        });

        $('#player-container').css({
            top: top + 'px',
            left: left + 'px',
            width: window.stageWidth + 'px',
            height: window.stageHeight + 'px'
        });

        window.video = $('#player').get(0);
        video.width = window.stageWidth;
        video.height = window.stageHeight;

        $('#main-controls').css({
            top: (window.stageHeight + top) + 'px',
            left: left + 'px',
            width: window.stageWidth + 'px'
        });

        $('#webvfx-collection').css({
            top: top + 'px',
            left: (window.stageWidth + (left * 2)) + 'px'}
        );

        window.realTimeEdition = false;

        //* Status bar
        var getStatusBarInfo = function() {
            var pos = stage.getMousePosition();
            if (pos === undefined) {
                var mouseX = 0;
                var mouseY = 0;
            } else {
                var mouseX = parseInt(pos.x / stageScale);
                var mouseY = parseInt(pos.y / stageScale);
            }
            return [
                'size: ' + stageWidth + 'x' + stageHeight + 'px',
                'scale: ' + stageScale,
                'pointer at (' + mouseX + 'px,' + mouseY + 'px)'
            ].join(', ');
        }

        $('#status-bar').html(getStatusBarInfo());

        $(stage.getContent()).on('mousemove', function(event) {
            $('#status-bar').html(getStatusBarInfo());
        });

    }
});
