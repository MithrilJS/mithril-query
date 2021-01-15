'use strict'

const m = require('mithril/render/hyperscript')
const domino = require('domino')
const code = require('yields-keycode')
const Vnode = require('mithril/render/vnode')

const PD = '//'

function isString(thing) {
  return Object.prototype.toString.call(thing) === '[object String]'
}

function isArray(thing) {
  return Object.prototype.toString.call(thing) === '[object Array]'
}

function isComponent(thing) {
  return !!(
    (thing && (typeof thing === 'object' && thing.view)) ||
    isFunction(thing) ||
    isClass(thing)
  )
}

function isFunction(thing) {
  return typeof thing === 'function' && !isClass(thing)
}

function isBabelTranspiledClass(thing) {
  const code = thing.toString().replace(/^[^{]+{/, '')

  return (
    // Regular Babel transpiled class
    /(?:^|\s+)_classCallCheck\(/.test(code) ||
    // Babel with @babel/transform-runtime and Webpack
    /(?:^|\s+)_[^\s]+_classCallCheck__[^\s()]+\(/.test(code) ||
    // Babel with @babel/transform-runtime (useESModules: true) and Webpack
    /(?:^|\s+)Object\(_[^\s]+_classCallCheck__[^\s()]+\)\(/.test(code)
  )
}

function isClass(thing) {
  return (
    typeof thing === 'function' &&
    (/^\s*class\s/.test(thing.toString()) || // ES6 class
      isBabelTranspiledClass(thing)) // Babel class
  )
}

function consoleLogFn(a) {
  const util = require('util')
  // eslint-disable-next-line no-console
  console.log(
    util.inspect(a, {
      colors: true,
      depth: null,
    })
  )
}

function scan(rootEl, api) {
  function find(selectorString, node) {
    return Array.prototype.slice.call(node.querySelectorAll(selectorString))
  }

  function first(selector) {
    const node = rootEl.querySelector(selector)
    if (!node) {
      throw new Error('No element matches ' + selector)
    }
    return node
  }

  function has(selector) {
    return find(selector, rootEl).length > 0
  }

  function contains(value, node) {
    return !!find(':contains(' + value + ')', node).length
  }

  function shouldHaveAtLeast(minCount, selector) {
    const actualCount = find(selector, rootEl).length
    if (actualCount < minCount) {
      throw new Error(
        'Wrong count of elements that matches "' +
          selector +
          '"\n  expected: >=' +
          minCount +
          '\n  actual: ' +
          actualCount
      )
    }
    return true
  }

  function shouldHave(expectedCount, selector) {
    if (!selector) {
      return isArray(expectedCount)
        ? shouldHaveCollection(expectedCount)
        : shouldHaveAtLeast(1, expectedCount)
    }

    const actualCount = find(selector, rootEl).length
    if (actualCount !== expectedCount) {
      throw new Error(
        'Wrong count of elements that matches "' +
          selector +
          '"\n  expected: ' +
          expectedCount +
          '\n  actual: ' +
          actualCount
      )
    }
    return true
  }

  function shouldHaveCollection(selectors) {
    selectors.forEach(function(selector) {
      shouldHaveAtLeast(1, selector)
    })
    return true
  }

  function shouldNotHave(selector) {
    shouldHave(0, selector)
    return true
  }

  function shouldContain(string) {
    if (!contains(string, rootEl)) {
      throw new Error('Expected "' + string + '" not found!')
    }
    return true
  }

  function shouldNotContain(string) {
    if (contains(string, rootEl)) {
      throw new Error('Unexpected "' + string + '" found!')
    }
    return true
  }

  function setValue(selector, string, silent) {
    const el = first(selector)
    const event = {
      currentTarget: { value: string },
      target: { value: string },
    }
    el.oninput && el.oninput(event)
    el.onchange && el.onchange(event)
    el.onkeyup && el.onkeyup(event)
    if (!silent && event.redraw !== false) {
      api.redraw()
    }
  }

  function trigger(eventName) {
    return function(selector, event, silent) {
      event = event || {}
      event.redraw = !silent
      const el = first(selector)
      el[eventName](event)
      if (!silent && event.redraw !== false) {
        api.redraw()
      }
    }
  }

  function triggerKey(eventName) {
    const fire = trigger('on' + eventName)
    return function handleEvent(selector, key, event, silent) {
      const keyCode = isString(key) ? code(key) : key
      const defaultEvent = {
        altKey: false,
        shiftKey: false,
        ctrlKey: false,
        type: eventName,
        keyCode,
        which: keyCode,
      }
      fire(selector, Object.assign({}, defaultEvent, event || {}), !!silent)
    }
  }

  shouldHave.at = {
    least: shouldHaveAtLeast,
  }

  api.first = first
  api.has = has
  api.contains = function(value) {
    return contains(value, rootEl)
  }
  api.find = function(selector) {
    return find(selector, rootEl)
  }
  api.setValue = setValue
  ;[
    'focus',
    'click',
    'blur',
    'mousedown',
    'mouseup',
    'mouseover',
    'mouseout',
    'mouseenter',
    'mouseleave',
  ].map(function(eventName) {
    api[eventName] = trigger('on' + eventName)
  })
  api.contextMenu = trigger('contextmenu')
  api.keydown = triggerKey('keydown')
  api.keypress = triggerKey('keypress')
  api.keyup = triggerKey('keyup')
  api.trigger = function(selector, eventName, event, silent) {
    trigger(eventName)(selector, event, silent)
  }
  api.should = {
    not: {
      have: shouldNotHave,
      contain: shouldNotContain,
    },
    have: shouldHave,
    contain: shouldContain,
  }
  api.log = function(selector, logFn = consoleLogFn) {
    logFn(api.find(selector))
    return api
  }

  return api
}

module.exports = function init(componentOrRootNode, nodeOrAttrs) {
  const $window = domino.createWindow('')
  const redrawService = require('mithril/api/redraw')($window)
  let rootNode = {
    view: () => {
      return isComponent(componentOrRootNode)
        ? m(componentOrRootNode, nodeOrAttrs)
        : componentOrRootNode
    },
  }

  const redraw = () =>
    redrawService.render($window.document.body, Vnode(rootNode))

  redraw()

  const onremove = () => {
    rootNode = { view: () => {} }
    redraw()
  }
  return scan($window.document.body, {
    redraw,
    onremove,
    rootEl: $window.document.body,
  })
}
