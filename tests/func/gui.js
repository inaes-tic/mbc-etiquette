// Using Sauce Connect: https://saucelabs.com/docs/connect

var webdriver = require('wd');
var expect = require('chai').expect;


describe('Test In-Out Video Editor', function() {

    var browser;

    before(function(done) {
        if (process.env.CHROMEDRIVER) {
            browser = webdriver.promiseChainRemote('http://localhost:9515');
        }
        else if (process.env.SAUCELABS) {
            browser = webdriver.promiseChainRemote(
                "localhost",
                4445,
                process.env.SAUCE_OPCODE_USERNAME,
                process.env.SAUCE_OPCODE_ACCESS_KEY
            );
        }

        browser.on('status', function(info) {
            console.log(info);
        });
        browser.on('command', function(meth, path, data) {
            console.log(' > ' + meth, path, data || '');
        });

        var options = {
          browserName: 'chrome',
          version: '31',
          platform: 'Linux',
          tags: ["mbc-etiquette"],
          name: "MBC-Etiquette Tests Suite"
        };

        return browser
            .init(options)
            .get('http://localhost:3100/editor')
            .nodeify(done);
    });

    after(function(done) {
        return browser
            .quit()
            .nodeify(done);
    });

    describe('Check UI', function() {

        it('Should see the correct title', function(done) {
            browser
                .title(function(err, title) {
                    expect(title).equals('MBC Webvfx Editor');
                })
                .nodeify(done);
        });

        it('Should create an object', function(done) {
            setTimeout(function() {
                browser
                    .elementById('objects')
                    .click()
                    .elementByXPath('//*[@id="objects"]/option[5]')
                    .click()
                    .eval('$(".webvfx-obj").length', function(err, value) {
                        expect(value).equals(1);
                    })
                    .nodeify(done);
            }, 15000);
        });

        it('Should save a sketch', function(done) {
            setTimeout(function() {
                browser
                    .elementById('save-sketch')
                    .click()
                    .elementById('textkey')
                    .type('sketch-test')
                    .elementByClassName('submit')
                    .click()
                    .eval('$("#sketchs option").length', function(err, value) {
                        expect(value).equals(2);
                    })
                    .nodeify(done);
            }, 15000);
        });

    });

})

