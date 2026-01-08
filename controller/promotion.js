var express = require('express');
var router = express.Router();

const promotionModel = require('../model/promotionModel');

router.get('/api/getAllPromotions', function (req, res) {
  const { countryId } = req.query;

  if (!countryId) {
    return res.status(400).json({ error: 'countryId is required' });
  }

  promotionModel.getAllActivePromotions(countryId)
    .then((result) => {
      if (!result || result.length === 0) {
        return res.status(404).send('No promotions found');
      }
      res.json(result);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Failed to retrieve promotions');
    });
});

router.get('/api/getBestPromotion', function (req, res) {
  const { countryId } = req.query;

  if (!countryId) {
    return res.status(400).json({ error: 'countryId is required' });
  }

  promotionModel.getBestPromotionByCountry(countryId)
    .then((promo) => {
      if (!promo) {
        return res.status(404).send('No promotion found');
      }
      res.json(promo);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Failed to retrieve best promotion');
    });
});


module.exports = router;
