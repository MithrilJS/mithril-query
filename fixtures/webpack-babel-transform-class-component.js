"use strict";
const m = require('mithril/hyperscript')

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default = function () { return _classCallCheck; };

var BabelClassComponent = function () {
  function BabelClassComponent(vnode) {
    _babel_runtime_helpers_classCallCheck__WEBPACK_IMPORTED_MODULE_0___default()(this, BabelClassComponent);

    this.vnode = vnode;
  }

  _createClass(BabelClassComponent, [{
    key: 'view',
    value: function view() {
      return m('div', ['hello']);
    }
  }]);

  return BabelClassComponent;
}();

module.exports = BabelClassComponent;
