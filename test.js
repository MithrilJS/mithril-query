'use strict';

var test = require('tape').test;
var m = require('mithril');
var mq = require('./');
var code = require('yields-keycode');
var DOM = require('simple-dom');

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
  t.ok(mq(el).first('span'), 'select by tag should work');
  t.ok(mq(el).first('.one'), 'select by class should work');
  t.ok(mq(el).first('div > .one'), 'select by child selector should work');
  t.ok(mq(el).first('.one'), 'select by class should work');
  t.ok(mq(el).first('.two.one'), 'select by class should work');
  t.ok(mq(el).first('#two'), 'select by id should work');
  t.ok(mq(el).first('div#two'), 'select by tag/id should work');
  t.ok(mq(el).first('.three#three'), 'select by .class#id should work');
  t.ok(mq(el).first(':contains(DEVIL)'), 'select by :content should work');
  t.ok(mq(el).first(':contains(Inner String)'), 'select by :content should work');
  t.ok(mq(el).first('#arrayArray'), 'select of array in array defined el should work');
  t.end();
});

test('find', function(t) {
  t.ok(mq(el).find('span'), 'find by tag should work');
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
  }, 'should throw not when true');

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

test('trigger keyboard events', function(t) {
  var module = {
    controller: function() {
      var scope = {
        visible: true,
        update: function(event) {
          if (event.keyCode == 123) scope.visible = false;
          if (event.keyCode == code('esc')) scope.visible = true;
        }
      };
      return scope;
    },
    view: function(scope) {
      return m(scope.visible ? '.visible' : '.hidden', {
        onkeydown: scope.update
      }, 'Test');
    }
  };
  var $out = mq(module);
  $out.keydown('div', 'esc');
  $out.should.have('.visible');
  $out.keydown('div', 123);
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
      return m('div', [
        null,
        m('input'),
        null
      ]);
    }
    var $out = mq(view());
    t.doesNotThrow(function() {
      $out.should.have('input');
    });
    t.end();
  });
});

test('access root element', function(t) {
  t.test('call root() to access root element', function(t) {
    function view() {
      return m('div', ['foo', 'bar']);
    }
    var $out = mq(view);
    t.deepEqual($out.rootEl, {
      attrs: {},
      children: [ 'foo', 'bar' ],
      tag: 'div'
    }, 'should be accessible');
    t.end();
  });
});

test('components', function(t) {
  var $out, events = {};
  var myComponent = {
    controller: function(data) {
      return {
        foo: data || 'bar',
        onunload: events.onunload,
        firstRender: true
      };
    },
    view: function(scope, data) {
      var tag = 'aside';
      if (scope.firstRender) {
        tag += '.firstRender';
        scope.firstRender = false;
      }
      return m(tag, [
        data,
        'hello',
        scope.foo
      ]);
    }
  };

  t.test('basic usage', function(t) {
    $out = mq(m('div', myComponent));
    $out.should.have('aside');
    $out.should.contain('bar');
    t.end();
  });

  t.test('use with m.component', function(t) {
    $out = mq(m('div', m.component(myComponent, 'huhu')));
    $out.should.have('aside');
    $out.should.contain('huhu');
    t.end();
  });

  t.test('test plain component with init args', function(t) {
    $out = mq(myComponent, 'huhu');
    $out.should.have('aside');
    $out.should.contain('huhu');
    t.end();
  });

  t.test('test onunload', function(t) {
    events.onunload = function() { t.end(); };
    $out = mq(m('div', m.component(myComponent, 'huhu')));
    $out.should.have('aside');
    $out.onunload();
  });

  t.test('state', function(t) {
    events.onunload = noop;
    $out = mq(m('div', m.component(myComponent, 'huhu')));
    $out.should.have('aside.firstRender');
    $out.redraw();
    $out.should.not.have('aside.firstRender');
    t.end();
  });

  t.test('state with multiple of same elements', function(t) {
    events.onunload = noop;
    $out = mq(m('div', [
      myComponent,
      myComponent
    ]));
    $out.should.have(2, 'aside.firstRender');
    $out.redraw();
    $out.should.not.have('aside.firstRender');
    t.end();
  });

  t.test('test onunload component only', function(t) {
    events.onunload = function() { t.end(); };
    $out = mq(myComponent, 'huhu');
    $out.should.have('aside');
    $out.onunload();
  });
});

test('dom to vdom', function(t) {
  var testEl = m('span.foo', {
    className: 'bar',
    'data-foo': '123',
    onclick: function() {t.end();}
  }, ['hahha', m('span')]);
  var root= new DOM.Node('div', 'div');
  m.render(root, testEl);
  var generatedVdom = mq.toVdomEl(root.firstChild);
  t.deepEqual(testEl.attrs.className, generatedVdom.attrs.className);
  t.deepEqual(testEl.attrs['data-foo'], generatedVdom.attrs['data-foo']);
  t.deepEqual(testEl.tag, generatedVdom.tag);
  t.deepEqual(testEl.tag, generatedVdom.tag);
  generatedVdom.attrs.onclick({});
});
