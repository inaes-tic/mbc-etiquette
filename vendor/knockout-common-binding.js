ko.bindingHandlers.WebvfxSimpleWidget = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        var currentValue = ko.utils.unwrapObservable(value);
        currentValue["el"] = $(element);
        this.widget = new WebvfxSimpleWidget(currentValue);
    },
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor();
        var currentValue = ko.utils.unwrapObservable(value);
        currentValue["el"] = $(element);
        this.widget.remove();
        this.widget = new WebvfxSimpleWidget(currentValue);
    }
};

ko.bindingHandlers.WebvfxAnimationWidget = {
    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
        var value = valueAccessor();
        var currentValue = ko.utils.unwrapObservable(value);
        currentValue["el"] = $(element);
        this.widget = new WebvfxAnimationWidget(currentValue);
    },
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor();
        var currentValue = ko.utils.unwrapObservable(value);
        currentValue["el"] = $(element);
        this.widget.remove();
        this.widget = new WebvfxAnimationWidget(currentValue);
    }
};

