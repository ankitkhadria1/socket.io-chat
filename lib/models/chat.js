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

	var schema = _schema2['default'].load('chat');
	var db = client.db;

	if (!options.collectionName) options.collectionName = 'chat';

	class Chat extends _modelIndex2['default'] {
		constructor() {
			var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

			super(data);

			super.initialize(options);
		}

		setCreator(creator) {
			this.set('creatorId', creator);
			this.addMember(creator);

			return this;
		}

		addMember(member) {
			this.members.addToSet({ _id: String(member) });

			return this;
		}

		getMembersIds() {
			return this.get('members').map(function (member) {
				return member._id;
			});
		}

		// TODO: test with multiple clients. Static method can be invoked from the property `constructor` of the parent class;
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

	_modelIndex2['default'].ensureIndex(Chat);

	return Chat;
};

;
module.exports = exports['default'];
//# sourceMappingURL=chat.js.map