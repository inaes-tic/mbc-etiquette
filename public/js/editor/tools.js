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


// vim: set foldmethod=indent foldlevel=0 foldnestmax=1 :

