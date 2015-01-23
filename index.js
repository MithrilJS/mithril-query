'use strict';

var cssauron = require('cssauron');

function isString(thing) {
  return typeof thing === 'string';
}
function isNumber(thing) {
  return typeof thing === 'number';
}
function isArray(thing) {
  return Object.prototype.toString.call(thing) === '[object Array]';
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
  children: function(node) {
    return node.children;
  },
  attr: function(node, attr) {
    if (node.attrs) {
      return node.attrs[attr];
    }
  }
});

function parse(viewOrModuleOrRootEl, scope) {
  var api = {};
  var redraw = function(){ return api; };
  var rootEl = viewOrModuleOrRootEl;
  if (typeof viewOrModuleOrRootEl === 'function') {
    var view = viewOrModuleOrRootEl;
    redraw = function() {
      rootEl = view(scope);
      return api;
    };
    redraw();
  } else if (viewOrModuleOrRootEl.controller && viewOrModuleOrRootEl.view) {
    var module = viewOrModuleOrRootEl;
    scope = new module.controller(scope);
    redraw = function() {
      rootEl = module.view(scope);
      return api;
    };
    redraw();
  }
  function find(selector, subEl) {
    selector = isString(selector) ? language(selector) : selector;
    var el = subEl || rootEl;
    var els = isArray(el) ? el : [el];
    els = els.filter(function(el) { return el !== undefined; });
    var foundEls = els.reduce(function(foundEls, el) {
      if (selector(el)) {
        foundEls.push(el);
      }
      if (isArray(el)) {
        return foundEls.concat(find(selector, el));
      }
      // sometimes mithril spits out an array with only one undefined.
      // The following if should catch that
      if (isString(el.children) || !el.children || (el.children.length && !el.children[0])) {
        return foundEls;
      }
      el.children.filter(function(child) {
        return typeof child === 'object';
      }).forEach(function(child) {
        child.parent = el;
      });
      return foundEls.concat(find(selector, el.children));
    }, []);
    return foundEls;
  }

  function first(selector) {
    var el = find(selector)[0];
    if (!el) {
      throw new Error('No element matches ' + selector);
    }
    return el;
  }

  function has(selector) {
    return find(selector).length > 0;
  }

  function contains(value, el) {
    if (!el) {
      return false;
    }
    if (isString(el)) {
      return el.indexOf(value) >= 0;
    }
    if (isString(el.children)) {
      return el.children.indexOf(value) >= 0;
    }
    if (isNumber(el)) {
      return el === value;  
    }
    if (isNumber(el.children)) {
      return el.children === value;  
    }
    if (isArray(el)) {
      return el.some(function(child) {
        return contains(value, child);
      });
    }
    if (el.children && el.children.length) {
      return el.children.some(function(child) {
        return contains(value, child);
      });
    }
    return false;
  }

  function shouldHaveAtLeast(minCount, selector) {
    var actualCount = find(selector).length;
    if (actualCount < minCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
            '"\n  expected: >=' + minCount + '\n  actual: ' + actualCount);
    }
  }

  function shouldHave(expectedCount, selector) {
    if (!selector) {
      return shouldHaveAtLeast(1, expectedCount);
    }
    var actualCount = find(selector).length;
    if (actualCount !== expectedCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
            '"\n  expected: ' + expectedCount + '\n  actual: ' + actualCount);
    }
  }

  function shouldNotHave(selector) {
    shouldHave(0, selector);
  }

  function shouldContain(string) {
    if (!contains(string, rootEl)) {
      throw new Error('Expected "' + string + '" not found!');
    }
  }

  function shouldNotContain(string) {
    if (contains(string, rootEl)) {
      throw new Error('Unexpected "' + string + '" found!');
    }
  }

  function setValue(selector, string, silent) {
    var attrs = first(selector).attrs;
    var event = {
      currentTarget: {value: string},
      target: {value: string}
    };
    attrs.oninput && attrs.oninput(event);
    attrs.onchange && attrs.onchange(event);
    attrs.onkeyup && attrs.onkeyup(event);
    silent || redraw();
  }

  function click(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onclick(event);
    silent || redraw();
  }

  function focus(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onfocus(event);
    silent || redraw();
  }

  function blur(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onblur(event);
    silent || redraw();
  }

  shouldHave.at = {
    least: shouldHaveAtLeast
  };

  api.find = find;
  api.first = first;
  api.has = has;
  api.contains = function(value) {
    return contains(value, rootEl);
  };
  api.setValue = setValue;
  api.click = click;
  api.focus = focus;
  api.blur = blur;
  api.redraw = redraw;
  api.onunload = function() {
    scope.onunload && scope.onunload();
  },
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

module.exports = parse;
