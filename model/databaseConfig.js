var mysql = require('mysql');
var dbconnect = {
    getConnection: function () {
        var conn = mysql.createConnection({
            host: "localhost",
            user: "root",
            password: "1G9r5a6c1E**",
            database: "islandfurniture-it07"
        });
        return conn;
    }
};
module.exports = dbconnect