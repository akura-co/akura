var
  _ = require('underscore'),
  fs = require('fs'),
  http = require('http'),
  https = require('https'),
  express = require('express'),
  bodyParser = require('body-parser'),
  vhost = require('vhost'),
  hosts = require('akura.co/vhost'),
  app = module.exports = express()

process.env.HOME = '/home/ubuntu'
app.
  use(bodyParser.json()).
  use(bodyParser.urlencoded({extended: true}))
if (process.env.NODE_ENV === 'development') {
  app.use(require('errorhandler')())

  _.each(hosts, function (host) {
    var
      vhostApp = requireApp(host),
      alias
    // app.use('/' + host, express.static('node_modules/' + host + '/public/') )
    app.use('/' + host, vhostApp)
    try {alias = require(host + '/alias')} catch (e) {}
    _.each(alias, function (alias) {
      // app.use('/' + alias, express.static('node_modules/' + host + '/public/') )
      app.use('/' + alias, vhostApp)
    })
  })
  app.get('*', function(req, res, next) {
    res.
      status(404).
      send('Not found')
  })
  if (!module.parent) {
    app.listen(3000)
  }

} else {
  app.
    use(function (req, res, next) {
      if (req.hostname == 'akura.co') {
        if (!req.secure)
          return res.redirect('https://' + req.hostname + req.url)
        res.set('Strict-Transport-Security', 'max-age=86400')
      }
      next()
    }).
    use('/telegram/quoteBot/hook', require(process.env.HOME + '/quoteBot/app.js')())

  _.each(hosts, function (host) {
    var
      vhostApp = requireApp(host),
      alias
    app.use(vhost(host, vhostApp))
    try {alias = require(host + '/alias')} catch (e) {}
    _each(alias, function (alias) {
      app.use(vhost(alias, vhostApp))
    })
  })
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
}

function requireApp (host) {
  //support both app and static
  var app
  try {
    app = require(host)
  } catch (e) {
    console.error(host, e.stack);
    app = express.static(__dirname + '/node_modules/' + host)
  }
  return app
}
