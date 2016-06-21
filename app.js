'use strict'

var express = require('express')
var app = express()

app.set('view engine', 'jade')
app.engine('jade', require('pug').__express)
app.set('views', __dirname + '/views')
app.set('baseDir', __dirname)

//app.set('port', (process.env.PORT || 5000))

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*")
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
  next()
})

var apiv1 = require(__dirname + '/routes/apiv1.js')
app.use('/v1', apiv1)

app.get('/', function(req, res) {
  res.render('index')
})
// Errors
app.use(function(req, res, next) {
  res.status(404).send('Sorry, can\'t find that!')
})
/*
app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
})
*/


//Start server
var server = app.listen(process.env.PORT || 5000, function() {

  var host = server.address().address
  var port = server.address().port

  console.log('Website info API listening at http://%s:%s', host, port)

})