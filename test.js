var _ = require('underscore')
var request = require('supertest')
var app = request.agent(require('./'))
var config = require('./config')

describe('test vhost', () => {
  _.each(config.vhost, vhost => {
    it('can access ' + vhost, done => {
      app.
        get('/').
        set('host', vhost).
        expect(200, done)
    })
  })
  it('cannot access not_found vhost', done => {
    app.
      get('/').
      set('host', 'not-found.com').
      expect(404, done)
  })
})
