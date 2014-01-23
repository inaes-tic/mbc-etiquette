window.LiveView= function(options) {

    options = options || {};
    collection = options['collection'];
    this.collection = collection;

    var el = options['el'] || $('body');
    this.el = el;

    this.view_model = {
        items: kb.collectionObservable(collection)
    };

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

    el.html(template.liveview({}));
    ko.applyBindings(this.view_model, el[0]);
};
