'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _bsonObjectid = require('bson-objectid');

var _bsonObjectid2 = _interopRequireDefault(_bsonObjectid);

var _providerMongodb = require('./provider-mongodb');

var _providerMongodb2 = _interopRequireDefault(_providerMongodb);

class Db {
	constructor() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		if (!options.provider) {
			throw new Error('db must have `provider`');
		}

		switch (options.provider) {
			case 'mongodb':
				this._provider = new _providerMongodb2['default'](options.connect);
				break;
			default:
				this._provider = new _providerMongodb2['default'](options.connect);
		}
	}

	get provider() {
		return this._provider;
	}

	get connect() {
		return this._connect;
	}

	set connect(_connect) {
		_connect && (this._connect = _connect);

		return this;
	}
}

exports['default'] = Db;
module.exports = exports['default'];
//# sourceMappingURL=db.js.map