var whois = require('node-whois')
module.exports = function() {

  var api = {}

  api.get = function(string, callback) {
    whois.lookup(string, function(err, data) {
      output = {}
      var rows = data.split("\r\n")
      rows.forEach(function(row){
        var parts = row.split(": ")
        if (parts.length == 2){
          output[parts[0].trim()] = parts[1].trim()
        }
      })
      callback(null, output)
    })
  }

  return api

}
