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
  HOME_DIR

try {
  HOME_DIR = __dirname.match(/^\/home\/\S+?\//)[0]
} catch (e) {
  console.log('Cannot find home folder, does this file placed under home folder?', e)
  throw e
}

try { config = _.extend(require(HOME_DIR + '/.akura.json'), config) } catch (e) {}

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
if (config.ssl) {
  https.createServer(_.extend(config.ssl, {
    honorCipherOrder: true,
    ciphers: [
      'ECDHE-RSA-AES256-SHA384',
      'DHE-RSA-AES256-SHA384',
      'ECDHE-RSA-AES256-SHA256',
      'DHE-RSA-AES256-SHA256',
      'ECDHE-RSA-AES128-SHA256',
      'DHE-RSA-AES128-SHA256',
      'HIGH',
      '!aNULL',
      '!eNULL',
      '!EXPORT',
      '!DES',
      '!RC4',
      '!MD5',
      '!PSK',
      '!SRP',
      '!CAMELLIA'
    ].join(':')
  }), app).listen(443)
}

function requireApp (host) {
  //support both app and static
  var app
  try {
    app = require(host)
  } catch (e) {
    app = express.static(__dirname + '/node_modules/' + host)
  }
  return app
}
