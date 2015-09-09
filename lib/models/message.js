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
	var db = client.db;

	if (!options.collectionName) options.collectionName = 'chat_messages';

	class Message extends _modelIndex2['default'] {
		constructor() {
			var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			super(data);

			super.initialize(options);
		}

		setChat(chat) {
			this.set('chatId', chat.get('_id'));
			this.set('receivers', chat.get('members').map(function (member) {
				return member._id;
			}).map(String));

			return this;
		}

		setAuthor(user) {
			this.set('authorId', String(user));

			return this;
		}

		setType(type) {
			this.set('type', type);

			return this;
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