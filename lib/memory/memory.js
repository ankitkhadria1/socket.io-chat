'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _providerMap = require('./provider-map');

var _providerMap2 = _interopRequireDefault(_providerMap);

var _providerRedis = require('./provider-redis');

var _providerRedis2 = _interopRequireDefault(_providerRedis);

class Memory {
	constructor() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

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

	getChat(id) {
		return this.provider.getChat();
	}
}

exports['default'] = Memory;
module.exports = exports['default'];
//# sourceMappingURL=memory.js.map