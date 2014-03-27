Backbone.io.connect();
var appCollection = new App.Collection();
window.appCollection = appCollection;

appCollection.fetch({success: function() {
    window.LiveCollection = new Sketch.LiveCollection();
    window.playerView = new PlayerView({ collection: LiveCollection });
}});

var player = {
    scale: 0,
    isFullscreen: false,

    enterFullscreen: function() {
        this.isFullscreen = true;
        this.scale = playerView.view_model.scale();
        var new_scale = screen.width * this.scale / parseFloat($('#video').css('width'));
        playerView.view_model.scale(new_scale);
        $('#video').css('top', 0);
        $('#content').css('top', 0);
        screenfull.request($('#player')[0]);
    },

    exitFullscreen: function() {
        this.isFullscreen = false;
        screenfull.exit();
        playerView.view_model.scale(this.scale);
        $('#video').css('top', '100px');
        $('#content').css('top', '100px');
    },

    toggleFullscreen: function() {
        if (this.isFullscreen) {
            this.exitFullscreen();
        } else {
            this.enterFullscreen();
        }
    },

    togglePlay: function() {
        if ($('#video')[0].paused) {
            $('#video')[0].play();
        } else {
            $('#video')[0].pause();
        }
    },
};

document.addEventListener('keyup', function(e) {
    var F11   = 122;
    var SPACE = 32;
    if (e.which == F11) {
        player.toggleFullscreen();
    }
    if (e.which == SPACE) {
        player.togglePlay();
    }
});
