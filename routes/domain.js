var whois = require("node-whois")
var async = require("async")
var keys = {
  person: [
    "Registrant Name",
    "Admin Name",
    "holder",
    "admin-c"
  ],
  organization: [
    "そしきめい",
    "組織名",
    "Organization",
    "Registrant Organization",
    "Admin Organization",
    "Titular / Registrant"
  ],
  dateRegistered: [
    "created"
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
  },
  function byBlock(data, cb){
  //Values in multiple lines, separated by souble newline
    output = {}
    var rows = data.split(/\r?\n(\s+)?\r?\n/g)
    rows.forEach(function(row){
      var parts = row.split("\r\n")
      key = parts.shift().trim().replace(":","")
      for (var i = 0; i < parts.length; i++) {
        parts[i] = parts[i].trim();
      }
      output[key] = parts.join(", ")
    })
    return cb(null, output)    
  }
]

module.exports = function() {

  var api = {}

  api.get = function(string, callback) {
    whois.lookup(string, function(err, data) {
      async.applyEach(splitters, data, function(err, whoisoutputs){
        whoisdict = {}
        for (var category in keys){
          whoisdict[category] = []
        }
        whoisoutputs.forEach(function (whoisoutput){
          console.log(data)
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
