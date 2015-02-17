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

function find(selector, el) {
  var matchesSelector = isString(selector) ? language(selector) : selector;
  var els = isArray(el) ? el : [el];
  els = els.filter(function(el) { return el !== undefined; });
  var foundEls = els.reduce(function(foundEls, el) {
    if (matchesSelector(el)) {
      foundEls.push(el);
    }
    if (isArray(el)) {
      return foundEls.concat(find(matchesSelector, el));
    }
    if (
      isString(el.children) ||
      !el.children ||
      // sometimes mithril spits out an array with only one undefined.
      (isArray(el.children) && !el.children[0])
    ) {
      return foundEls;
    }
    el.children.filter(function(child) {
      return typeof child === 'object';
    }).forEach(function(child) {
      child.parent = el;
    });
    return foundEls.concat(find(matchesSelector, el.children));
  }, []);
  return foundEls;
}

function scan(render) {
  var rootEl = render();
  var api = {};

  function first(selector) {
    var el = find(selector, rootEl)[0];
    if (!el) {
      throw new Error('No element matches ' + selector);
    }
    return el;
  }

  function has(selector) {
    return find(selector, rootEl).length > 0;
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
    var actualCount = find(selector, rootEl).length;
    if (actualCount < minCount) {
      throw new Error('Wrong count of elements that matches "' + selector +
            '"\n  expected: >=' + minCount + '\n  actual: ' + actualCount);
    }
  }

  function shouldHave(expectedCount, selector) {
    if (!selector) {
      return shouldHaveAtLeast(1, expectedCount);
    }
    var actualCount = find(selector, rootEl).length;
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
    silent || api.redraw();
  }

  function click(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onclick(event);
    silent || api.redraw();
  }

  function focus(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onfocus(event);
    silent || api.redraw();
  }

  function blur(selector, event, silent) {
    var attrs = first(selector).attrs;
    attrs.onblur(event);
    silent || api.redraw();
  }

  shouldHave.at = {
    least: shouldHaveAtLeast
  };

  api.redraw = function() {
    rootEl = render();
    return api;
  };
  api.first = first;
  api.has = has;
  api.contains = function(value) {
    return contains(value, rootEl);
  };
  api.find = function(selector) {
    return find(selector, rootEl);
  },
  api.setValue = setValue;
  api.focus = focus;
  api.click = click;
  api.blur = blur;
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

function init(viewOrModuleOrRootEl, scope) {
  var api = {};
  var isViewFunction = typeof viewOrModuleOrRootEl === 'function';
  var isModule = viewOrModuleOrRootEl.controller && viewOrModuleOrRootEl.view;
  if (isViewFunction) {
    api = scan(function() {
      return viewOrModuleOrRootEl(scope);
    });
  } else if (isModule) {
    scope = new viewOrModuleOrRootEl.controller(scope);
    api = scan(function() {
      return viewOrModuleOrRootEl.view(scope);
    });
  } else {
    // assume that first argument is rendered view
    api = scan(function() {
      return viewOrModuleOrRootEl;
    });
  }
  api.onunload = (scope && scope.onunload) ? scope.onunload : function() {};
  return api;
}

module.exports = init;
