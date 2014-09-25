mithril-query
=============

Query mithril virtual dom for testing purposes

Installation
------------

    npm install mithril --save-dev

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

First call the view result with the mithril query function. THe result has the following methods:

### first(selector)

Returns the first element that matches the selector.

### find(selector)

Returns all elements that match the selector.

### has(selector)

Returns `true` if any element in tree matches the selector, otherwise `false`.

### contains(string)

Returns `true` if any element in tree contains the string, otherwise `false`.

If you need any other assertions, feel free to create an issue or pull request.

Selectors
---------

We use [cssauron](https://github.com/chrisdickinson/cssauron) as engine, so look there if you want to see, what's possible.
