/* eslint-env mocha */
const mq = require('../')
mq.ensureGlobals()
const simpleModule = require('./simple')

describe('simple module', function() {
  it('should generate appropriate output', function() {
    var output = mq(simpleModule)
    output.should.have('span')
    output.should.have('div > span')
    output.should.have('#fooId')
    output.should.have('.barClass')
    output.should.have(':contains(barContent)')
    output.should.contain('barContent')
    output.log('div')
  })
})
