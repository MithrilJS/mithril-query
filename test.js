'use strict';

var test = require('tape').test;
var m = require('mithril');
var mq = require('./');

function noop() {}

var events = {
  onclick: noop,
  onfocus: noop
};

var tagEl = m('span');
var concatClassEl = m('.onetwo');
var classEl = m('.one.two');
var idEl = m('#two');
var innerString = 'Inner String';
var devilEl = m('.three', 'DEVIL');
var idClassEl = m('#three.three');
var arrayOfArrays = [[m('#arrayArray')]];
var eventEl = m('input#eventEl', {
  onclick: function(evt) { events.onclick(evt); },
  onfocus: function(evt) { events.onfocus(evt); },
  oninput: function(evt) { events.oninput(evt); }
});
var el = m('div', [tagEl, concatClassEl, classEl, innerString, idEl,
                   devilEl, idClassEl, arrayOfArrays, undefined, eventEl]);

test('first', function(t) {
  t.equal(mq(el).first('span'), tagEl, 'select by tag should work');
  t.equal(mq(el).first('.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('div > .one'), classEl, 'select by child selector should work');
  t.equal(mq(el).first('.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('.two.one'), classEl, 'select by class should work');
  t.equal(mq(el).first('#two'), idEl, 'select by id should work');
  t.equal(mq(el).first('div#two'), idEl, 'select by tag/id should work');
  t.equal(mq(el).first('.three#three'), idClassEl, 'select by .class#id should work');
  t.equal(mq(el).first(':contains(DEVIL)'), 'DEVIL', 'select by :content should work');
  t.equal(mq(el).first(':contains(Inner String)'), innerString,
                       'select by :content should work');
  t.equal(mq(el).first('#arrayArray'), arrayOfArrays[0][0],
                       'select of array in array defined el should work');
  t.end();
});

test('events', function(t) {
  t.plan(3);
  events.onclick = function() {
    t.ok(true, 'clickevent should be fired');
  };
  mq(el).click('#eventEl');
  events.onfocus = function() {
    t.ok(true, 'focusevent should be fired');
  };
  mq(el).focus('#eventEl');
  events.oninput = function(evt) {
    t.equal(evt.currentTarget.value, 'huhu', 'value should be set');
  };
  mq(el).setValue('#eventEl', 'huhu');
});

test('contains', function(t) {
  t.ok(mq(el).contains('DEVIL'), 'contain should work');
  t.ok(mq(el).contains('Inner String'), 'contain should work');
  t.end();
});

test('should style assertions', function(t) {
  mq(el).should.have('span');

  t.throws(function() {
    mq(el).should.have('table');
  }, 'should throw when no element matches');

  mq(el).should.have('.one');

  t.throws(function() {
    mq(el).should.have(3, 'div');
  }, 'should throw with wrong count');

  mq(el).should.have(7, 'div');

  t.throws(function() {
    mq(el).should.contain('XXXXX');
  }, 'should throw when not containing');

  mq(el).should.not.have('table');

  t.throws(function() {
    mq(el).should.not.have('span');
  }, 'should throw when any element matches');

  mq(el).should.not.contain('XXXXXX');

  t.throws(function() {
    mq(el).should.not.contain('DEVIL');
  }, 'should throw when containing');

  t.end();
});
