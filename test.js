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
var numbah = 10;
var eventEl = m('input#eventEl', {
  onclick: function(evt) { events.onclick(evt); },
  onfocus: function(evt) { events.onfocus(evt); },
  oninput: function(evt) { events.oninput(evt); }
});
var el = m('div', [tagEl, concatClassEl, classEl, innerString, idEl,
                   devilEl, idClassEl, arrayOfArrays, undefined, eventEl, numbah]);

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

test('find', function(t) {
  t.deepEqual(mq(el).find('span'), [tagEl], 'find by tag should work');
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
  t.ok(mq(el).contains(numbah), 'contain should work for numbers');
  t.end();
});

test('should style assertions', function(t) {
  t.doesNotThrow(function() {
    mq(el).should.have('span');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.have('table');
  }, 'should throw when no element matches');

  t.doesNotThrow(function() {
    mq(el).should.have('.one');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.have(3, 'div');
  }, 'should throw with wrong count');

  t.doesNotThrow(function() {
    mq(el).should.have(7, 'div');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.contain('XXXXX');
  }, 'should throw when not containing');

  t.doesNotThrow(function() {
    mq(el).should.not.have('table');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.not.have('span');
  }, 'should throw when any element matches');

  t.doesNotThrow(function() {
    mq(el).should.not.contain('XXXXXX');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.not.contain('DEVIL');
  }, 'should throw when containing');

  t.doesNotThrow(function() {
    mq(el).should.have.at.least(4, 'div');
  }, 'should not when true');

  t.throws(function() {
    mq(el).should.have.at.least(8, 'div');
  }, 'should throw when not enought elements');

  t.end();
});

test('autorerender module', function(t) {
  var module = {
    controller: function() {
      var scope = {
        visible: true,
        toggleMe: function() { scope.visible = !scope.visible; }
      };
      return scope;
    },
    view: function(scope) {
      return m(scope.visible ? '.visible' : '.hidden', {
        onclick: scope.toggleMe
      }, 'Test');
    }
  };

  var $out = mq(module);
  $out.should.have('.visible');
  $out.click('.visible');
  $out.should.have('.hidden');
  $out.click('.hidden', null, true);
  $out.should.have('.hidden');
  t.end();
});

test('autorerender function', function(t) {
  function view(scope) {
    return m(scope.visible ? '.visible' : '.hidden', {
      onclick: function() { scope.visible = !scope.visible; }
    }, 'Test');
  }

  var scope = { visible: true };
  var $out = mq(view, scope);
  $out.should.have('.visible');
  $out.click('.visible');
  $out.should.have('.hidden');
  $out.click('.hidden', null, true);
  $out.should.have('.hidden');
  t.end();
});

test('onunload', function(t) {
  t.test('init with view, scope', function(t) {
    function view() {}
    var scope = {
      onunload: t.end
    };
    var $out = mq(view, scope);
    $out.onunload();
  });
  t.test('init with rendered view', function(t) {
    function view() {
      return 'foo';
    }
    var $out = mq(view());
    t.doesNotThrow($out.onunload);
    t.end();
  });
  t.test('init with module', function(t) {
    var module = {
      view: function() {},
      controller: function() {
        return {
          onunload: t.end
        };
      }
    };
    var $out = mq(module);
    $out.onunload();
  });
});

test('null objects', function(t) {
  t.test('init with null elements', function(t) {
    function view() {
      return [
        null,
        m('input'),
        null
      ];
    }
    var $out = mq(view());
    t.doesNotThrow($out.should.have.bind($out.should.have, 'input'));
    t.end();
  });
});

test('access root element', function(t) {
  t.test('call root() to access root element', function(t) {
    function view() {
      return m('div', ['foo', 'bar']);
    }
    var $out = mq(view);
    t.deepEqual($out.rootEl, view());
    t.end();
  });
});
