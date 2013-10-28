var appCollection = new App.Collection();
window.appCollection = appCollection;

var AppRouter = Backbone.Router.extend({

    routes: {
        "editor"             : "editor",
    },

    initialize: function () {
        window.socket = io.connect('http://' + window.location.hostname);
        this.headerView = new HeaderView({});
    },

    editor: function() {
        return new EditorView();
    },

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
        if (!_.isRegExp(route)) route = this._routeToRegExp(route);
        if (_.isFunction(name)) {
          callback = name;
          name = '';
        }
        if (!callback) callback = this[name];
        var router = this;
        Backbone.history.route(route, function(fragment) {
            var args = router._extractParameters(route, fragment);

            var ok = function() {
                if (callback) {
                    router.currentView = callback.apply(router, args);
                }
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                Backbone.history.trigger('route', router, name, args);
                router.currentHash = Backbone.history.getHash();
            };

            var cancel = function() {
                // XXX: keep this, otherwise the browser url will point somewhere else.
                // we need to set the history fragment to the (now) previous location
                // to avoid re-creating the current view when we change the browser url.
                // router.currentHash is updated by us after a successfull route change.
                Backbone.history.fragment = router.currentHash;
                location.hash = router.currentHash;
            };

            if (router.currentView && router.currentView.canNavigateAway) {
                router.currentView.canNavigateAway({ok: ok, cancel: cancel});
            } else {
                ok();
            }
        });
        return this;
    },
});

var lang = $('html')[0].lang;

var i18n;
$.ajax({
    type: 'GET',
    url: '/po/' + lang,
    dataType: 'json',
    success: function(data) {
        i18n = new Jed ({
            locale_data : data,
            'domain' : 'messages'
        });
    },
    data: {},
    async: false
});

appCollection.fetch({success: function() {
    app = new AppRouter();
    Backbone.history.start({pushState:true});
}});

$(document).on("click", "a[href^='/']", function(event) {
    var href, url;
    href = $(event.currentTarget).attr('href');
    if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        url = href.replace(/^\//, '').replace('\#\!\/', '');
        app.navigate(url, {trigger: true});
        return false;
    }
});
