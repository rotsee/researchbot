const whois = require("node-whois")
const async = require("async")
const dns = require('dns')
const punycode = require('punycode')
const messages = require("./topdomain_messages")
const keys = require("./whois_keys")
const anonymizers = require("./anonymizers")


var splitters = [
  function byColon(data, cb){
  // Split by newline and then by colon
  // This is probably the most common format
    output = {}
    var rows = data.split(/\r?\n/g)
    rows.forEach(function(row){
      var parts = row.split(":")
      if (parts.length > 1){
        key = parts[0].replace(/>/g,"").replace(/\*/g,"").replace(/\./g,"").trim()
        val = parts[1].replace(/</g,"").trim()
        if (key in output) {
          output[key].push(val)
        } else {
          output[key] = [val]
        }
        // Also remove >>> and <<< used by some whois servers
      }
    })
    return cb(null, output)
  },
  function bySpaces(data, cb){
  //a. [Domain Name]                YOMIURI.CO.JP
    output = {}
    var rows = data.split(/\r?\n/g)
    rows.forEach(function(row){
      var parts = row.split(/[\s\t]{2,50}/)
      if (parts.length > 1){
        var key = parts[0].replace(/^\w\.\s/, "").replace(/\*/g,"").replace("]", "").replace("[", "").trim()
        var value = parts[1].replace(":", "").trim()
        if (key in output) {
          output[key].push(value)
        } else {
          output[key] = [value]
        }
      }
    })
    return cb(null, output)
  },
  function byBlock(data, cb){
  //Values in multiple lines, separated by double newline
    output = {}
    var rows = data.split(/\r?\n([\*\s]+)?\r?\n/g)
    rows.forEach(function(row){
      if (row){
        var parts = row.split(/\r?\n/g)
        var key = parts.shift().trim().replace(":","").replace(/\*/g,"").trim()
        for (var i = 0; i < parts.length; i++) {
          parts[i] = parts[i].trim();
        }
        output[key] = [parts.shift()]
      }
    })
    return cb(null, output)
  }
]

const ERR_NO_SUCH_DOMAIN = 1;
const ERR_NO_USEFUL_INFORMATION = 2;

module.exports = function() {

  var api = {}
  var domain = null

  api._dns_lookup = function(callback){
    /* Ugly hack: Check if domain exists, or if www.+domain exists */
    var self = this
    dns.lookup(self.domain, function(err, addresses, family) {
      if (addresses === undefined) {
        dns.lookup("www."+self.domain, function(err, addresses, family) {
          if (addresses === undefined) {
            callback(ERR_NO_SUCH_DOMAIN, null)
          } else {
            callback(null, addresses)
          }
        })
      } else {
        callback(null, addresses)
      }
    })
  }

  api._whois_lookup = function(callback){
    self = this
    whois.lookup(self.domain, function(err, data) {
      if (!data){
        throw ERR_NO_USEFUL_INFORMATION
      }
      async.applyEach(splitters, data, function(err, whoisoutputs){
        whoisdict = {}
        for (var category in keys){
          whoisdict[category] = []
        }
        whoisoutputs.forEach(function (whoisoutput){
          for (var category in keys){
            for (var key in whoisoutput){
              if (keys[category].indexOf(key) > -1 ){
                whoisoutput[key].forEach(function (value){
                  if (whoisdict[category].indexOf(value) == -1){
                    if (value !== ""){
                      whoisdict[category].push(value)
                    }
                  }
                })
              }
            }
          }
        })
        callback(null, {data: whoisdict, raw_data: data}
        )
      })
    })

  }

  api.get = function(string, callback) {
    var self = this

    /* Add top domain specific messages */
    this.domain = string.toString('utf-8').trim().replace(/\w+\:\/\//, "").replace("/", "")
    this.domain = punycode.toASCII(this.domain)
    var topdomain = this.domain.split(".").pop()
    var message = ""
    if (topdomain in messages){
      message = messages[topdomain]
    }
    var output = {data: null,
                  raw_data: null,
                  message: message}

    /* Run checks and callback */
    var fns = [
      self._dns_lookup.bind(self),
      self._whois_lookup.bind(self),
    ]
    async.series(fns, function(err, results){
      if (err === ERR_NO_SUCH_DOMAIN){
        output["message"] = "We could not find that domain, please check your spelling."
        callback(ERR_NO_SUCH_DOMAIN, output)
      } else {
        output["data"] = results[1]["data"]
        output["raw_data"] = results[1]["raw_data"]
        output["ip"] = results[0]
        // Is this an IP4 address?
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(self.domain)) {
        } else {
          output["message"] += "\n\nThe IP address of the server is " + results[0] + ". You might want to do another whois lookup on that, to see who owns the server (often a web hotel)."
        }
        // Does it use an anonymizer
        uses_anonymizer = false
        anonymizers.forEach(function(anonymizer){
          if ((results[1]["data"]["person"].indexOf(anonymizer) > -1) || (results[1]["data"]["organization"].indexOf(anonymizer) > -1)) {
              uses_anonymizer = true
          }
        })
        if (uses_anonymizer){
          output["message"] = "This domain is registered using a anonymizing service. This is allowed in some places, and there is not much else we can do. Try looking for clues on the website."
          callback(ERR_NO_USEFUL_INFORMATION, output)
        } else {
          callback(0, output)
        }
      }
    })
  }

  return api

}
