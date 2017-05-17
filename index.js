'use strict'

var m = require('mithril/render/hyperscript')
var cssauron = require('cssauron')
var code = require('yields-keycode')

var PD = '//'

function copyObj (data) {
  var output = {}
  for (var i in data) output[i] = data[i]
  return output
}

function identity (thing) {
  return thing
}

function isBoolean (thing) {
  return typeof thing === 'boolean'
}

function isString (thing) {
  return Object.prototype.toString.call(thing) === '[object String]'
}

function isNumber (thing) {
  return typeof thing === 'number'
}

function isStringOrNumber (thing) {
  return isString(thing) || isNumber(thing)
}

function getContent (thing) {
  if (!thing) {
    return ''
  }
  if (isString(thing)) {
    return thing
  }
  if (isNumber(thing)) {
    return '' + thing
  }
  if (thing.tag === '#') {
    return getContent(thing.children)
  }
  if (isArray(thing)) {
    return thing.map(getContent).join('')
  }
  return ''
}

function isArray (thing) {
  return Object.prototype.toString.call(thing) === '[object Array]'
}

function isComponent (thing) {
  return thing && (typeof thing === 'object' && thing.view) || isFunction(thing)
}

function isFunction (thing) {
  return typeof thing === 'function'
}

function call (thing) {
  return thing()
}

var language = cssauron({
  tag: 'tag',
  contents: function (node) {
    var content = node.text == null ? '' : ('' + node.text)
    if (isStringOrNumber(node.children) || isBoolean(node.children)) {
      return '' + content + node.children
    }
    return '' + content + getContent(node.renderedChildren)
  },
  id: function (node) {
    if (node.attrs) {
      return node.attrs.id || ''
    }
    return ''
  },
  class: function (node) {
    if (node.attrs) {
      return node.attrs.className
    }
    return ''
  },
  parent: 'parent',
  children: function (node) {
    return isArray(node.renderedChildren) ? node.renderedChildren.filter(identity) : []
  },
  attr: function (node, attr) {
    if (node.attrs) {
      return node.attrs[attr]
    }
  }
})

function join (arrays) {
  return arrays.reduce(function (result, array) {
    return result.concat(array)
  }, [])
}

function renderComponents (states, onremovers) {
  function renderComponent (component, treePath) {
    if (!states[treePath]) {
      component.state = copyObj(component.tag)
      if (component.tag.oninit) {
        component.tag.oninit(component)
        states[treePath] = component.state
      }
      if (component.tag.onremove) {
        onremovers.push(function () {
          component.tag.onremove(component)
        })
      }
      if (component.tag._captureVnode) {
        component.tag._captureVnode(component)
      }
    } else {
      component.state = states[treePath]
      if (component.tag.onupdate) {
        component.tag.onupdate(component)
      }
    }
    var node
    if (component.tag.view) {
      node = component.tag.view(component)
    } if (isFunction(component.tag)) {
      node = component.tag(component).view(component)
    }
    if (node) {
      node.parent = component.parent
    }
    return node
  }

  return function renderNode (node, treePath) {
    if (!node) {
      return ''
    }
    if (isArray(node)) {
      return node.map(function (subnode, index) {
        return renderNode(subnode, treePath + PD + index)
      })
    }
    if (isComponent(node.tag)) {
      return renderNode(renderComponent(node, treePath), treePath + PD + (node.key || ''))
    }
    if (node.children) {
      node.renderedChildren = renderNode(node.children, treePath + PD + (node.key || ''))
    }
    return node
  }
}

