var
  express = require('express'),
  bodyParser = require('body-parser'),
  session = require('express-session'),
  bcrypt = require('bcrypt'),
  db3 = require('db3'),
  dbConfig = {host: 'localhost', user: 'root', password: '', database : 'akura', table: 'user'},
  db = db3.connect(dbConfig)
  config = require('./config'),
  vhost = require('./vhost'),
  app = module.exports = express()

app.
  use(bodyParser.json()).
  use(bodyParser.urlencoded({extended: true})).
  use(session({secret: 'secret', resave: true, saveUninitialized: true})).
  set('port', process.env.PORT || 3000).
  all('/action', function (req, res) {
    return res.json(config)
  }).
  post('/login', function (req, res) {
    var credentials = {
        username: req.body.username,
        password: req.body.password,
      }
    db.select(dbConfig.table, {username: credentials.username}, ['password', 'accessToken'], function (err, data) {
      if (err) {
        console.error(err);
        return res.json({error: err.message})
      }
      if (!data.length) {
        return res.json({error: 'Username or password is not recognized.'})
      }
      bcrypt.compare(credentials.password, data[0].password, function (err, passed) {
        if (err) {
          console.error(err);
          return res.json({error: err.message})
        }
        if (!passed) {
          return res.json({error: 'Username or password is not recognized.'})
        }
        req.session.regenerate(function () {
          req.session.user = credentials.username
          req.session.authorized = true
          req.session.accessToken = data[0].accessToken
          var output = {error: false, message: 'Logging in successfully.', token: data[0].accessToken}
          res.json(output)
        })
      })
    })

  }).
  get('/vhost', function (req, res) {
    return res.json(vhost)
  }).
  get('/home', function (req, res) {
    var output
    if (req.session.user) {
      output = {message: 'hello, ' + req.session.user, token: req.session.accessToken}
    } else {
      output = {message: 'hello, guest'}
    }
    res.json(output)
  })
// app.listen(3000)
