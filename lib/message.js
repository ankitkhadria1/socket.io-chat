'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x10, _x11, _x12) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x10,
    property = _x11,
    receiver = _x12; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x10 = parent; _x11 = property; _x12 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

(function () {
	'use strict';

	var _ = require('underscore'),
	    util = require('util'),
	    db = require('./db'),
	    Model = require('./model'),
	    SchemaLoader = require('./schema'),
	    FLAGS = require('./flags'),
	    extend = require('extend'),
	    QueryResolver = require('./queryResolver'),
	    schemaLoader = new SchemaLoader();

	module.exports = function (options) {
		var collectionName = 'chats_messages',
		    schema = schemaLoader.load(__dirname + '/../schema/message.json');

		options.collection && (collectionName = options.collection);
		options.schema && (schema = extend(true, schema, options.schema));

		var Message = (function (_Model) {
			function Message(props) {
				_classCallCheck(this, Message);

				_get(Object.getPrototypeOf(Message.prototype), 'constructor', this).call(this, props);

				this.setSchema(schema);

				this.on('beforeValidate', function () {
					if (!this.get('createdAt')) {
						this.set('createdAt', new Date());
					}
				});
			}

			_inherits(Message, _Model);

			_createClass(Message, [{
				key: 'defaults',
				value: function defaults() {
					return schemaLoader.defaults(schema);
				}
			}, {
				key: 'setAuthor',
				value: function setAuthor(id) {
					if (id && db.ObjectID.isValid(id)) {
						this.set('authorId', id);
					}
				}
			}, {
				key: 'setSystemAuthor',
				value: function setSystemAuthor() {
					this.setAuthor(new db.ObjectID('000000000000000000000000'));
				}
			}, {
				key: 'setChat',
				value: function setChat(chat) {
					if (chat) {
						this.set('chatId', chat.get('_id'));
					}
				}
			}, {
				key: 'setReceivers',
				value: function setReceivers(ids) {
					var filteredIds;

					if (ids) {
						filteredIds = ids.filter(function (id) {
							return db.ObjectID.isValid(id);
						});

						this.set('receivers', filteredIds);
					}
				}
			}, {
				key: 'setSystem',
				value: function setSystem(data) {
					this.set('type', 'system');
					this.set('system', data);
				}
			}, {
				key: 'addAttachments',
				value: function addAttachments() {
					var files = arguments[0] === undefined ? {} : arguments[0];

					_.each(files, function (file) {});
				}
			}, {
				key: 'collection',
				value: function collection() {
					return collectionName;
				}
			}], [{
				key: 'stream',
				value: function stream() {
					var criteria = arguments[0] === undefined ? {} : arguments[0];
					var streamOptions = arguments[1] === undefined ? {} : arguments[1];

					var cursor;

					cursor = db.connect().collection(collectionName).find(criteria).stream(streamOptions);

					return cursor;
				}
			}, {
				key: 'findLast',
				value: function findLast(dataChatId, user, count) {
					var flag = arguments[3] === undefined ? FLAGS.RECEIVER : arguments[3];
					var criteria = arguments[4] === undefined ? {} : arguments[4];

					var chatId = db.ObjectId(dataChatId),
					    userId = db.ObjectId(user),
					    query = { chatId: chatId },
					    queryResolver = new QueryResolver();

					switch (flag) {
						case FLAGS.AUTHOR:
							query.authorId = userId;
							break;
						case FLAGS.RECEIVER:
							query.receivers = userId;
							break;
					}

					queryResolver.setSchema(schema);

					return queryResolver.collection(collectionName).setQuery(query, criteria.filter).setSort({}, criteria.sort).setLimit(criteria.limit || count).setNext(criteria.next).find();
				}
			}, {
				key: 'findFrom',
				value: function findFrom(dataChatId, dataMessageId, user, count) {
					var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];
					var criteria = arguments[5] === undefined ? {} : arguments[5];

					var queryResolver = new QueryResolver(),
					    chatId = db.ObjectId(dataChatId),
					    messageId = db.ObjectId(dataMessageId),
					    userId = db.ObjectId(user),
					    query = { _id: { $gt: messageId }, chatId: chatId, receivers: userId };

					switch (flag) {
						case FLAGS.AUTHOR:
							query.authorId = userId;
							break;
						case FLAGS.RECEIVER:
							query.receivers = userId;
							break;
					}

					queryResolver.setSchema(schema);

					return queryResolver.collection(collectionName).setQuery(query, criteria.filter).setSort({}, criteria.sort).setLimit(criteria.limit || count).find();
				}
			}, {
				key: 'findAt',
				value: function findAt(dataChatId, dataMessageId, user, count) {
					var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];
					var criteria = arguments[5] === undefined ? {} : arguments[5];

					var queryResolver = new QueryResolver(),
					    chatId = db.ObjectId(dataChatId),
					    messageId = db.ObjectId(dataMessageId),
					    userId = db.ObjectId(user),
					    query = { _id: { $lt: messageId }, chatId: chatId };

					switch (flag) {
						case FLAGS.AUTHOR:
							query.authorId = userId;
							break;
						case FLAGS.RECEIVER:
							query.receivers = userId;
							break;
					}

					queryResolver.setSchema(schema);

					return queryResolver.collection(collectionName).setQuery(query, criteria.filter).setSort({}, criteria.sort).setLimit(criteria.limit || count).find();
				}
			}]);

			return Message;
		})(Model);

		return Message;
	};
})();
//# sourceMappingURL=message.js.map