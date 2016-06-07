mithril-query
=============
[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/StephanHoyer/mithril-query?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/StephanHoyer/mithril-query.svg)](https://travis-ci.org/StephanHoyer/mithril-query)
[![rethink.js](https://img.shields.io/badge/rethink-js-yellow.svg)](https://github.com/rethinkjs/manifest)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Query mithril virtual dom for testing purposes

Installation
------------

    npm install mithril-query --save-dev

Usage
-----

You can run this tests serverside or use browserify and run them in browsers.

```javascript
// simple module: simple.js
var m = require('Mithril')

module.exports = {
  controller: function () {},
  view: function (ctrl) {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent')
    ])
  }
}
```

```javascript
// test for simple module: simple.test.js
var test = require('tape').test
var simple = require('./simple')
var mq = require('mithril-query')

test('simple module', function (t) {
  t.test('controller', function (t) {
    t.equal(typeof simple.controller, 'function', 'should be a function')
    t.end()
  })
  t.test('view', function (t) {
    t.equal(typeof simple.view, 'function', 'should be a function')
    var output = simple.view(simple.controller())
    $output = mq(output)
    t.ok($output.has('span'), 'should create span node')
    t.ok($output.has('div > span'), 'child selectors \o/')
    t.ok($output.has('#fooId'), 'should create fooId node')
    t.ok($output.has('.barClass'), 'should create barClass node')
    t.ok($output.has(':contains(barContent)'), 'should create node with content barContent')
    t.ok($output.contains('barContent'), 'should create node with content barContent')
    t.end()
  })
})
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

### log(string, [logFN])

Small helper function to log out what was selected. Mainly for debugging
purposes. You can give an optional function which is called with the result.
It defaults to `console.log`.

Should style assertions
-----------------------

Now you can use these nice assertions. They throw errors if they're not fullfiled.

```javascript
// test for simple module: simple.test.js
var test = require('tape').test
var simple = require('./simple')
var mq = require('mithril-query')

test('simple module', function (t) {
  t.test('view', function (t) {
    var output = simple.view(simple.controller())
    $output = mq(output)
    $output.should.have('span') //asserts to have at least one span element
    $output.should.have(4,'.even') //asserts to have four elements with class 'even'
    $output.should.have.at.least(4,'li') //asserts to have at least four li-elements
    $output.should.have(['.one', '.two', '.three']) // asserts to have at least one element from each selector
    $output.should.not.have('#main') //asserts to not have an element with id 'main'
    $output.should.contain('hi') //asserts to contain the string 'hi'
    $output.should.not.contain('bye') //asserts to not contain the string 'bye'
    t.end()
  })
})
```

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

mq(el).click('#eventEl') // triggers onClickOfEventEl
mq(el).focus('#eventEl') // triggers onFocusOfEventEl
mq(el).setValue('input', 'huhu') //sets name prop to 'huhu'
```

If you need, you can provide a fake-event as a second argument to the `click`-function.

```javascript
m('#eventEl', {
    onclick: function (event) {
        //event.target.value === 'baz'
    }
})

mq(el).click('#eventEl', { target: { value: 'baz' } }) // triggers onClickOfEventEl
```

This also works for other events like `focus`, `blur`, `mousedown`, `mouseup`, `mouseover`, `mouseout`, `mouseenter`, `mouseleave`.

Auto Rendering
--------------

You can also use auto rendering like mithril does. If you call the query
function with a module, it instantiates the controller and calls the view with
it's result. When using one of the upper events, redraw of the view is
automatically called.

Example:

```javascript
  // module code
  var module = {
    controller: function () {
      var scope = {
        visible: true,
        toggleMe: function () { scope.visible = !scope.visible }
      }
      return scope
    },
    view: function (scope) {
      return m(scope.visible ? '.visible' : '.hidden', {
        onclick: scope.toggleMe
      }, 'Test')
    }
  }

  // actual test
  var $out = mq(module)
  $out.should.have('.visible')
  $out.click('.visible')
  $out.should.have('.hidden')
  $out.click('.hidden', null, true)
  $out.should.have('.hidden')
```

As you can see, you can prevent autoredraw by providing a `true` as last
argument to `click` method. This also works for `blur`, `focus` and `setValue`.

### keyboard events

It also supports key events

```javascript
  $out.keydown('div', 'enter')
  $out.keydown('div', 27)
```
you can either use `keycode` or the keys name. Mapping is done with
[this lib](https://github.com/npmcomponent/yields-keycode). `keyup`, `keypress`
are also supported.

You can also provide additional options

```javascript
  $out.keydown('div', 'enter', {
    altKey: true,
    shiftKey: true,
    ctrlKey: false,
    value: 'foobar',
    silent: true // if silent is set to true, no automatic redraw will happen
  })
```
### manual redraw

You can also manually trigger redraw:

```javascript
var $out = mq(module)
$out.should.have('.visible')
$out.redraw()
```

It's also possible to insert a view and a scope, just in case you don't follow
the standard mithril pattern (controller/view)... like I do sometimes ;)

```javascript
var scope = {
  isVisible: true
}

var $out = mq(view, scope)
$out.should.have('.visible')
$out.click('.visible')
$out.should.have('.hidden')
```

If you need to access the rendered root element you can simply access it with

```javascript
$out.rootNode
```

`onunload`-handling
-------------------

If you use the auto-rendering feature mentioned above you might want to also
call `onunload` to on the controller response after testing. We added a
reference to the controller `onunload` function to the result of the mithril query
function.

```javascript
var module = {
  controller: function () {
    return {
      onunload: function () {
        //clean up stuff
      }
    }
  },
  view: function (scope) {
    // do what ever
  }
}

var $out = mq(module)
$out.onunload() // calls upper defined onunload on the controller result
```

Selectors
---------

We use [cssauron](https://github.com/chrisdickinson/cssauron) as engine, so look there if you want to see, what's possible.
