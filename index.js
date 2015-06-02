'use strict';

var cssauron = require('cssauron');
var code = require('yields-keycode');

var PD = '//';

function identity(thing) {
  return thing;
}

function isString(thing) {
  return typeof thing === 'string';
}

function isNumber(thing) {
  return typeof thing === 'number';
}

function isArray(thing) {
  return Object.prototype.toString.call(thing) === '[object Array]';
}

function isModule(thing) {
  return  thing && typeof thing === 'object' && thing.controller && thing.view;
}

function isFuction(thing) {
  return typeof thing === 'function';
}

function call(thing) {
  return thing();
}

var language = cssauron({
  tag: 'tag',
  contents: function(node) {
    if (isString(node.children)) {
      return node.children;
    }
    return isArray(node.children) ? node.children.filter(isString).concat('') : '';
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
    return node.children.filter(identity);
  },
  attr: function(node, attr) {
    if (node.attrs) {
      return node.attrs[attr];
    }
  }
});

function join(arrays) {
  return arrays.reduce(function(result, array) {
    return result.concat(array);
  }, []);
}

function scan(render) {
  var api = {
    rootEl: render(),
    onunloaders: []
  };

  var scopes = {};

  function find(selectorString, el) {
    return select(language(selectorString))(el);
  }

  function select(matchesSelector) {
    return function matches(el, treePath) {
      treePath = treePath || '';
      if (isArray(el)) {
        return join(el.filter(identity).map(function(childEl, index) {
          return matches(childEl, treePath + PD + (childEl.key || index));
        }));
      }
      var foundEls = [];
      if (!el) {
        return foundEls;
      }
      if (isModule(el)) {
        scopes[treePath] = scopes[treePath] || el.controller();
        if (scopes[treePath]) {
          api.onunloaders.push(scopes[treePath].onunload);
        }
        el = el.view(scopes[treePath]);
      }
      if (matchesSelector(el)) {
        foundEls.push(el);
      }
      if (!el.children || isString(el.children)) {
        return foundEls;
      }
      el.children.filter(identity).forEach(function(child) {
        child.parent = el;
      });
      return foundEls.concat(matches(el.children, treePath));
    };
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
    if (isModule(el)) {
      var scope;
      if (el.controller) {
        scope = el.controller();
        if (scope && scope.onunload) {
          api.onunloaders.push(scope.onunload);
        }
      }
      el = el.view(scope);
    }
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

  function trigger(eventName) {
    return function (selector, event, silent) {
      var attrs = first(selector).attrs;
      attrs['on' + eventName](event);
      silent || api.redraw();
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

  api.redraw = function() {
    api.rootEl = render();
    return api;
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
  ['focus', 'click', 'blur', 'mousedown', 'mouseup', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'].map(function(eventName) {
    api[eventName] = trigger(eventName);
  });
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

function init(viewOrModuleOrRootEl, scope, b, c, d, e, f, noWay) {
  if (noWay) {
    throw new Error('More than 6 args of a component? Seriously? Such bad style is not supported.');
  }
  var api = {};
  var isViewFunction = typeof viewOrModuleOrRootEl === 'function';
  if (isViewFunction) {
    api = scan(function() {
      return viewOrModuleOrRootEl(scope);
    });
    if (scope) {
      api.onunloaders.push(scope.onunload);
    }
  } else if (isModule(viewOrModuleOrRootEl)) {
    var a = scope;
    scope = new viewOrModuleOrRootEl.controller(a, b, c, d, e, f);
    api = scan(function() {
      return viewOrModuleOrRootEl.view(scope, a, b, c, d, e, f);
    });
    if (scope) {
      api.onunloaders.push(scope.onunload);
    }
  } else {
    // assume that first argument is rendered view
    api = scan(function() {
      return viewOrModuleOrRootEl;
    });
  }
  api.onunload = function() {
    api.onunloaders.filter(isFuction).map(call);
  };
  return api;
}

module.exports = init;
