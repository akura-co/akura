var _ = require('underscore')
var fs = require('fs')
var http = require('http')
var https = require('https')
var express = require('express')
var morgan = require('morgan')
var path = require('path')
var config = require('./config')

console.log(config)

var vhost = {}
_.each(config.vhost, host => {
  var path = __dirname + '/../' + host
  try {
    vhost[host] = require(path)
  }
  catch (e) {
    vhost[host] = express.static(path)
  }
  try {
    _.each(require(path + '/alias'), alias =>
      vhost[alias] = vhost[host]
    )
  }
  catch (e) {}
})

var app = express().
  use(morgan(':date[iso] :req[x-forwarded-for] :method :url :status :response-time')).
  use((req, res, next) => {
    if (vhost[req.hostname])
      return vhost[req.hostname](req, res, next)
    next()
  })

var ssl = {}
_.each(['key', 'cert', 'ca'], key => {
  try {
    if (_.isString(config.ssl[key]))
      ssl[key] = fs.readFileSync(config.ssl[key])
    if (_.isArray(config.ssl[key]))
      ssl[key] = _.map(config.ssl[key], path => fs.readFileSync(path))
  }
  catch (e) {
    //console.log(e)
  }
})
if (config.ssl.ciphers)
  ssl.ciphers = config.ssl.ciphers.join(':')

//exit once a day because of the SSL cert
setTimeout(() => process.exit(), 86400000)

http.createServer(app).listen(80)
if (ssl.key)
  https.createServer(_.extend({}, config.ssl, ssl), app).listen(443)
