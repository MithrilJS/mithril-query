var cssauron = require('cssauron');
var _ = require('lodash');

var language = cssauron({
  tag: function(node) {
    return node.tag;
  },
  contents: function(node) {
    if (_.isString(node)) {
      return node;
    }
    return _.isString(node.children) ? node.children : '';
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
  parent: function(node) {
    throw new Error('Since mithril has no way to determine parent node, traversing selecors are not implemented');
  },
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
    selector = _.isString(selector) ? language(selector) : selector;
    var el = subEl || rootEl;
    var els = _.isArray(el) ? el : [el];
    var foundEls = els.reduce(function(foundEls, el) {
      if (selector(el)) {
        foundEls.push(el);
      }
      if (el.children) {
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
    var els = _.isArray(el) ? el : [el];
    return _.any(els, function(el) {
      if (_.isString(el)) {
        return el.indexOf(string) >= 0;
      }
      if (_.isString(el.children)) {
        return el.children.indexOf(string) >= 0;
      }
      return _.any(el.children, function(el) {
        return contains(string, el);
      })
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
