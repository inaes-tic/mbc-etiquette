var ImageFile = Backbone.Model.extend();
var ImageFiles = Backbone.Collection.extend({
    model: ImageFile,
    url: "/ImageFiles"
});

var Effect = Backbone.Model.extend();
var Effects = Backbone.Collection.extend({
    model: Effect,
    url: "/Effects"
});

var Element = Backbone.Model.extend();
var Elements = Backbone.Collection.extend({
    model: Element,
    url: "/Elements"
});
