ko.bindingHandlers.WebvfxSimpleWidget = {
    update: function(element, valueAccessor, allBindingsAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor());
        var options = value.options();

        options["el"] = $(element);
        options.style['z-index'] = value.zindex();

        if (element.widget) {
            element.widget.remove();
        }

        element.widget = new WebvfxSimpleWidget(options);
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

