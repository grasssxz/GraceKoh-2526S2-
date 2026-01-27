var db = require('../model/databaseConfig');

var express = require('express');
var app = express();
app.use(express.json());  
var member = require('../model/memberModel.js');
var salesRecord = require('../model/salesrecordModel.js');
var lineItem = require('../model/lineitemModel.js');
var salesRecord_lineItem = require('../model/salesrecord_lineitemModel.js');
var deliveryDetails = require('../model/deliveryDetailsModel.js');
var stripe = require("stripe")("sk_test_fHytNQpl6Bjt3Yo4ppWGgpU6");
var promotionModel = require('../model/promotionModel'); // ✅ NEW
let middleware = require('./middleware');


var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({
    type: ['application/json', 'text/plain']
});


/* ======================================================
   HELPER: Backend-authoritative pricing calculation
====================================================== */
async function calculateFinalPrice(cart, countryId, selectedPromotionId) {
    
    let subtotal = 0;

    for (const item of cart) {
        subtotal += item.price * item.quantity;
    }
 
    const promotions = await promotionModel.getEligiblePromotions({
        countryId,
        cart,
        subtotal
    });
  
   
    const promotionsWithSavings = promotions.map(p => ({
        ...p,
        savings: promotionModel.calculateDiscount(p, subtotal)
    }));
  
    let appliedPromotion = null;
    let discountAmount = 0;

  
    if (promotionsWithSavings.length === 1) {
        appliedPromotion = promotionsWithSavings[0];
    }

  
    else if (promotionsWithSavings.length > 1) {
        if (selectedPromotionId) {
            appliedPromotion = promotionsWithSavings.find(
                p => Number(p.ID) === Number(selectedPromotionId)
            );
        }

        // profit protection fallback
        if (!appliedPromotion) {
            appliedPromotion = promotionsWithSavings.reduce((min, p) =>
                p.savings < min.savings ? p : min
            );
        }
    }

    if (appliedPromotion) {
        discountAmount = appliedPromotion.savings;
    }

    return {
        subtotal,
        discountAmount,
        finalAmount: Math.max(subtotal - discountAmount, 0),
        appliedPromotionId: appliedPromotion ? appliedPromotion.ID : null,
        promotions: promotionsWithSavings   
    };
}

app.get('/api/getSalesHistory', middleware.checkToken, (req, res) => {
    salesRecord.getSalesHistoryByMember(req.user.id)
        .then(rows => res.send(rows))
        .catch(() => res.status(500).send("Failed to load sales history"));
});

app.post('/api/calculateCartPrice',
  [middleware.checkToken, jsonParser],
  async function (req, res) {
    try {
       
        const { shoppingCart, countryId, selectedPromotionId } = req.body;

       

        const pricing = await calculateFinalPrice(
            shoppingCart,
            countryId,
            selectedPromotionId   
        );

       

        res.send({
            success: true,
            subtotal: pricing.subtotal,
            discountAmount: pricing.discountAmount,
            finalAmount: pricing.finalAmount,
            appliedPromotionId: pricing.appliedPromotionId,
            promotions: pricing.promotions
        });

    } catch (err) {
        
        res.status(500).send({ success: false });
    }
});



/* ======================================================
   STRIPE CUSTOMER RETRIEVAL (UNCHANGED)
====================================================== */
app.get('/api/getStripeCustomer', middleware.checkToken, function (req, res) {
    var email = req.query.email;
    member.getMember(email)
        .then((result) => {
            if (!result.stripeCustomerId) {
                res.send({ success: false });
            } else {
                stripe.customers.retrieve(result.stripeCustomerId,
                    function (err, customer) {
                        if (!err) res.send({ success: true, customer });
                        else res.status(500).send("Failed to get stripe customer id");
                    }
                );
            }
        })
        .catch(() => res.status(500).send("Failed to get member"));
});

/* ======================================================
   PAYMENT — NEW CARD (UPDATED)
====================================================== */
app.post('/api/processPaymentNewCard', [middleware.checkToken, jsonParser], async function (req, res) {
 
    try {
       
        const pricing = await calculateFinalPrice(
            req.body.shoppingCart,
            req.body.countryId,
            req.body.selectedPromotionId
        );

        await stripe.charges.create({
            amount: pricing.finalAmount * 100,
            currency: "sgd",
            description: "Island Furniture Purchase",
            source: req.body.token.id
        });

       const data = {
                memberId: req.body.memberId,
                email: req.body.email,

                subtotal: pricing.subtotal,
                price: pricing.finalAmount,

                promotionId: pricing.appliedPromotionId,
                promotionDiscount: pricing.discountAmount,

                shoppingCart: req.body.shoppingCart,

                
                name: req.body.name,
                phone: req.body.phone,
                address: req.body.address,
                postalCode: req.body.postalCode
};



        insertDbRecords(data, res);
    } catch (err) {
        console.error(" Payment error:", err);

    res.status(500).send({
        success: false,
        errMsg: err.message || "Payment failed",
        raw: err
    });
    }
});

