var
  _ = require('underscore'),
  request = require('supertest'),
  app = require('./'),
  server = request.agent(app)

describe('test vhost', function () {
  _.each(require('./config').vhost, function (vhost) {
    it('can access ' + vhost, function (done) {
      server.
        get('/').
        set('host', vhost).
        expect(200, done)
    })
  })
  it('cannot access not_found vhost', function (done) {
      server.
        get('/').
        set('host', 'not-found.com').
        expect(404, done)
    })
})
