'use strict';

(function () {
	"use strict";

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

		class Message extends Model {
			defaults() {
				return schemaLoader.defaults(schema);
			}

			constructor(props) {
				super(props);

				this.setSchema(schema);

				this.on('beforeValidate', function () {
					if (!this.get('createdAt')) {
						this.set('createdAt', new Date());
					}
				});
			}

			static stream() {
				var criteria = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
				var streamOptions = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

				var cursor;

				cursor = db.connect().collection(collectionName).find(criteria).stream(streamOptions);

				return cursor;
			}

			setAuthor(id) {
				if (id && db.ObjectID.isValid(id)) {
					this.set('authorId', id);
				}
			}

			setSystemAuthor() {
				this.setAuthor(new db.ObjectID("000000000000000000000000"));
			}

			setChat(chat) {
				if (chat) {
					this.set('chatId', chat.get('_id'));
				}
			}

			setReceivers(ids) {
				var filteredIds;

				if (ids) {
					filteredIds = ids.filter(function (id) {
						return db.ObjectID.isValid(id);
					});

					this.set('receivers', filteredIds);
				}
			}

			setSystem(data) {
				this.set('type', 'system');
				this.set('system', data);
			}

			setReaded(user) {
				var userId = new db.ObjectId(user);

				if (!userId) {
					return;
				}

				if (! ~this.receivers.map(String).indexOf(String(userId))) {
					return;
				}

				if (this.read && this.read.map(String).indexOf(String(userId))) {
					return;
				}

				if (!read) {
					this.set('read', []);
				}

				this.read.push(userId);
			}

			addAttachments() {
				var files = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

				_.each(files, function (file) {});
			}

			collection() {
				return collectionName;
			}

			static collection() {
				return collectionName;
			}

			static schema() {
				return schema;
			}

			static findLast(dataChatId, user, count) {
				var flag = arguments.length <= 3 || arguments[3] === undefined ? FLAGS.RECEIVER : arguments[3];
				var criteria = arguments.length <= 4 || arguments[4] === undefined ? {} : arguments[4];

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

			static findFrom(dataChatId, dataMessageId, user, count) {
				var flag = arguments.length <= 4 || arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];
				var criteria = arguments.length <= 5 || arguments[5] === undefined ? {} : arguments[5];

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

			static findAt(dataChatId, dataMessageId, user, count) {
				var flag = arguments.length <= 4 || arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];
				var criteria = arguments.length <= 5 || arguments[5] === undefined ? {} : arguments[5];

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

			static findUnreaded(user) {
				var flag = arguments.length <= 1 || arguments[1] === undefined ? FLAGS.RECEIVER : arguments[1];
				var criteria = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

				var userId = db.ObjectId(user),
				    query = {
					read: { $nin: [userId] }
				};

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;break;
					case FLAGS.RECEIVER:
						query.receivers = userId;break;
				}

				return Model.find(Message, query).sort({ createdAt: -1 }).limit(20).bindCriteria(criteria);
			}

			static findAllLast(user) {
				var flag = arguments.length <= 1 || arguments[1] === undefined ? FLAGS.RECEIVER : arguments[1];
				var criteria = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

				var userId = db.ObjectId(user),
				    query = {};

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;break;
					case FLAGS.RECEIVER:
						query.receivers = userId;break;
				}

				return Model.find(Message, query).sort({ createdAt: -1 }).limit(20).bindCriteria(criteria);
			}

			static find(query) {
				return Model.find(Message, query);
			}

			static findOne(query) {
				return Model.findOne(Message, query);
			}

			static update() {
				return Model.update.apply(Message, arguments);
			}
		}

		return Message;
	};
})();
//# sourceMappingURL=message.js.map