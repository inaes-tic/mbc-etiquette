window.webvfxClient = {

    remove: function(data) {
        this.send('remove', data, function(res) {
            console.log('remove object ' + data.elements);
        });
    },

    addImage: function(data) {
        this.send('addImage', data, function(res) {
            console.log('image added: ' + data.name);
        });
    },

    addText: function(data) {
        this.send('addBanner', data, function(res) {
            console.log('text added: ' + data.text);
        });
    },

    addEffect: function(data) {
        this.send('addEffect', data, function(res) {
            console.log('effect ' + data.effects + ' added on ' + data.elements);
        });
    },

    move: function(data) {
        this.send('move', data, function(res) {
            console.log('moved object ' + data.elements);
        });
    },

    send: function(url, data, callback) {
        var formdata = new FormData();
        for (var key in data) {
            formdata.append(key, data[key]);
        }
        $.ajax({
            url: url,
            type: 'POST',
            data: formdata,
            processData: false,
            contentType: false,
            success: callback
        });
    }

};


window.storage = {

    getAllKeys: function() {
        var keys = [];
        for (key in localStorage) {
            keys.push(key);
        }
        return keys;
    },

    get: function(key) {
        return JSON.parse(localStorage.getItem(key));
    },

    save: function(key, obj) {
        localStorage.setItem(key, JSON.stringify(obj));
    },

    del: function(key) {
        localStorage.removeItem(key);
    },

};

window.sketch = {

    load: function(key) {
        window.webvfxCollection.destroyAll();

        storage.get(key).forEach(function(e) {
            console.log('add');
            if (e.type == 'Image') {
                e.image = new Image();
                e.image.src = e.src;
                window.webvfxCollection.add(new WebvfxImage(e));
            }
            if (e.type == 'Text') {
                window.webvfxCollection.add(new WebvfxText(e));
            }
        });
    },

    save: function(key) {
        objects = [];
        window.webvfxCollection.each(function(e) {
            objects.push(e.getDataToStore());
        });
        storage.save(key, objects);
    },

};

window.createSafeArea = function() {

    window.safeArea = new Kinetic.Layer();

    var invisibleWidth = Math.round(1920 * stageScale);
    var invisibleHeight = Math.round(1080 * stageScale);

    var invisibleArea = getArea(
        invisibleWidth,
        invisibleHeight,
        actionSafe.width,
        actionSafe.height,
        '#333'
    );

    var actionSafeArea = getArea(
        actionSafe.width,
        actionSafe.height,
        titleSafe.width,
        titleSafe.height,
        '#888'
    );

    invisibleArea.setX((stageWidth - invisibleWidth) / 2);
    invisibleArea.setY((stageHeight - invisibleHeight) / 2);

    actionSafeArea.setX((stageWidth - actionSafe.width) / 2);
    actionSafeArea.setY((stageHeight - actionSafe.height) / 2);

    safeArea.add(actionSafeArea);
    safeArea.add(invisibleArea);
    safeArea.hide();
    safeArea.setListening(false);
    stage.add(safeArea);

};

var getArea = function(outWidth, outHeight, inWidth, inHeight, color) {

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

};


// vim: set foldmethod=indent foldlevel=0 foldnestmax=1 :

