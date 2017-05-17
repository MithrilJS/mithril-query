mithril-query
=============
[![Gitter](https://img.shields.io/badge/gitter-join_chat-1dce73.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSI1IiBmaWxsPSIjZmZmIiB3aWR0aD0iMSIgaGVpZ2h0PSI1Ii8%2BPHJlY3QgeD0iMiIgeT0iNiIgZmlsbD0iI2ZmZiIgd2lkdGg9IjEiIGhlaWdodD0iNyIvPjxyZWN0IHg9IjQiIHk9IjYiIGZpbGw9IiNmZmYiIHdpZHRoPSIxIiBoZWlnaHQ9IjciLz48cmVjdCB4PSI2IiB5PSI2IiBmaWxsPSIjZmZmIiB3aWR0aD0iMSIgaGVpZ2h0PSI0Ii8%2BPC9zdmc%2B&logoWidth=8)](https://gitter.im/MithrilJs/mithril-query?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/MithrilJs/mithril-query.svg)](https://travis-ci.org/MithrilJs/mithril-query)
[![rethink.js](https://img.shields.io/badge/rethink-js-yellow.svg)](https://github.com/rethinkjs/manifest)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Query mithril virtual dom for testing purposes

## Installation

    npm install mithril-query --save-dev

## Setup

In order to run tests in mithril 1.0 we need to do some setup. That is to mock the dom for the mithril render and request modules.
This can be done by requiring a 'setup' file in your 'mocha' tests with the following contents.

```js
global.window = Object.assign(require('mithril/test-utils/domMock.js')(), require('mithril/test-utils/pushStateMock')())
```

## Usage

You can run this tests serverside or use browserify and run them in browsers.

```js
// simple module: simple.js
var m = require('mithril')

module.exports = {
  view: function () {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent')
    ])
  }
}
```

```js
// test for simple module: simple.test.js
/* eslint-env mocha */
global.window = Object.assign(require('mithril/test-utils/domMock.js')(), require('mithril/test-utils/pushStateMock')())
var simpleModule = require('./simple')
var mq = require('mithril-query')

describe('simple module', function () {
  it('should generate appropriate output', function () {
    var output = mq(simpleModule)
    output.should.have('span')
    output.should.have('div > span')
    output.should.have('#fooId')
    output.should.have('.barClass')
    output.should.have(':contains(barContent)')
    output.should.contain('barContent')
  })
})
```

Run the test with

    mocha simple.test.js

## API


### Initialise

First call `mithril-query` with either a vnode or a component. You can call it
with one extra argument wich will be used as `attrs` in the component case.
[Closure Components](https://mithril.js.org/components.html#closure-components)
are currently only supported as part of the tree, not directly as argumend to
`mq` function. Supporting this will result in a breaking change, because it
conflicts with the call with a view function as first argument, what is
deprecated now.


```js
var mq = require('mithril-query')

// plain vnode
var out = mq(m('div'))

// view function - DEPRECATED! don't use.
function myView(text) {
  return m('div', text)
}
var out = mq(myView, 'huhu')

// Use this instead!
var out = mq({
  view: () => myView('huhu')
})

// component
var myComponent = {
  view: function (vnode) {
    return m('div', vnode.attrs.text)
  }
}
var out = mq(myComponent, { text: 'huhu' })
```

### Query API

As you can see `mq` returns an `out`-Object which has the following query-API.
We use [cssauron](https://github.com/chrisdickinson/cssauron) as engine,
so look there if you want to see, what `selector`s are possible.

* `out.first(selector)` – Returns the first element that matches the selector.
* `out.find(selector)` – Returns all elements that match the selector.
* `out.has(selector)` –  Returns `true` if any element in tree matches the selector, otherwise `false`.
* `out.contains(string)` – Returns `true` if any element in tree contains the string, otherwise `false`.
* `out.log(selector, [logFN])` – Small helper function to log out what was selected. Mainly for debugging
purposes. You can give an optional function which is called with the result.
It defaults to `console.log`.

You can use these nice assertions. They throw errors if they're not fullfiled.
See the example in the example folder.

* `out.should.have([count], selector)`

Throws if no element is found with selector. If `count` is given, it throws if
count does not match.

* `out.should.not.have(selector)` – Throws if an element is found with selector.
* `out.should.have.at.least(count, selector)` – Throws if there a fewer than `count` elements matching the selector
* `out.should.have([selector0, selector1, selector2])` – Throws there aren't at least one element for each selector.
* `out.should.contain(string)` – Throws if no element contains `string`.
* `out.should.not.contain(string)` - Throws if any element contains `string`.

### Event triggering

It is also possible to trigger element events like `onfocus` and `onclick` and set values on `<input>`-fields. This allows you to write "integration tests" that run also on serverside.

Attention: Currently there is no event bubbleing supported.

* `out.click(selector, [event], [silent])` – Runs `onclick` for first element that matches selector. Optional `event` is given
as event. Options `silent`-Flag signals that no redraw should happen.
`event.redraw = false` is respected.
* `out.setValue(selector, string, [silent])` – Runs `oninput` and `onchange` for first element that matches selector. Event
contains the value as `event.target.value` and `event.target.currentValue`.
* `out.trigger(selector, eventname, [event], [silent])` – General purpose event triggerer. Calls `eventname` on first matching element giving `event` as event.

It also supports key events

* `out.keydown(selector, keycode, [event])` – calls `onkeydown` with `keycode`
* `out.keydown(selector, keyname, [event])` – calse `onkeydown` with keycode mapped from name. Mapping is done with [this lib](https://github.com/npmcomponent/yields-keycode).

`keyup`, `keypress` are supported as well.

### Auto "Redrawing"

You can also use auto rendering like mithril does. If you call the query
function with a module, it instantiates the module the same way as mithril does.
When using one of the upper events, redraw of the view is automatically called.

Example:

```js
  // module code
  var module = {
    oninit: function (vnode) {
      vnode.state = {
        visible: true,
        toggleMe: function () { vnode.state.visible = !vnode.state.visible }
      }
    },
    view: function (vnode) {
      return m(vnode.state.visible ? '.visible' : '.hidden', {
        onclick: vnode.state.toggleMe
      }, 'Test')
    }
  }

  // actual test
  var out = mq(module)
  out.should.have('.visible')
  out.click('.visible')
  out.should.have('.hidden')
  out.click('.hidden', null, true)
  out.should.have('.hidden')
```

As you can see, you can prevent autoredraw by providing a `true` as last
argument to `click` method.

You can also manually trigger redraw:

```javascript
var out = mq(module)
out.should.have('.visible')
out.redraw()
```

### helpers

If you need to access the rendered root element you can simply access it with

```javascript
out.rootNode
```

If you've rendered a component it might be handy to access the vnode directly.
This can be with `out.vnode`:

```javascript
var myComponent = {
  view: function (vnode) {
    vnode.state.baz = 'foz'
  }
}
var out = mq(myComponent)
expect(out.vnode.state.baz).toEqual('foz')
```

### `onremove` handling

To trigger `onremove`-handlers of all initialised components, just call `out.onremove()`
