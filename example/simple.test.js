/* eslint-env mocha */
var simpleModule = require('./simple')
var mq = require('../')

describe('simple module', function() {
  it('should generate appropriate output', function() {
    var output = mq(simpleModule)
    output.should.have('span')
    output.should.have('div > span')
    output.should.have('#fooId')
    output.should.have('.barClass')
    output.should.have(':contains(barContent)')
    output.should.contain('barContent')
  })
})
