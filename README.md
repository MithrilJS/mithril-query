mithril-query
=============
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/StephanHoyer/mithril-query?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/StephanHoyer/mithril-query.svg)](https://travis-ci.org/StephanHoyer/mithril-query)

Query mithril virtual dom for testing purposes

Installation
------------

    npm install mithril-query --save-dev

Usage
-----

You can run this tests serverside or use browserify and run them in browsers.

```javascript
// simple module: simple.js
var m = require('Mithril');

module.exports = {
  controller: function() {},
  view: function(ctrl) {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent')
    ]);
  }
};
```

```javascript
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
    t.ok($output.has('div > span'), 'child selectors \o/');
    t.ok($output.has('#fooId'), 'should create fooId node');
    t.ok($output.has('.barClass'), 'should create barClass node');
    t.ok($output.has(':contains(barContent)'), 'should create node with content barContent');
    t.ok($output.contains('barContent'), 'should create node with content barContent');
    t.end();
  });
});
```

Run the test with

    tape simple.test.js

API
---

First call the view result with the `mithril-query` function. Then the result has the following methods:

### first(selector)

Returns the first element that matches the selector.

### find(selector)

Returns all elements that match the selector.

### has(selector)

Returns `true` if any element in tree matches the selector, otherwise `false`.

### contains(string)

Returns `true` if any element in tree contains the string, otherwise `false`.

If you need any other assertions, feel free to create an issue or pull request.

Event triggering
----------------

It is also possible to trigger element events like `onfocus` and `onclick` and set values on `<input>`-fields. This allows you to write "integration tests" that run also on serverside.

```javascript
var el = [
  m('input', {oninput: m.withAttr("value", name), value: name()})
  m('#eventEl', {
    onclick: onClickOfEventEl,
    onfocus: onFocusOfEventEl,
  })

mq(el).click('#eventEl'); // triggers onClickOfEventEl
mq(el).focus('#eventEl'); // triggers onFocusOfEventEl
mq(el).setValue('input', 'huhu') //sets name prop to 'huhu'
```

Selectors
---------

We use [cssauron](https://github.com/chrisdickinson/cssauron) as engine, so look there if you want to see, what's possible.
