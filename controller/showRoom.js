var express = require('express');
var app = express();
let middleware = require('./middleware');
var multer  = require('multer');

var showRoom = require('../model/showRoomModel.js');

app.get('/api/__test_showroom', function (req, res) {
    res.send('showRoom controller loaded');
});

/*GET showroom by name (USED BY DROPDOWN)*/
app.get('/api/getShowRoomByName', function (req, res) {
    var name = req.query.name;
    var countryId = req.query.countryId;

    showRoom.getShowRoomByName(name, countryId)
        .then(result => {
            if (!result) {
                return res.status(404).send("Showroom not found");
            }
            res.send(result);
        })
        .catch(err => {
            console.log(err);
            res.status(500).send("Failed to get showroom by name");
        });
});



/*
GET showroom by id (admin use)
 */
app.get('/api/getShowRoomById', function (req, res) {
    var id = req.query.id;

    showRoom.getShowRoomById(id)
        .then((result) => {
            res.send(result);
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Failed to get showroom by id");
        });
});



module.exports = app;
