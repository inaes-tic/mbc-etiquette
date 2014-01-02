var mbc            = require('mbc-common'),
    collections    = mbc.config.Common.Collections
;

module.exports = function (db) {
    var backends = {
        app: {
            use: ['configStore']
        },
        sketch: {
            use: ['uuid'],
            mongo: {
                db: db,
               collection: collections.Sketchs,
            }
        },
    }
    return backends;
};
