var db = require('./databaseConfig.js');

module.exports.getAllActivePromotions = function (countryId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        p.ID,
        p.description,
        p.discountRate,
        p.startDate,
        p.endDate,
        p.imageURL,
        i.sku
      FROM promotionentity p
      JOIN itementity i ON p.ITEM_ID = i.ID
      WHERE p.country_id = ?
      ORDER BY p.discountRate DESC
    `;

    const conn = db.getConnection();

    conn.connect((err) => {
      if (err) return reject(err);

      conn.query(sql, [countryId], (err, results) => {
        conn.end();
        if (err) return reject(err);

        resolve(results);
      });
    });
  });
};

