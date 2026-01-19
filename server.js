var app = require('./controller/app.js');
var db = require('./model/databaseConfig');

var server = app.listen(8081, function () {
  var port = server.address().port;
  console.log('Web App Hosted at http://localhost:%s/B/selectCountry.html', port);

  // ✅ Database connection test
  var conn = db.getConnection();
  conn.connect(function (err) {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
    } else {
      console.log('✅ Database connected successfully');
    }
    conn.end();
  });
});
