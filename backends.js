var mbc            = require('mbc-common'),
    collections    = mbc.config.Common.Collections,
    backboneio     = require('backbone.io'),
    middleware     = new mbc.iobackends().get_middleware()
;

module.exports = function (db) {
    var backends = {
        app: {
            use: [backboneio.middleware.configStore()]
        },
        sketch: {
            use: [middleware.uuid],
            mongo: {
                db: db,
                collection: collections.Sketchs,
            }
        },
        live: {
            use: [backboneio.middleware.memoryStore()]
        }
    }
    return backends;
};
