var
  _ = require('underscore'),
  request = require('supertest'),
  app = request.agent(require('./'))

describe('test vhost', function () {
  _.each(require('./config').vhost, function (vhost) {
    it('can access ' + vhost, function (done) {
      app.
        get('/').
        set('host', vhost).
        expect(200, done)
    })
  })
  it('cannot access not_found vhost', function (done) {
      app.
        get('/').
        set('host', 'not-found.com').
        expect(404, done)
    })
})
