var _ = require('underscore')
var express = require('express')
var morgan = require('morgan')
var hsts = require('hsts')
var fs = require('fs')
var http = require('http')
var spdy = require('spdy')
var tls = require('tls')
var hostname = require('os').hostname()
var config = require('./config')
var vhost = {}

_.each(config.vhost, host => {
  var path = __dirname + '/../' + host
  var static
  console.log('http://' + host)
  try {
    fs.accessSync(path + '/index.js')
  }
  catch (e) {
    static = true
  }
  if (static)
    vhost[host] = express.static(path, {maxAge: '1 day'})
  else {
    try {
      vhost[host] = require(path)
    }
    catch (e) {
      console.log(e)
    }
  }
  try {
    _.each(require(path + '/alias'), alias => {
      console.log('http://' + alias)
      vhost[alias] = vhost[host]
    })
  }
  catch (e) {}
})

var letsencrypt = '/etc/letsencrypt/live'
var secureContext = {}
_.each(_.keys(vhost), domain => {
  var key
  var cert
  var ca
  try {
    key = fs.readFileSync(letsencrypt + '/' + domain + '/privkey.pem')
    cert = fs.readFileSync(letsencrypt + '/' + domain + '/cert.pem')
    ca = [fs.readFileSync(letsencrypt + '/' + domain + '/chain.pem')]
  }
  catch (e) {
    return
  }
  console.log('https://' + domain)
  secureContext[domain] = {
    key: key,
    cert: cert,
    ca: ca
  }
  /*
  secureContext[domain].ciphers = [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'DHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-SHA256',
    'DHE-RSA-AES128-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'DHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES256-SHA256',
    'DHE-RSA-AES256-SHA256'
  ].join(':')
  secureContext[domain].honorCipherOrder = true
  */
})

var app = express().
  use(morgan(':date[iso] :req[x-forwarded-for] :method :url :status :response-time')).
  use(hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  })).
  use((req, res, next) => {
    if (vhost[req.hostname])
      return vhost[req.hostname](req, res, next)
    next()
  })

//exit once a day because of the SSL cert
setTimeout(() => process.exit(), 86400000)

http.createServer(app).listen(80)
if (secureContext[hostname]) {
  secureContext[hostname].SNICallback = (domain, done) => {
    domain = domain.split('.').slice(-2).join('.') //second level domain w/o subdomains
    if (!secureContext[domain])
      return done(true)
    done(null, tls.createSecureContext(secureContext[domain]))  
  }
  spdy.createServer(secureContext[hostname], app).listen(443)
}
