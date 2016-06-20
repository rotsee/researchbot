var whois = require("node-whois")
var async = require("async")
var keys = {
  person: [
    "Registrant Name",
    "Admin Name",

  ],
  organization: [
    "そしきめい",
    "組織名",
    "Organization",
    "Registrant Organization",
    "Admin Organization"
  ]
}

var splitters = [
  function byColon(data, cb){
  // Split by newline and then by colon
  // This is probably the most common format
    output = {}
    var rows = data.split("\r\n")
    rows.forEach(function(row){
      var parts = row.split(":")
      if (parts.length > 1){
        output[parts[0].replace(/>/g,"").trim()] = parts[1].replace(/</g,"").trim()
        // Also remove >>> and <<< used by some whois servers
      }
    })
    return cb(null, output)
  },
  function bySpaces(data, cb){
  //a. [Domain Name]                YOMIURI.CO.JP
    output = {}
    var rows = data.split("\r\n")
    rows.forEach(function(row){
      var parts = row.split(/[\s\t]{2,50}/)
      if (parts.length > 1){
        output[parts[0].replace(/\w\.\s/, "").replace("]", "").replace("[", "").trim()] = parts[1].trim()
      }
    })
    return cb(null, output)    
  }
]

module.exports = function() {

  var api = {}

  api.get = function(string, callback) {
    whois.lookup(string, function(err, data) {
      async.applyEach(splitters, data, function(err, whoisoutputs){
        whoisdict = {
          person: [],
          organization: []
        }
        whoisoutputs.forEach(function (whoisoutput){
          for (var category in keys){
            for (var key in whoisoutput){
              if (keys[category].indexOf(key) > -1 ){
                if (whoisdict[category].indexOf(whoisoutput[key]) == -1){
                  whoisdict[category].push(whoisoutput[key])
                }
              }
            }
          }
        })
        callback(null,
          {whois: whoisdict}
        )
      })
    })
  }

  return api

}
