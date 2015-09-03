'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _modelIndex = require('../model/index');

var _modelIndex2 = _interopRequireDefault(_modelIndex);

var _schema = require('../schema');

var _schema2 = _interopRequireDefault(_schema);

exports['default'] = function (client) {
	var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	var schema = _schema2['default'].load('message');
	var db = client._db;

	if (!options.collectionName) options.collectionName = 'chat_messages';

	class Message extends _modelIndex2['default'] {
		constructor() {
			super.apply(undefined, arguments);
			super.initialize(options);
		}

		static collection() {
			return options.collectionName;
		}
		static db() {
			return db;
		}
		static schema() {
			return schema;
		}

		collection() {
			return options.collectionName;
		}
		db() {
			return db;
		}
		schema() {
			return schema;
		}
	}

	//Model.ensureIndex(Message);

	return Message;
};

;
module.exports = exports['default'];
//# sourceMappingURL=message.js.map