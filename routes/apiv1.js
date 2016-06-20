var express = require('express')
var router = express.Router()

router.all('/:query/:string', function (req, res, next) {

  res.set({ 'content-type': 'application/json; charset=utf-8' })

  var query = req.params.query
  var string = req.params.string

  res.json({test: 2})

})

module.exports = router