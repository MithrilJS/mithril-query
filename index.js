'use strict';

var m = require('mithril');
var DOM = require('simple-dom');

m.deps({
  document: new DOM.Document(),
  requestAnimationFrame: function(fn) {
    return setTimeout(fn, 0);
  }
});

var rootNode = new DOM.Node('div', 'div');

var cssauron = require('cssauron');
var code = require('yields-keycode');

function noop(){}

function isString(thing) {
  return typeof thing === 'string';
}

function isNumber(thing) {
  return typeof thing === 'number';
}

function isComponent(thing) {
  return  typeof thing === 'object' && thing.controller && thing.view;
}

function isFunction(thing) {
  return typeof thing === 'function';
}

function getAttr(type, fallback) {
  return function(node) {
    if (!node.attributes) {
      return fallback;
    }
    var attribute = node.attributes.filter(function(attribute) {
      return attribute.name === type;
    })[0];
    if (!attribute) {
      return fallback;
    }
    return attribute.value;
  };
}

function getChildNodes(node) {
  var childNodes = [];
  var child = node.firstChild;
  while (child) {
    childNodes.push(child);
    child = child.nextSibling;
  }
  return childNodes;
}

function toVdomEl(node) {
  var attrMap = {
    classname: 'className'
  };
  if (node.nodeName === '#text') {
    return node.nodeValue;
  }
  var vdomEl = {
    tag: node.tagName.toLowerCase()
  };
  vdomEl.attrs = node.attributes.reduce(function(attrs, attribute) {
    attrs[attrMap[attribute.name] || attribute.name] = attribute.value;
    return attrs;
  }, {});
  Object.keys(node).reduce(function(vdomEl, key) {
    if (isFunction(node[key])) {
      vdomEl.attrs[key] = node[key];
    }
    return vdomEl;
  }, vdomEl);
  vdomEl.children = getChildNodes(node).map(function(node) {
    var child = toVdomEl(node);
    child.parent = vdomEl;
    return child;
  });
  return vdomEl;
}

var language = cssauron({
  tag: 'tag',
  contents: function(node) {
    if (isString(node)) {
      return node;
    }
    return isString(node.children) ? node.children : '';
  },
  id: function(node) {
    if (node.attrs) {
      return node.attrs.id;
    }
    return '';
  },
  class: function(node) {
    if (node.attrs) {
      return node.attrs.className;
    }
    return '';
  },
  parent: 'parent',
  children: 'children',
  attr: function(node, attr) {
    if (node.attrs) {
      return node.attrs[attr];
    }
  }
});

function scan(renderVdom) {
  var api = {};
  api.redraw = function() {
    m.render(rootNode, renderVdom());
    api.rootEl = toVdomEl(rootNode.firstChild);
  };
  api.redraw();
  function find(selector, el) {
    var foundEls = [];
    var matchesSelector = isString(selector) ? language(selector) : selector;
    if (matchesSelector(el)) {
      foundEls.push(el);
    }
    if (el.children) {
      el.children.map(function(child) {
        foundEls = foundEls.concat(find(matchesSelector, child));
      });
    }
    return foundEls;
  }

  function first(selector) {
    var el = find(selector, api.rootEl)[0];
    if (!el) {
      throw new Error('No element matches ' + selector);
    }
    return el;
  }

  function has(selector) {
    return find(selector, api.rootEl).length > 0;
  }

  function contains(value, el) {
    if (isString(el) || isNumber(el)) {
      return ('' + el).indexOf(value) >= 0;
    }
    return (el.children || []).some(function(child) {
      return contains(value, child);
    });
  }

  function shouldHaveAtLeast(minCount, selector) {
    var actualCount = find(selector, api.rootEl).length;
    if (actualCount < minCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
            '"\n  expected: >=' + minCount + '\n  actual: ' + actualCount);
    }
  }

  function shouldHave(expectedCount, selector) {
    if (!selector) {
      return shouldHaveAtLeast(1, expectedCount);
    }
    var actualCount = find(selector, api.rootEl).length;
    if (actualCount !== expectedCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
            '"\n  expected: ' + expectedCount + '\n  actual: ' + actualCount);
    }
  }

  function shouldNotHave(selector) {
    shouldHave(0, selector);
  }

  function shouldContain(string) {
    if (!contains(string, api.rootEl)) {
      throw new Error('Expected "' + string + '" not found!');
    }
  }

  function shouldNotContain(string) {
    if (contains(string, api.rootEl)) {
      throw new Error('Unexpected "' + string + '" found!');
    }
  }

  function setValue(selector, string, silent) {
    var el = first(selector);
    var event = {
      currentTarget: {value: string},
      target: {value: string}
    };
    el.attrs.oninput && el.attrs.oninput(event);
    el.attrs.onchange && el.attrs.onchange(event);
    el.attrs.onkeyup && el.attrs.onkeyup(event);
    if (!silent) {
      api.redraw();
    }
  }

  function trigger(eventName) {
    return function (selector, event, silent) {
      var el = first(selector);
      el.attrs['on' + eventName](event || {});
      if (!silent) {
        api.redraw();
      }
    };
  }

  function triggerKey(eventName) {
    var fire = trigger(eventName);
    return function keydown(selector, key, silent) {
      fire(selector, {
        keyCode: isString(key) ? code(key) : key
      }, silent);
    };
  }

  shouldHave.at = {
    least: shouldHaveAtLeast
  };

  api.first = first;
  api.has = has;
  api.contains = function(value) {
    return contains(value, api.rootEl);
  };
  api.find = function(selector) {
    return find(selector, api.rootEl);
  };
  api.setValue = setValue;
  api.focus = trigger('focus');
  api.click = trigger('click');
  api.blur = trigger('blur');
  api.keydown = triggerKey('keydown');
  api.keypress = triggerKey('keypress');
  api.keyup = triggerKey('keyup');
  api.should = {
    not: {
      have: shouldNotHave,
      contain: shouldNotContain,
    },
    have: shouldHave,
    contain: shouldContain
  };
  return api;
}

function init(viewOrComponentOrRootEl, scope, b, c, d, e, f, noWay) {
  m.render(rootNode, m('div'));
  if (noWay) {
    throw new Error('More than 6 args of a component? Seriously? Such bad style is not supported.');
  }
  var api = {};
  var componentOnUnload = noop;
  if (isFunction(viewOrComponentOrRootEl)) {
    api = scan(function() {
      return viewOrComponentOrRootEl(scope);
    });
  } else if (isComponent(viewOrComponentOrRootEl)) {
    var a = scope;
    scope = new viewOrComponentOrRootEl.controller(a, b, c, d, e, f);
    api = scan(function() {
      return viewOrComponentOrRootEl.view(scope, a, b, c, d, e, f);
    });
  } else {
    // assume that first argument is rendered view
    api = scan(function() {
      return viewOrComponentOrRootEl;
    });
  }
  if (scope && isFunction(scope.onunload)) {
    componentOnUnload = scope.onunload;
  }
  api.onunload = function() {
    componentOnUnload();
    m.render(rootNode, m('div'));
  };
  return api;
}

init.toVdomEl = toVdomEl;

module.exports = init;
