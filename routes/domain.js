var whois = require("node-whois")
var async = require("async")
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
    "Last Name"
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
    "AC Phone Number"
  ]
}
var messages = {
  "se": ".se domains can only be checked from http://iis.se. If the domain is registered by a private person, call “Stiftelsen för internetinfrastruktur”, and ask for the name. You will have to make sure you get to speak to the right person, though. The people picking the phone normally don't have a clue. Ask for “Dot se registry”. As of 2016, they might require you to fill out a form, and sent in. Scanning and sending via email should do. You can expect to get at least the first and last name of the registrant.",
  "nu": ".nu domains can only be checked from http://iis.se. If the domain is registered by a private person, call “Stiftelsen för internetinfrastruktur”, and ask for the name. You will have to make sure you get to speak to the right person, though. The people picking the phone normally don't have a clue. Ask for “Dot se registry”. As of 2016, they might require you to fill out a form, and sent in. Scanning and sending via email should do. You can expect to get at least the first and last name of the registrant."
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

module.exports = function() {

  var api = {}

  api.get = function(string, callback) {
    var topdomain = string.split(".").pop()
    var message = ""
    if (topdomain in messages){
      message = messages[topdomain]
    }
    whois.lookup(string, function(err, data) {
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
        callback(null,
          {data: whoisdict,
           raw_data: data,
           message: message}
        )
      })
    })
  }

  return api

}
