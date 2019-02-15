const express = require('express')
const router = express.Router()
const modules = {
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
      // Normalize errors. Falsish values => 0
      if (err){
        result["error"] = err
      } else {
        result["error"] = 0
      }
      result[query] = data
      res.json(result)
    })
  }

})

module.exports = router
