$(document).ready(function() {

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

    /**
     * Widgets behaviour
     */
    $("#webvfx-collection").sortable({
        cursor: 'move',
        stop: function(event, ui) {
            var total = $('.webvfx-obj').length - 1;
            var index = ui.item.index();
            ui.item.trigger('drop', total - index);
        }
    });
    //$("#webvfx-collection").disableSelection();

    var addText = function() {
        var text = $('#text').val();
        if (text != '') {
            webvfxCollection.new = true;
            webvfxCollection.add(new WebvfxText({text: text}));
            $('#text').val('');
        }
    };

    $('#addText').click(addText);

    $('#text').keyup(function(e) {
        if (e.keyCode == 13) {
            addText();
        }
    });

    $('#files').change(function () {
        processFiles(this.files);
    });

    window.realTimeEdition = false;
    $('#real-time-edition').on('click', function() {
        window.realTimeEdition = $(this).is(':checked') ? true : false;
        console.log('real time edition ' + (window.realTimeEdition ? 'on' : 'off'));
    });

    $('#safe-area').on('click', function() {
        if (window.safeArea === undefined) {
            console.log('creating safe area');
            window.createSafeArea();
        }
        if ($(this).is(':checked')) {
            console.log('showing safe area');
            window.safeArea.show();
            window.safeArea.draw();
        } else {
            console.log('hiding safe area');
            window.safeArea.hide();
        };
    });

    $('#video-preview').on('click', function() {
        if ($(this).is(':checked')) {
            console.log('showing video preview');
            $('#container').removeClass('container-background');
            $(video).show();
        } else {
            console.log('hiding video preview');
            $(video).hide();
            $('#container').addClass('container-background');
        };
    });

    $('#update').click(function() {
        console.log('manual update');
        webvfxCollection.sendAll();
    });

    $('#delete-all').click(function() {
        if (webvfxCollection.models.length && confirm('delete all objects?')) {
            webvfxCollection.destroyAll();
            console.log('delete all');
        }
    });

    // Storage
    storage.getAllKeys().forEach(function(k) {
        $('#sketchs').append($('<option>').html(k));
    })

    $('#load-sketch').on('click', function() {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            alert('select a sketch to load');
            return;
        }
        sketch.load(key);
        console.log('sketch "' + key + '" loaded');
    });

    $('#save-sketch').on('click', function() {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            var key = prompt('name');
            if (!key) return;
        }
        var keyExists = (storage.getAllKeys().indexOf(key) >= 0);
        if (keyExists && !confirm('overwrite sketch "' + key + '" ?')) {
            return;
        }
        sketch.save(key);
        if (!keyExists) {
            $('#sketchs').append($('<option>').html(key).prop('selected', true));
        }
        console.log('sketch "' + key + '" saved');
    });

    $('#del-sketch').on('click', function() {
        var key = $('#sketchs').val();
        if (key == '[select]') {
            alert('select a sketch to del');
            return;
        }
        if (confirm('the sketch "' + key + '" will be deleted')) {
            storage.del(key);
            $('#sketchs option').filter(
                function() {
                    return $(this).html() == key;
                }
            ).remove();
            console.log('sketch "' + key + '" deleted');
        }
    });

    // Dropzone
    var dropzone = $('#container');

    dropzone.on('dragover', function() {
        console.log('dragover');
        dropzone.addClass('hover');
        return false;
    });

    dropzone.on('dragleave', function() {
        console.log('dragleave');
        dropzone.removeClass('hover');
        return false;
    });

    dropzone.on('drop', function(e) {
        console.log('drop');
        e.stopPropagation();
        e.preventDefault();
        dropzone.removeClass('hover');
        var files = e.originalEvent.dataTransfer.files;
        processFiles(files);
        return false;
    });

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
    //*/

    /**
     * Images upload
     */
    var processFiles = function(files) {
        if (files && typeof FileReader !== "undefined") {
            for (var i = 0; i < files.length; i++) {
                readFile(files[i]);
            }
        }
    };

    var readFile = function(file) {
        if( (/image/i).test(file.type) ) {
            var reader = new FileReader();
            reader.onload = function(e) {
                console.log('loaded ' + file.name);
                uploadImage(file);
                image = new Image();
                image.name = file.name;
                image.type = file.type;
                image.src = e.target.result;
                webvfxCollection.new = true;
                webvfxCollection.add(
                    new WebvfxImage({image: image, name: file.name})
                );
            };
            reader.readAsDataURL(file);
        } else {
            alert('File format not supported');
        }
    };

    // Upload image to server node
    var uploadImage = function(file) {
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
    };

    /**
     * Webvfx Objects List
     */
    window.webvfxCollection = new WebvfxCollection();

    var webvfxCollectionView = new WebvfxCollectionView(webvfxCollection);

});

// vim: set foldmethod=indent foldlevel=1 foldnestmax=2 :
