var
  _ = require('underscore'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  vhost = require('vhost'),
  path = require('path'),
  config = require('./config'),
  app = module.exports = express(),
  home

try {
  home = __dirname.match(/^\/home\/[^\/]+/)[0]
} catch (e) {
  home = '/home/ubuntu'
}

try {
  config = _.extend(config, require(home + '/.akura.json'))
} catch (e) {}

console.log(config)

function requireApp (host) {
  var app
  try {
    app = require(home + '/' + host)
  } catch (e) {
    app = express.static(__dirname + '/node_modules/' + host)
  }
  return app
}

_.each(config.vhost, function (host) {
  var vhostApp = requireApp(host)
  var alias
  app.use(vhost(host, vhostApp))
  try {alias = require(host + '/alias')} catch (e) {}
  _.each(alias, function (alias) {
    app.use(vhost(alias, vhostApp))
  })
})

http.createServer(app).listen(80)
if (!config.ssl)
  return

var ssl = {}
_.each(['key', 'cert', 'ca'], function (key) {
  if (_.isString(config.ssl[key]))
    ssl[key] = fs.readFileSync(config.ssl[key])
  if (_.isArray(config.ssl[key]))
    ssl[key] = _.map(config.ssl[key], function (path) {return fs.readFileSync(path)})
})
if (config.ssl.ciphers)
  ssl.ciphers = config.ssl.ciphers.join(':')

https.createServer(_.extend(config.ssl, ssl), app).listen(443)
