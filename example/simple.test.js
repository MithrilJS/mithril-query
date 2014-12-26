// test for simple module: simple.test.js
var test = require('tape').test;
var simple = require('./simple');
var mq = require('mithril-query');

test('simple module', function(t) {
  t.test('controller', function(t) {
    t.equal(typeof simple.controller, 'function', 'should be a function');
    t.end();
  });
  t.test('view', function(t) {
    t.equal(typeof simple.view, 'function', 'should be a function');
    var output = simple.view(simple.controller());
    $output = mq(output);
    t.ok($output.has('span'), 'should create span node');
    t.ok($output.has('div > span'), 'should create span node');
    t.ok($output.has('#fooId'), 'should create fooId node');
    t.ok($output.has('.barClass'), 'should create barClass node');
    t.ok($output.has(':contains(barContent)'), 'should create node with content barContent');
    t.ok($output.contains('barContent'), 'should create node with content barContent');
    t.end();
  });
});
