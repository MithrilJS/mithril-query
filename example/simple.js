var m = require('mithril')

module.exports = {
  view: function () {
    return m('div', [
      m('span', 'spanContent'),
      m('#fooId', 'fooContent'),
      m('.barClass', 'barContent')
    ])
  }
}
