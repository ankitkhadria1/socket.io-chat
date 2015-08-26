'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _providerMap = require('./provider-map');

var _providerMap2 = _interopRequireDefault(_providerMap);

var _providerRedis = require('./provider-redis');

var _providerRedis2 = _interopRequireDefault(_providerRedis);

var Memory = (function () {
	function Memory() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Memory);

		switch (options.provider) {
			case 'map':
				this.provider = new _providerMap2['default']();
				break;
			case 'redis':
				this.provider = new Redis();
				break;
			default:
				this.provider = new _providerRedis2['default']();
		}
	}

	_createClass(Memory, [{
		key: 'getChat',
		value: function getChat(id) {
			return this.provider.getChat();
		}
	}]);

	return Memory;
})();

exports['default'] = Memory;
module.exports = exports['default'];
//# sourceMappingURL=memory.js.map