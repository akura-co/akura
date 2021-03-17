var _ = require('underscore')
var fs = require('fs')
var http = require('http')
var https = require('https')
var express = require('express')
var morgan = require('morgan')
var vhost = require('vhost')
var path = require('path')
var config = require('./config')
var app = module.exports = express()
var home

app.use(morgan('dev'))

try {
  home = __dirname.match(/^\/home\/[^\/]+/)[0]
} catch (e) {
  home = '/home/ubuntu'
}

console.log(config)

function requireApp (host) {
  var app
  try {
    app = require(home + '/' + host)
  } catch (e) {
    app = express.static(home + '/' + host)
  }
  return app
}

_.each(config.vhost, host => {
  var vhostApp = requireApp(host)
  var alias
  app.use(vhost(host, vhostApp))
  try {alias = require(home + '/' + host + '/alias')} catch (e) {}
  _.each(alias, alias => {
    app.use(vhost(alias, vhostApp))
  })
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
