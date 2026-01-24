var db = require('./databaseConfig.js');

var salesRecordDB = {

    /* ======================================================
       CREATE SALES RECORD (USED BY payment.js)
    ====================================================== */
    insertSalesRecord: function (data) {
        return new Promise((resolve, reject) => {
            const conn = db.getConnection();

            conn.connect(err => {
                if (err) {
                    console.error("DB connection error:", err);
                    conn.end();
                    return reject(err);
                }

                const sql = `
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

                const sqlArgs = [
                    data.subtotal || data.price,   // fallback safety
                    data.price,
                    data.promotionDiscount || 0,
                    data.promotionId || null,
                    new Date(),
                    'SGD',
                    data.memberId
                ];

                conn.query(sql, sqlArgs, (err, result) => {
                    conn.end();

                    if (err) {
                        console.error("Insert sales record failed:", err);
                        return reject(err);
                    }

                    resolve({
                        success: result.affectedRows > 0,
                        generatedId: result.insertId
                    });
                });
            });
        });
    },

    /* ======================================================
       GET SALES HISTORY BY MEMBER (NEW)
    ====================================================== */
    getSalesHistoryByMember: function (memberId) {
        return new Promise((resolve, reject) => {
            const conn = db.getConnection();

            const sql = `
                SELECT
                    sr.ID AS orderId,
                    sr.CREATEDDATE,
                    sr.AMOUNTPAID,
                    sr.PROMOTION_DISCOUNT_AMOUNT,

                    i.NAME AS itemName,
                    i.SKU,
                    i.IMAGEURL,
                    li.QUANTITY,
                    i.UNITPRICE

                FROM salesrecordentity sr
                JOIN salesrecord_lineitementity srli
                    ON sr.ID = srli.SALESRECORD_ID
                JOIN lineitementity li
                    ON srli.LINEITEM_ID = li.ID
                JOIN itementity i
                    ON li.ITEM_ID = i.ID

                WHERE sr.MEMBER_ID = ?
                ORDER BY sr.CREATEDDATE DESC
            `;

            conn.query(sql, [memberId], (err, rows) => {
                conn.end();

                if (err) {
                    console.error("Get sales history failed:", err);
                    return reject(err);
                }

                resolve(rows);
            });
        });
    }
};

module.exports = salesRecordDB;
