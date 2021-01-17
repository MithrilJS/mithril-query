var m = require('mithril/hyperscript')

module.exports = {
  view: function() {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent'),
    ])
  },
}
