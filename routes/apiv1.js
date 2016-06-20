var express = require('express')
var router = express.Router()

router.all('/:query/:string', function (req, res, next) {

  res.set({ 'content-type': 'application/json; charset=utf-8' })

  var query = req.params.query
  var string = req.params.string

  switch (query) {
    case "domain":
      var whois = require('node-whois')
      whois.lookup(string, function(err, data) {
        res.json(data)
      })

      break

  }

  result = {test: "Hello world"}

})

module.exports = router
