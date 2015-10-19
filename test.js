var
  app = require('./app'),
  request = require('supertest'),
  server = request.agent(app)

describe('test vhost', function () {
  process.env.NODE_ENV = 'development'
  it('can access akura.co', function (done) {
    server.
      get('/akura.co/').
      expect(200, done)
  })
  it('can access afanasy.com', function (done) {
    server.
      get('/afanasy.com/').
      expect(200, done)
  })
  it('can access ysanafa.com', function (done) {
    server.
      get('/ysanafa.com/').
      expect(200, done)
  })
  it('can access fanafan.co', function (done) {
    server.
      get('/fanafan.co/').
      expect(200, done)
  })
  it('can access fanafan.us', function (done) {
    server.
      get('/fanafan.us/').
      expect(200, done)
  })
  it('can access stebeneva.ru', function (done) {
    server.
      get('/stebeneva.ru/').
      expect(200, done)
  })
})
