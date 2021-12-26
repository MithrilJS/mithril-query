# mithril-query

[![Gitter](https://img.shields.io/badge/gitter-join_chat-1dce73.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB4PSIwIiB5PSI1IiBmaWxsPSIjZmZmIiB3aWR0aD0iMSIgaGVpZ2h0PSI1Ii8%2BPHJlY3QgeD0iMiIgeT0iNiIgZmlsbD0iI2ZmZiIgd2lkdGg9IjEiIGhlaWdodD0iNyIvPjxyZWN0IHg9IjQiIHk9IjYiIGZpbGw9IiNmZmYiIHdpZHRoPSIxIiBoZWlnaHQ9IjciLz48cmVjdCB4PSI2IiB5PSI2IiBmaWxsPSIjZmZmIiB3aWR0aD0iMSIgaGVpZ2h0PSI0Ii8%2BPC9zdmc%2B&logoWidth=8)](https://gitter.im/MithrilJS/mithril-query?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![Build Status](https://travis-ci.org/MithrilJS/mithril-query.svg?branch=master)](https://travis-ci.org/MithrilJS/mithril-query)
[![rethink.js](https://img.shields.io/badge/rethink-js-yellow.svg)](https://github.com/rethinkjs/manifest)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

Query mithril virtual dom for testing purposes

## Installation

    npm install mithril-query --save-dev

## Setup

In order to run tests in mithril 2.x we need to do some dom-mocking for the renderer.
`mithril-query` will try to do this mocking for you, if it can't find the required globals, but this
might not work properly due to module loading order. If you load mithril-query before everything else
it should work as expected.

In any other case, this can be done manually by calling the `ensureGlobals` helper upfront (e. G. by adding if into a 'setup' file in your 'mocha' tests).

```js
require('mithril-query').ensureGlobals()
```

## Changes from version 3.x to 4.x

#### Root state access

... is gone, since `mithril` does not provide a way to access it

#### Booleans

... are now rendered as empty strings, like mithril does, because, well, mithril renders

#### Lifecycles

... are now fully supported, including synthetic DOM elements 🎉

#### find/first

... are now returning DOM elements instead of vdom nodes.

#### Custom events

... aren't supported anymore. Feel free to file a ticket, if you want them back.

## Usage

You can run this tests server side or use browserify and run them in browsers.

```js
const m = require('mithril')

module.exports = {
  view: function() {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent'),
    ])
  },
}
```

```js
/* eslint-env mocha */
const mq = require('mithril-query')
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
  })
})
```

Run the test with

    mocha simple.test.js

## API

### Initialise

First call `mithril-query` with either a vnode or a component. You can call it
with one extra argument which will be used as `attrs` in the component case.

```js
var mq = require('mithril-query')

// plain vnode
var out = mq(m('div'))

// object component
var myComponent = {
  view: function({ attrs }) {
    return m('div', attrs.text)
  },
}
var out = mq(myComponent, { text: 'huhu' })

// closure component
function myComponent() {
  return {
    view: function({ attrs }) {
      return m('div', attrs.text)
    },
  }
}
var out = mq(myComponent, { text: 'huhu' })
```

### Query API

As you can see `mq` returns an `out`-Object which has the following test-API.

- `out.first(selector)` – Returns the first element that matches the selector (think `document.querySelector`).
- `out.find(selector)` – Returns all elements that match the selector (think `document.querySelectorAll`).
- `out.has(selector)` –  Returns `true` if any element in tree matches the selector, otherwise `false`.
- `out.contains(string)` – Returns `true` if any element in tree contains the string, otherwise `false`.
- `out.log(selector, [logFN])` – Small helper function to log out what was selected. Mainly for debugging
  purposes. You can give an optional function which is called with the result.
  It defaults to HTML-Pretty-Printer ([pretty-html-log](https://www.npmjs.com/package/pretty-html-log)] that logs the HTML-representation to `stdout`.

You can use these nice assertions. They throw errors if they're not fulfilled.
See the example in the example folder.

- `out.should.have([count], selector)`

Throws if no element is found with selector. If `count` is given, it throws if
count does not match.

- `out.should.not.have(selector)` – Throws if an element is found with selector.
- `out.should.have.at.least(count, selector)` – Throws if there a fewer than `count` elements matching the selector
- `out.should.have([selector0, selector1, selector2])` – Throws there aren't at least one element for each selector.
- `out.should.contain(string)` – Throws if no element contains `string`.
- `out.should.not.contain(string)` - Throws if any element contains `string`.

### Event triggering

It is also possible to trigger element events like `onfocus` and `onclick` and set values on `<input>`-fields. This allows you to write "integration tests" that run also on server side.

Attention: Currently there is no event bubbling supported.

- `out.click(selector, [eventData])` – Runs `onclick` for first element that matches selector. Optional `eventData` is given
  as to the event constructor. `eventData.redraw = false` is respected.
- `out.setValue(selector, string, [eventData])` – Runs `oninput` and `onchange` for first element that matches selector.
- `out.trigger(selector, eventname, [eventData])` – General purpose event triggerer. Calls `eventname` on first matching element.

It also supports key events

- `out.keydown(selector, keycode, [eventData])` – calls `onkeydown` with `keycode`
- `out.keydown(selector, keyname, [eventData])` – calls `onkeydown` with keycode mapped from name. Mapping is done with [this lib](https://github.com/npmcomponent/yields-keycode).

`keyup`, `keypress` are supported as well.

### Auto "Redrawing"

Since `mithril-query` uses `mithril` on a fake DOM, auto rendering works as expected.

Example:

```js
  // module code
  const component = {
    visible: true
    oninit({ state }) {
      state.toggleMe = () => (state.visible = !state.visible)
    },
    view({ state }) {
      return m(
        state.visible ? '.visible' : '.hidden',
        { onclick: state.toggleMe},
        'Test'
      )
    },
  }


  // actual test
  out = mq(component)
  out.should.have('.visible')
  out.click('.visible')
  out.should.not.have('.visible')
  out.should.have('.hidden')
  out.click('.hidden', { redraw: false })
  out.should.have('.hidden')
```

As you can see, you can prevent auto redraw by providing a `redraw: false` as last
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
out.rootEl
```

### `onremove` handling

To trigger `onremove`-handlers of all initialized components, just call `out.onremove()`
