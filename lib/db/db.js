'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _bsonObjectid = require('bson-objectid');

var _bsonObjectid2 = _interopRequireDefault(_bsonObjectid);

var _providerMongodb = require('./provider-mongodb');

var _providerMongodb2 = _interopRequireDefault(_providerMongodb);

var Db = (function () {
	function Db() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, Db);

		if (!options.provider) {
			throw new Error('db must have `provider`');
		}

		switch (options.provider) {
			case 'mongodb':
				this.provider = new _providerMongodb2['default'](this);
				break;
			default:
				this.provider = new _providerMongodb2['default'](this);
		}
	}

	_createClass(Db, [{
		key: 'find',
		value: function find() {
			this.provider.find.apply(this.provider, arguments);
		}
	}, {
		key: 'update',
		value: function update() {
			this.provider.update.apply(this.provider, arguments);
		}
	}, {
		key: 'remove',
		value: function remove() {
			this.provider.remove.apply(this.provider, arguments);
		}
	}, {
		key: 'connect',
		get: function get() {
			return this._connect;
		},
		set: function set(_connect) {
			_connect && (this._connect = _connect);

			return this;
		}
	}]);

	return Db;
})();

exports['default'] = Db;
module.exports = exports['default'];
//# sourceMappingURL=db.js.map