/*
var appCollection = new App.Collection();

window.appCollection = appCollection;
window.appstatus = new App.Status();
window.framestatus = new App.ProgressStatus();
*/
var AppRouter = Backbone.Router.extend({

    routes: {
        "editor"             : "editor",
    },

    initialize: function () {
        window.socket = io.connect('http://' + window.location.hostname);
        this.headerView = new HeaderView({});
    },

    editor: function() {
        new EditorView();
    }
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

app = new AppRouter();
Backbone.history.start({pushState:true});

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
