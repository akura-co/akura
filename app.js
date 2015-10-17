var
  _ = require('underscore'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  bodyParser = require('body-parser'),
  vhost = require('vhost'),
  hosts = require('./vhost'),
  api = require('./api'),
  app = express()

// collect aliases
// hosts = hosts.reduce(function (hosts, host) {
//   var alias
//   try {
//     alias = require(host + '/alias')
//   } catch (e) {
//     alias = []
//   }
//   [host].concat(alias).forEach(function (name) {
//     if (!hosts[name]) {
//       hosts[name] = host
//     }
//   })
//   return hosts
// }, {})
process.env.HOME = '/home/ubuntu'
app.
  use(bodyParser.json()).
  use(bodyParser.urlencoded({extended: true})).
  use(api).
  use(function (req, res, next) {
    if (req.hostname == 'akura.co') {
      if (!req.secure)
        return res.redirect('https://' + req.hostname + req.url)
      res.set('Strict-Transport-Security', 'max-age=86400')
    }
    next()
  })//.
  // use('/telegram/quoteBot/hook', require(process.env.HOME + '/quoteBot/app.js')())

// _.each(hosts, function (domain, repo) {
//   if (['akura.co'].indexOf(domain) > -1)
//     return app.use(vhost(domain, express().use(express.static(__dirname + '/' + domain))))
//   return app.use(vhost(domain, require(domain)))
// })
var requireApp = function (host) {
  //support both app and static
  var app
  try {
    app = require(host)
  } catch (e) {
    app = express.static(__dirname + '/node_modules/' + host)
  }
  return app
}
_.each(config.host, function (host) {
  var vhostApp = requireApp(host)
  app.use(vhost(host, vhostApp))
  var alias
  try {alias = require(host + '/alias')} catch (e) {}
  _each(alias, function (alias) {
    app.use(vhost(alias, vhostApp))
  })
})
app.listen(3000)
return;
http.createServer(app).listen(80)
https.createServer({
  key: fs.readFileSync(process.env.HOME + '/.akura.co/ssl/akura.co.key'),
  cert: fs.readFileSync(process.env.HOME + '/.akura.co/ssl/akura.co.crt'),
  ca: [
    fs.readFileSync(process.env.HOME + '/.akura.co/ssl/rapidSsl.crt'),
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
}, app).listen(443)
