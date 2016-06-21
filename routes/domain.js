var whois = require("node-whois")
var async = require("async")
var dns = require('dns')
var messages = require("./topdomain_messages")

var keys = {
  person: [
    "Registrant Name",
    "Admin Name",
    "holder",
    "admin-c",
    "Name",
    "Registrant Internationalized Name",
    "person",
    "personname",
    "First Name",
    "Last Name",
    "名前"
  ],
  organization: [
    "そしきめい",
    "組織名",
    "Organization",
    "descr",
    "Registrant Organization",
    "Admin Organization",
    "Titular / Registrant",
    "Registrant",
    "Registrant Internationalized Organization",
    "Admin",
    "Admin Internationalized Organization",
    "organization",
    "org",
    "company"
  ],
  dateRegistered: [
    "created",
    "Created",
    "Creation Date",
    "Created On",
    "Registered on",
    "Registered",
    "registration",
    "Registration Time",
    "登録年月日",
    "Domain Registration Date",
    "Registered Date",
    "Date Created",
    "Data de registo / Creation Date (dd/mm/yyyy)"
  ],
  contact: [
    "Registrant Phone",
    "Registrant Phone Ext",
    "Registrant Fax",
    "Registrant Fac Ext",
    "Admin Phone",
    "Admin Phone Ext",
    "Admin Fax",
    "Admin Fac Ext",
    "Phone Number",
    "Fax Number",
    "Email Address",
    "phone",
    "Phone",
    "Fax",
    "Email",
    "Admin Voice Number",
    "Admin Fax Number",
    "Admin Email",
    "Registrant Voice Number",
    "Registrant Fax Number",
    "Registrant Email",
    "Registrant Contact Email",
    "e-mail",
    "Registrant Facsimile Number",
    "Administrative Contact Facsimile Number",
    "AC Phone Number",
    "電話番号",
    "FAX番号",

  ]
}

var splitters = [
  function byColon(data, cb){
  // Split by newline and then by colon
  // This is probably the most common format
    output = {}
    var rows = data.split(/\r?\n/g)
    rows.forEach(function(row){
      var parts = row.split(":")
      if (parts.length > 1){
        key = parts[0].replace(/>/g,"").replace(/\./g,"").trim()
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
        output[parts[0].replace(/\w\.\s/, "").replace("]", "").replace("[", "").trim()] = [parts[1].trim()]
      }
    })
    return cb(null, output)    
  },
  function byBlock(data, cb){
  //Values in multiple lines, separated by double newline
    output = {}
    var rows = data.split(/\r?\n(\s+)?\r?\n/g)
    rows.forEach(function(row){
      if (row){
        var parts = row.split("\r\n")
        key = parts.shift().trim().replace(":","")
        for (var i = 0; i < parts.length; i++) {
          parts[i] = parts[i].trim();
        }
        output[key] = [parts.join(", ")]
      }
    })
    return cb(null, output)    
  }
]

const ERR_NO_SUCH_DOMAIN = 1;

module.exports = function() {

  var api = {}
  var domain = null

  api._dns_lookup = function(callback){
    var self = this
    dns.lookup(self.domain, function(err, addresses, family) {
      if (addresses === undefined) {
        callback(ERR_NO_SUCH_DOMAIN, null)
      } else {
        callback(null, addresses)
      }
    })
  }

  api._whois_lookup = function(callback){
    self = this
    whois.lookup(self.domain, function(err, data) {
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
        if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(self.domain)){

        } else {
          output["message"] += "\n\nThe IP address of the server is " + results[0] + ". You might want to do another whois lookup on that, to see who owns the server (often a web hotel)."
        }
        callback(0, output)
      }
    })
  }

  return api

}
