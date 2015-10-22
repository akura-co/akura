var
  _ = require('underscore'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  bodyParser = require('body-parser'),
  vhost = require('vhost'),
  path = require('path'),
  config = require('./config'),
  hosts = config.vhost,
  app = module.exports = express(),
  HOME_DIR

try {
  HOME_DIR = __dirname.match(/^\/home\/\S+?\//)[0]
} catch (e) {
  console.log('Cannot find home folder, does this file placed under home folder?', e)
  throw e;
}

try { config = _.extend(require(HOME_DIR + '/.akura.json'), config) } catch (e) {}

app.
  use(bodyParser.json()).
  use(bodyParser.urlencoded({extended: true}))

  // _.each(hosts, function (host) {
  //   var
  //     vhostApp = requireApp(host),
  //     alias
  //   app.use('/' + host, vhostApp)
  //   try {alias = require(host + '/alias')} catch (e) {}
  //   _.each(alias, function (alias) {
  //     app.use('/' + alias, vhostApp)
  //   })
  // })
  // app.get('*', function(req, res, next) {
  //   res.
  //     status(404).
  //     send('Not found')
  // })
  // if (!module.parent) {
  //   app.listen(3000)
  // }

_.each(hosts, function (host) {
  var
    vhostApp = requireApp(host),
    alias
  app.use(vhost(host, vhostApp))
  try {alias = require(host + '/alias')} catch (e) {}
  _.each(alias, function (alias) {
    app.use(vhost(alias, vhostApp))
  })
})
http.createServer(app).listen(80)
if (config.ssl) {
  https.createServer(_.extend(config.ssl, {
    key: fs.readFileSync(HOME_DIR + '/.akura.co/ssl/akura.co.key'),
    cert: fs.readFileSync(HOME_DIR + '/.akura.co/ssl/akura.co.crt'),
    ca: [
      fs.readFileSync(HOME_DIR + '/.akura.co/ssl/rapidSsl.crt'),
    ],
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