/* ======================================================
   PAYMENT — EXISTING CARD (UPDATED)
====================================================== */
app.post('/api/processPaymentExistingCard', [middleware.checkToken, jsonParser], async function (req, res) {
    try {
        const pricing = await calculateFinalPrice(
            req.body.shoppingCart,
            req.body.countryId,
            req.body.selectedPromotionId
        );

        await stripe.charges.create({
            amount: pricing.finalAmount * 100,
            currency: "sgd",
            description: "Island Furniture Purchase",
            customer: req.body.customerId,
            source: req.body.cardId
        });

        const data = {
            memberId: req.body.memberId,
            email: req.body.email,

            subtotal: pricing.subtotal,
            price: pricing.finalAmount,

            promotionId: pricing.appliedPromotionId,
            promotionDiscount: pricing.discountAmount,

            shoppingCart: req.body.shoppingCart,

            // delivery info
            name: req.body.name,
            phone: req.body.phone,
            address: req.body.address,
            postalCode: req.body.postalCode
            };


        insertDbRecords(data, res);
    } catch (err) {
        console.error(err);
        res.status(500).send({ success: false, errMsg: "Payment failed" });
    }
});

/* ======================================================
   REMAINING ROUTES (UNCHANGED)
====================================================== */
app.post('/api/insertLineItemRecord', [middleware.checkToken, jsonParser], function (req, res) {
    lineItem.insertLineItemRecord(req.body.quantity, req.body.id)
        .then(result => res.send({ success: true, lineItemId: result.generatedId }))
        .catch(() => res.status(500).send("Failed to insert line item record"));
});

app.post('/api/insertSalesRecordLineItemRecord', [middleware.checkToken, jsonParser], function (req, res) {
    salesRecord_lineItem.insertSalesRecordLineItemRecord(
        req.body.salesRecordId,
        req.body.lineItemId
    ).then(result => res.send(result.success))
     .catch(() => res.status(500).send("Failed to insert sales record line item"));
});

app.post('/api/addDeliveryDetails/', [middleware.checkToken, jsonParser], function (req, res) {
    deliveryDetails.addDeliveryDetails(req.body)
        .then(result => res.send(result))
        .catch(() => res.status(500).send("Failed to add delivery details"));
});

app.post('/api/deleteCard/', [middleware.checkToken, jsonParser], function (req, res) {
    stripe.customers.deleteCard(req.body.customerId, req.body.cardId,
        (err, confirmation) => {
            if (confirmation.deleted) res.send({ success: true });
            else res.send({ success: false, errMsg: "error deleting card" });
        }
    );
});

module.exports = app;

/* ======================================================
   INSERT SALES RECORD (UNCHANGED INTERFACE)
====================================================== */
function insertDbRecords(data, res) {
    

    const cart = data.shoppingCart;
    const ECOMMERCE_STORE_ID = 10001;
    const conn = db.getConnection();

    conn.connect(async err => {
        if (err) {
            console.error(" DB connection failed:", err);
            return res.status(500).send({ success: false });
        }

        try {
            

            const salesResult = await salesRecord.insertSalesRecord({
                memberId: data.memberId,
                subtotal: data.subtotal,
                price: data.price, 
                promotionId: data.promotionId,
                promotionDiscount: data.promotionDiscount
            });

            const salesRecordId = salesResult.generatedId;
           

            /* =====================================================
                PROCESS CART ITEMS
            ===================================================== */
            for (const item of cart) {
                

                /*  INSERT LINE ITEM */
                const insertLineItemSql = `
                    INSERT INTO lineitementity (ITEM_ID, QUANTITY)
                    VALUES (?, ?)
                `;

                const lineItemResult = await new Promise((resolve, reject) => {
                    conn.query(
                        insertLineItemSql,
                        [item.id, item.quantity],
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        }
                    );
                });

                const lineItemId = lineItemResult.insertId;
                

                /* 2b️⃣ LINK SALE ↔ LINE ITEM */
                const linkSql = `
                    INSERT INTO salesrecordentity_lineitementity
                    (SalesRecordEntity_ID, itemsPurchased_ID)
                    VALUES (?, ?)
                `;

                await new Promise((resolve, reject) => {
                    conn.query(linkSql, [salesRecordId, lineItemId], err => {
                        if (err) return reject(err);
                        resolve();
                    });
                });

               

                /* 2c️⃣ DEDUCT STOCK */
                const stockSql = `
                    UPDATE store_itementity
                    SET SAFESTOCK = SAFESTOCK - ?
                    WHERE ITEM_ID = ?
                    AND STORE_ID = ?
                `;

                const stockResult = await new Promise((resolve, reject) => {
                    conn.query(
                        stockSql,
                        [item.quantity, item.id, ECOMMERCE_STORE_ID],
                        (err, result) => {
                            if (err) return reject(err);
                            resolve(result);
                        }
                    );
                });

            }

          

            const deliverySql = `
                INSERT INTO deliverydetailsentity
                (MEMBER_ID, DELIVERY_ADDRESS, POSTAL_CODE, CONTACT, NAME, SALERECORD_ID)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await new Promise((resolve, reject) => {
                conn.query(
                    deliverySql,
                    [
                        data.memberId,
                        data.address || null,
                        data.postalCode || null, 
                        data.phone || null,
                        data.name || null,
                        salesRecordId
                    ],
                    err => {
                        if (err) return reject(err);
                        resolve();
                    }
                );
            });


            

            conn.end();
            

            res.send({
                success: true,
                salesRecordId
            });

        } catch (err) {
            conn.end();
            console.error(" insertDbRecords FAILED:", err);
            res.status(500).send({ success: false });
        }
    });
}








