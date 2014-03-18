// Using Sauce Connect: https://saucelabs.com/docs/connect

var webdriver = require('wd');
var expect = require('chai').expect;


describe('Test In-Out Video Editor', function() {

    var browser;

    before(function(done) {
        browser = webdriver.promiseChainRemote(
            "localhost",
            4445,
            process.env.SAUCE_OPCODE_USERNAME,
            process.env.SAUCE_OPCODE_ACCESS_KEY
        );

        browser.on('status', function(info) {
            console.log(info);
        });
        browser.on('command', function(meth, path, data) {
            console.log(' > ' + meth, path, data || '');
        });

        var options = {
          browserName: 'chrome',
          version: '26',
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

    });

})

