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
    var foundEls = els.reduce(function(foundEls, el) {
      if (selector(el)) {
        foundEls.push(el);
      }
      if (el.children) {
        if (isArray(el.children)) {
          el.children.forEach(function(child) {
            child.parent = el;
          });
        }
        foundEls = foundEls.concat(find(selector, el.children));
      }
      return foundEls;
    }, []);
    return foundEls;
  }
  function first(selector) {
    return find(selector)[0];
  }
  function has(selector) {
    return find(selector).length > 0;
  }
  function contains(string, subEl) {
    el = subEl || rootEl;
    var els = isArray(el) ? el : [el];
    return els.some(function(el) {
      if (isString(el)) {
        return el.indexOf(string) >= 0;
      }
      if (isString(el.children)) {
        return el.children.indexOf(string) >= 0;
      }
      if (el.children) {
        return el.children.some(function(el) {
          return contains(string, el);
        });
      }
    });
  }

  return {
    find: find,
    first: first,
    has: has,
    contains: contains
  };
}

module.exports = parse;
