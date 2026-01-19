var db = require('./databaseConfig.js');

module.exports.getShowRoomByName = function (name, countryId) {
    return new Promise(function (resolve, reject) {
        var conn = db.getConnection();

        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return reject(err);
            }

            var sql = `
                SELECT
                    sr.id AS showroomId,
                    sr.name AS showroomName,
                    sr.description AS showroomDescription,
                    sr.imageURL AS showroomImageURL,

                    h.id AS hotspotId,
                    h.xPercent,
                    h.yPercent,
                    h.widthPercent,
                    h.heightPercent,

                    i.id AS itemId,
                    i.sku,
                    i.name AS itemName,
                    i.description AS itemDescription,

                    ic.RETAILPRICE AS itemPrice

                FROM showRoomentity sr
                JOIN showroom_item_hotspot h
                    ON sr.id = h.showroomId
                JOIN itementity i
                    ON h.itemId = i.id
                JOIN item_countryentity ic
                    ON ic.ITEM_ID = i.id
                   AND ic.COUNTRY_ID = ?
                WHERE sr.name = ?;
            `;

            conn.query(sql, [countryId, name], function (err, rows) {
                conn.end();

                if (err) {
                    console.log(err);
                    return reject(err);
                }

                if (rows.length === 0) {
                    return resolve(null);
                }

                var showroom = {
                    id: rows[0].showroomId,
                    name: rows[0].showroomName,
                    description: rows[0].showroomDescription,
                    imageURL: rows[0].showroomImageURL,
                    items: []
                };

                rows.forEach(row => {
                    showroom.items.push({
                        itemId: row.itemId,
                        sku: row.sku,
                        name: row.itemName,
                        description: row.itemDescription,
                        price: row.itemPrice,         
                        xPercent: row.xPercent,
                        yPercent: row.yPercent,
                        widthPercent: row.widthPercent,
                        heightPercent: row.heightPercent
                    });
                });

                resolve(showroom);
            });
        });
    });
};




module.exports.getShowRoomById = function (id) {
    return new Promise(function (resolve, reject) {
        var conn = db.getConnection();

        conn.connect(function (err) {
            if (err) {
                console.log(err);
                return reject(err);
            }

            var sql = `
                SELECT id, name, description, imageURL
                FROM showRoomentity
                WHERE id = ?
            `;

            conn.query(sql, [id], function (err, result) {
                conn.end();

                if (err) {
                    console.log(err);
                    return reject(err);
                }

                resolve(result);
            });
        });
    });
};