function scan (render) {
  var states = {}
  var onremovers = []
  var renderNode = renderComponents(states, onremovers)
  var api = {
    onremovers: onremovers,
    redraw: function () {
      api.rootNode = renderNode(render(api), 'ROOT')
    }
  }
  api.redraw()

  function find (selectorString, node) {
    return select(language(selectorString))(node)
  }

  function select (matchesSelector) {
    return function matches (node) {
      if (!node) {
        return []
      }
      if (isArray(node)) {
        return join(node.filter(identity).map(function (childNode) {
          return matches(childNode)
        }))
      }
      var foundNodes = []
      if (matchesSelector(node)) {
        foundNodes.push(node)
      }
      if (isBoolean(node.children) || isStringOrNumber(node.children) || !node.children) {
        return foundNodes
      }
      node.renderedChildren.filter(identity).map(function (child) {
        if ((typeof child === 'string') || (typeof child === 'number')) {
          return
        }
        child.parent = node
        child.inspect = function () {
          return {
            tag: child.tag,
            children: child.children,
            text: child.text,
            attrs: child.attrs
          }
        }
      })
      return foundNodes.concat(matches(node.renderedChildren))
    }
  }

  function first (selector) {
    var node = find(selector, api.rootNode)[0]
    if (!node) {
      throw new Error('No element matches ' + selector)
    }
    return node
  }

  function has (selector) {
    return find(selector, api.rootNode).length > 0
  }

  function contains (value, node) {
    return !!find(':contains(' + value + ')', node).length
  }

  function shouldHaveAtLeast (minCount, selector) {
    var actualCount = find(selector, api.rootNode).length
    if (actualCount < minCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
        '"\n  expected: >=' + minCount + '\n  actual: ' + actualCount)
    }
  }

  function shouldHave (expectedCount, selector) {
    if (!selector) {
      return isArray(expectedCount)
        ? shouldHaveCollection(expectedCount)
        : shouldHaveAtLeast(1, expectedCount)
    }

    var actualCount = find(selector, api.rootNode).length
    if (actualCount !== expectedCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
        '"\n  expected: ' + expectedCount + '\n  actual: ' + actualCount)
    }
  }

  function shouldHaveCollection (selectors) {
    selectors.forEach(function (selector) {
      shouldHaveAtLeast(1, selector)
    })
  }

  function shouldNotHave (selector) {
    shouldHave(0, selector)
  }

  function shouldContain (string) {
    if (!contains(string, api.rootNode)) {
      throw new Error('Expected "' + string + '" not found!')
    }
  }

  function shouldNotContain (string) {
    if (contains(string, api.rootNode)) {
      throw new Error('Unexpected "' + string + '" found!')
    }
  }

  function setValue (selector, string, silent) {
    var attrs = first(selector).attrs
    var event = {
      currentTarget: {value: string},
      target: {value: string}
    }
    attrs.oninput && attrs.oninput(event)
    attrs.onchange && attrs.onchange(event)
    attrs.onkeyup && attrs.onkeyup(event)
    silent || api.redraw()
  }

  function trigger (eventName) {
    return function (selector, event, silent) {
      var attrs = first(selector).attrs
      attrs[eventName](event)
      silent = silent || (event && event.redraw === false)
      silent || api.redraw()
    }
  }

  function triggerKey (eventName) {
    var fire = trigger('on' + eventName)
    return function handleEvent (selector, key, options) {
      options = options || {}
      var keyCode = isString(key) ? code(key) : key
      fire(selector, {
        target: options.target || {value: options.value},
        altKey: !!options.altKey,
        shiftKey: !!options.shiftKey,
        ctrlKey: !!options.ctrlKey,
        type: eventName,
        keyCode: keyCode,
        which: keyCode
      }, !!options.silent)
    }
  }

  shouldHave.at = {
    least: shouldHaveAtLeast
  }

  api.first = first
  api.has = has
  api.contains = function (value) {
    return contains(value, api.rootNode)
  }
  api.find = function (selector) {
    return find(selector, api.rootNode)
  }
  api.setValue = setValue
  ;['focus', 'click', 'blur', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'].map(function (eventName) {
    api[eventName] = trigger('on' + eventName)
  })
  api.contextMenu = trigger('contextmenu')
  api.keydown = triggerKey('keydown')
  api.keypress = triggerKey('keypress')
  api.keyup = triggerKey('keyup')
  api.trigger = function (selector, eventName, event, silent) {
    trigger(eventName)(selector, event, silent)
  }
  api.should = {
    not: {
      have: shouldNotHave,
      contain: shouldNotContain
    },
    have: shouldHave,
    contain: shouldContain
  }
  api.log = function (selector, logFn) {
    var util = require('util')
    ;(logFn || console.log)(util.inspect(api.find(selector), {
      colors: true,
      depth: null
    }))
    return api
  }
  return api
}

function init (viewOrComponentOrRootNode, nodeOrAttrs) {
  var api = {}
  var isViewFunction = isFunction(viewOrComponentOrRootNode)
  if (isViewFunction) {
    console.warn('Using a view function as first argument is deprecated in order to support closure components. Please use object notation (`{ view: () => viewFunction(arg) }`).')
    api = scan(function () {
      return viewOrComponentOrRootNode(nodeOrAttrs)
    })
  } else if (isComponent(viewOrComponentOrRootNode)) {
    api = scan(function (api) {
      viewOrComponentOrRootNode._captureVnode = function (vnode) {
        api.vnode = vnode
      }
      return m(viewOrComponentOrRootNode, nodeOrAttrs)
    })
  } else {
    // assume that first argument is rendered view
    api = scan(function () {
      return viewOrComponentOrRootNode
    })
  }
  api.onremove = function () {
    api.onremovers.filter(isFunction).map(call)
  }
  return api
}

module.exports = init
