window.HeaderView = function (options) {
    var self = this;
    self.el = 'el' in options ? options['el'] : $('#Panel');
    $(self.el).html(template.header());

    var HeaderViewModel = kb.ViewModel.extend({
        constructor: function(model) {
            kb.ViewModel.prototype.constructor.apply(this, arguments);
            var self = this;
        }
    });

    self.selectMenuItem = function (menuItem) {
        $('#nav li').removeClass('active');
        if (menuItem) {
            $('.' + menuItem).addClass('active');
        }
        $('.btn-collapse').click()
    };

    var toggle = function(e) {
        var panel = self.el;
        var content = $('#content');

        // Make it smooth
        content.addClass("trans");

        if (panel.position().top != $(window).scrollTop()) {
            // Expanded header
            $("body").removeClass("folded");
        } else {
            // Compact header
            $("body").addClass("folded");
        };

        // Js Events
        $(window).resize();
    };
    $('#toggle-header').click(toggle);
}

