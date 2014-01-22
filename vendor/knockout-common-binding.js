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
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = valueAccessor();
        var data = value.data.model().attributes;

        data["el"] = $(element);
        data["path"] = value.path;

        if (element.widget) {
            element.widget.remove();
        }

        element.widget = new WebvfxAnimationWidget(data);

        //Making depencies over all viewmodel props
        _.each(value.data, function(prop) {
            if (prop.subscribe != undefined) {
                prop();
            }
        });
    }
};

