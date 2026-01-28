var db = require('./databaseConfig.js');
var Store = require('./store.js')
var storeDB = {
    getItemQuantity: function (sku, storeId) {
    return new Promise((resolve, reject) => {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                conn.end();
                return reject(err);
            }

            var sql = `
                SELECT IFNULL(SUM(l.QUANTITY), 0) AS sum
                FROM lineitementity l
                JOIN itementity i ON l.ITEM_ID = i.ID
                WHERE i.SKU = ?
            `;

            conn.query(sql, [sku], function (err, result) {
                conn.end();
                if (err) return reject(err);
                return resolve(result);
            });
        });
    });
},

    getStoresByCountry: function (country) {
        return new Promise( ( resolve, reject ) => {
            var conn = db.getConnection();
            conn.connect(function (err) {
                if (err) {
                    console.log(err);
                    conn.end();
                    return reject(err);
                }
                else {
                    var sql = 'SELECT * FROM storeentity WHERE COUNTRY_ID=(SELECT ID FROM countryentity c WHERE c.NAME=?)';
                    conn.query(sql, [country], function (err, result) {
                        if (err) {
                            conn.end();
                            return reject(err);
                        } else {
                            var storeList = [];
                            for(var i = 0; i < result.length; i++) {
                                var store = new Store();
                                store.id = result[i].ID;
                                store.address = result[i].ADDRESS;
                                store.email = result[i].EMAIL;
                                store.isDeleted = result[i].ISDELETED;
                                store.name = result[i].NAME;
                                store.postalCode = result[i].POSTALCODE;
                                store.telephone = result[i].TELEPHONE;
                                store.countryId = result[i].COUNTRY_ID;
                                store.regionalOfficeId = result[i].REGIONALOFFICE_ID;
                                store.warehouseId = result[i].WAREHOUSE_ID;
                                store.storeMapImgUrl = result[i].STOREMAPIMAGEURL;
                                store.longtitude = result[i].longtitude;
                                store.latitude = result[i].latitude;
                                storeList.push(store);
                            }
                            conn.end();
                            return resolve(storeList);
                        }
                    });
                }
            });
        });
    },
    getStoreNameById: function (id) {
        return new Promise( ( resolve, reject ) => {
            var conn = db.getConnection();
            conn.connect(function (err) {
                if (err) {
                    console.log(err);
                    conn.end();
                    return reject(err);
                }
                else {
                    var sql = 'SELECT * FROM storeentity s WHERE s.ID = ?';
                    conn.query(sql, [id], function (err, result) {
                        if (err) {
                            conn.end();
                            return reject(err);
                        } else {
                            conn.end();
                            return resolve(result[0].NAME);
                        }
                    });
                }
            });
        });
    },

    getItemQuantityByStoreName: function (itemId, storeName) {
    return new Promise((resolve, reject) => {
        var conn = db.getConnection();
        conn.connect(function (err) {
            if (err) {
                conn.end();
                return reject(err);
            }

            var sql = `
                SELECT IFNULL(SUM(l.QUANTITY), 0) AS sum
                FROM lineitementity l
                JOIN itementity i ON l.ITEM_ID = i.ID
                JOIN storeentity s ON s.ID = (
                    SELECT ID FROM storeentity WHERE NAME = ?
                )
                WHERE i.ID = ?
            `;

            conn.query(sql, [storeName, itemId], function (err, result) {
                conn.end();
                if (err) return reject(err);
                return resolve(result);
            });
        });
    });
},


    setStoreQuantity: function (data) {
        return new Promise( ( resolve, reject ) => {
            var conn = db.getConnection();
            conn.connect(function (err) {
                if (err) {
                    console.log(err);
                    conn.end();
                    return reject(err);
                }
                else {
                    var sql = 'UPDATE lineitementity SET QUANTITY=? WHERE ITEM_ID=? AND ID IN '
                        + '(SELECT lineItems_ID FROM storagebinentity_lineitementity WHERE StorageBinEntity_ID = '
                        + '(SELECT ID FROM storagebinentity WHERE TYPE = "Outbound" AND WAREHOUSE_ID = '
                        + '(SELECT WAREHOUSE_ID FROM storeentity WHERE NAME = ?)))';
                    conn.query(sql, [data.qty,data.itemId,data.storeName], function (err, result) {
                        if (err) {
                            conn.end();
                            return reject(err);
                        } else {
                            if(result.changedRows > 0) {
                                conn.end();
                                return resolve(true);
                            }
                        }
                    });
                }
            });
        });
    }
};
module.exports = storeDB