var express = require('express')
var router = express.Router()
var modules = {
  "domain": "/domain.js"
}

router.all('/:query/:string', function (req, res, next) {

  res.set({ 'content-type': 'application/json; charset=utf-8' })

  var query = req.params.query
  var string = req.params.string

  var modulename = null
  if (query in modules){
    modulename = modules[query]
  }

  if (modulename){
    var module = require(__dirname + modulename)()
    module.get(string, function(err, data){
      result = {}
      result["error"] = err
      result[query] = data
      res.json(result)
    })
  }

})

module.exports = router
