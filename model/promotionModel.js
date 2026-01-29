var db = require('./databaseConfig.js');

/* ======================================================
   EXISTING FUNCTIONS (DO NOT CHANGE)
====================================================== */

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

module.exports.getBestPromotionByCountry = function (countryId) {
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
      LIMIT 1
    `;

    const conn = db.getConnection();

    conn.connect(err => {
      if (err) return reject(err);

      conn.query(sql, [countryId], (err, results) => {
        conn.end();
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  });
};

// /* ======================================================
//    NEW FUNCTIONS FOR CHECKOUT & PAYMENT
// ====================================================== */

// /**
//  * Used ONLY by payment.js
//  * Determines which promotions are eligible for checkout
//  */
// module.exports.getEligiblePromotions = function ({ countryId }) {
//   return new Promise((resolve, reject) => {
//     const sql = `
//       SELECT *
//       FROM promotionentity
//       WHERE COUNTRY_ID = ?
//         AND STARTDATE <= CURDATE()
//         AND ENDDATE >= CURDATE()
//     `;

//     const conn = db.getConnection();
//     conn.connect(err => {
//       if (err) return reject(err);

//       conn.query(sql, [countryId], (err, results) => {
//         conn.end();
//         if (err) return reject(err);
//         resolve(results);
//       });
//     });
//   });
// };



// /**
//  * Pure calculation function
//  * No DB access
//  */
// module.exports.calculateDiscount = function (promotion, subtotal) {
//   if (!promotion) return 0;

//   // Percentage discount
//   return Math.round(subtotal * (promotion.DISCOUNTRATE / 100));
// };

