var timeWidget = function(options) {

    var options = $.extend({

        id: 'time',
        el: 'div',
        style: {},
        interval: 500,

        success: function(time, options) {
            $('#' + options.id).html(
                time.h + ':' + time.m + ':' + time.s
            ).css(options.style);
        }

    }, options);

    $('body').append(
        $('<' + options.el + ' />').attr( {id: options.id} )
    );

    function checkTime(i) {
        return (i < 10) ? '0' + i : i;
    }

    (function startTime() {
        if ( $('#' + options.id).length ) {
            var today = new Date();
            var time = {
                h: today.getHours(),
                m: checkTime(today.getMinutes()),
                s: checkTime(today.getSeconds()),
            };
            options.success(time, options);
            var t = setTimeout(function(){ startTime() }, options.interval);
        }
    })();

};

var weatherWidget = function(options) {

    var options = $.extend({

        id: 'weather',
        el: 'div',
        woeid: 468739,
        unit: 'c',
        style: {},
        interval: 10000,

        success: function(weather, options) {
            $('#' + options.id).html(
                weather.temp + weather.units.temp + ' ' +
                weather.humidity + weather.units.humidity
            ).css(options.style);
        }

    }, options);

    $('body').append(
        $('<' + options.el + ' />').attr( {id: options.id} )
    );

    var now = new Date();
    var rnd = now.getDay() + now.getHours() + now.getMinutes();
    var weatherUrl = 'http://query.yahooapis.com/v1/public/yql?format=json&rnd=' + rnd +
                     '&q=select * from weather.forecast where woeid=' + options.woeid +
                     ' and u="' + options.unit + '"';

    (function getWeather() {
        if ( $('#' + options.id).length ) {
            $.getJSON(weatherUrl, function(data) {
                if (data !== null && data.query.results !== null && 
                    data.query.results.channel.description !== 'Yahoo! Weather Error') {
                    var weather = {
                        temp: data.query.results.channel.item.condition.temp,
                        humidity: data.query.results.channel.atmosphere.humidity,
                        units: {
                            temp: '&deg;' + data.query.results.channel.units.temperature,
                            humidity: '%'
                        }
                    };
                    options.success(weather, options);
                } else {
                    $('#' + options.id).html('ERROR').css(options.style);
                }
                var t = setTimeout(function(){ getWeather() }, options.interval);
            });
        }
    })();

};
