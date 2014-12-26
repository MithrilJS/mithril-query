// simple module: simple.js
var m = require('Mithril');

module.exports = {
  controller: function() {},
  view: function(ctrl) {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent')
    ]);
  }
};
