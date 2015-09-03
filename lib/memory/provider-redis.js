'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

class ProviderRedis extends _provider2['default'] {
	constructor() {
		super();
	}
}

exports['default'] = ProviderRedis;
module.exports = exports['default'];
//# sourceMappingURL=provider-redis.js.map