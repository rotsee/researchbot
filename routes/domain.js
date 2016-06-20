module.exports = function() {

  var api = {}

  api.get = function(string, callback) {
    var whois = require('node-whois')
    whois.lookup(string, function(err, data) {
      callback(null, data)
    })
  }

  return api

}
