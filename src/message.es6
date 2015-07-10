(function () {
	"use strict";

	var _             = require('underscore'),
		util          = require('util'),
		db            = require('./db'),
		Model         = require('./model'),
		SchemaLoader  = require('./schema'),
		FLAGS         = require('./flags'),
		extend        = require('extend'),
		QueryResolver = require('./queryResolver'),

		schemaLoader  = new SchemaLoader();

	module.exports = function (options) {
		var collectionName = 'chats_messages',
			schema         = schemaLoader.load(__dirname + '/../schema/message.json');

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

			static stream(criteria = {}, streamOptions = {}) {
				var cursor;

				cursor = db.connect().collection(collectionName)
					.find(criteria)
					.stream(streamOptions);

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

			addAttachments(files = {}) {
				_.each(files, function (file) {

				})
			}

			collection() {
				return collectionName;
			}

			static findLast(dataChatId, user, count, flag = FLAGS.RECEIVER, criteria = {}) {
				var chatId        = db.ObjectId(dataChatId),
					userId        = db.ObjectId(user),
					query         = { chatId: chatId },
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

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.setSort({}, criteria.sort)
					.setLimit(criteria.limit || count)
					.setNext(criteria.next)
					.find();
			}

			static findFrom(dataChatId, dataMessageId, user, count, flag = FLAGS.RECEIVER, criteria = {}) {
				var queryResolver = new QueryResolver(),
					chatId        = db.ObjectId(dataChatId),
					messageId     = db.ObjectId(dataMessageId),
					userId        = db.ObjectId(user),
					query         = { _id: { $gt: messageId }, chatId: chatId, receivers: userId };

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;
						break;
					case FLAGS.RECEIVER:
						query.receivers = userId;
						break;
				}

				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.setSort({}, criteria.sort)
					.setLimit(criteria.limit || count)
					.find();
			}

			static findAt(dataChatId, dataMessageId, user, count, flag = FLAGS.RECEIVER, criteria = {}) {
				var queryResolver = new QueryResolver(),
					chatId        = db.ObjectId(dataChatId),
					messageId     = db.ObjectId(dataMessageId),
					userId        = db.ObjectId(user),
					query         = { _id: { $lt: messageId }, chatId: chatId };

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;
						break;
					case FLAGS.RECEIVER:
						query.receivers = userId;
						break;
				}

				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.setSort({}, criteria.sort)
					.setLimit(criteria.limit || count)
					.find();
			}

		}

		return Message;
	};
}());