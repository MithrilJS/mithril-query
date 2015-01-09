'use strict';

var cssauron = require('cssauron');

function isString(thing) {
  return typeof thing === 'string';
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

function parse(rootEl) {
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
      el.children.filter(function(child) { return typeof child === 'object' }).forEach(function(child) {
        child.parent = el;
      });
      return foundEls.concat(find(selector, el.children));
    }, []);
    return foundEls;
  }

  function first(selector) {
    return find(selector)[0];
  }

  function has(selector) {
    return find(selector).length > 0;
  }

  function contains(string, el) {
    if (!el) {
      return false;
    }
    if (isString(el)) {
      return el.indexOf(string) >= 0;
    }
    if (isString(el.children)) {
      return el.children.indexOf(string) >= 0;
    }
    if (isArray(el)) {
      return el.some(function(child) {
        return contains(string, child);
      });
    }
    if (el.children && el.children.length) {
      return el.children.some(function(child) {
        return contains(string, child);
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
      throw 'Expected "' + string + '" not found!';
    }
  }

  function shouldNotContain(string) {
    if (contains(string, rootEl)) {
      throw 'Unexpected "' + string + '" found!';
    }
  }

  function setValue(selector, string) {
    var attrs = first(selector).attrs;
    (attrs.oninput || attrs.onchange || attrs.onkeyup)({
      currentTarget: {value: string}
    });
  }

  function click(selector, event) {
    var attrs = first(selector).attrs;
    attrs.onclick(event);
  }

  function focus(selector, event) {
    var attrs = first(selector).attrs;
    attrs.onfocus(event);
  }

  function blur(selector, event) {
    var attrs = first(selector).attrs;
    attrs.onblur(event);
  }

  shouldHave.at = {
    least: shouldHaveAtLeast
  };

  return {
    find: find,
    first: first,
    has: has,
    contains: function(string) { return contains(string, rootEl); },
    setValue: setValue,
    click: click,
    focus: focus,
    blur: blur,
    should: {
      not: {
        have: shouldNotHave,
        contain: shouldNotContain,
      },
      have: shouldHave,
      contain: shouldContain
    }
  };
}

module.exports = parse;
