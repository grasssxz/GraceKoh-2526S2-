var db = require('./databaseConfig.js');

var salesRecordDB = {
    insertSalesRecord: function (data) {
        return new Promise((resolve, reject) => {
            var conn = db.getConnection();
            conn.connect(function (err) {
                if (err) {
                    console.log(err);
                    conn.end();
                    return reject(err);
                }

                /*
                  data should contain:
                  - subtotal
                  - price (final price after discount)
                  - promotionId (nullable)
                  - promotionDiscount
                  - memberId
                */

                var sql = `
                    INSERT INTO salesrecordentity
                    (
                        AMOUNTDUE,
                        AMOUNTPAID,
                        PROMOTION_DISCOUNT_AMOUNT,
                        APPLIED_PROMOTION_ID,
                        CREATEDDATE,
                        CURRENCY,
                        MEMBER_ID
                    )
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `;

                var sqlArgs = [
                    data.subtotal,                 // original total
                    data.price,                    // final payable amount
                    data.promotionDiscount || 0,   // discount amount
                    data.promotionId || null,      // promotion used
                    new Date(),
                    'SGD',
                    data.memberId
                ];

                conn.query(sql, sqlArgs, function (err, result) {
                    conn.end();

                    if (err) {
                        console.log(err);
                        return reject(err);
                    }

                    if (result.affectedRows > 0) {
                        return resolve({
                            success: true,
                            generatedId: result.insertId
                        });
                    }

                    return resolve({ success: false });
                });
            });
        });
    }
};

module.exports = salesRecordDB;
