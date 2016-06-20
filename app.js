var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  res.header("Cache-Control", "public,max-age=604800") //one week
  next()
})

var apiv1 = require(__dirname + '/routes/apiv1.js')
app.use('/v1', apiv1)

// Errors
app.use(function(req, res, next) {
  res.status(404).send('Sorry, can\'t find that!')
})

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});