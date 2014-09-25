var test = require('tape').test;
var m = require('mithril');
var mq = require('./');

var tagEl = m('span');
var concatClassEl = m('.onetwo');
var classEl = m('.one.two');
var idEl = m('#two');
var innerString = 'Inner String';
var devilEl = m('.three', 'DEVIL');
var idClassEl = m('#three.three');
var el = m('div', [tagEl, concatClassEl, classEl, innerString, idEl, devilEl, idClassEl]);

test('first', function(t) {
  t.equal(mq(el).first('span'), tagEl, 'select by tag should work');
  t.equal(mq(el).first('.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('.two.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('#two'), idEl, 'select by id should work');
  t.equal(mq(el).first('div#two'), idEl, 'select by tag/id should work');
  t.equal(mq(el).first('.three#three'), idClassEl, 'select by .class#id should work');
  t.equal(mq(el).first(':contains(DEVIL)'), devilEl, 'select by :content should work');
  t.equal(mq(el).first(':contains(Inner String)'), innerString, 'select by :content should work');
  t.end();
});

test('contains', function(t) {
  t.ok(mq(el).contains('DEVIL'), 'contain should work');
  t.ok(mq(el).contains('Inner String'), 'contain should work');
  t.end();
});
