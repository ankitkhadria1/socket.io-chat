(function () {
	"use strict";

	var _            = require('lodash'),
	    util         = require('util'),
	    db           = require('./db'),
	    Model        = require('./model'),
	    SchemaLoader = require('./schema'),
	    FLAGS        = require('./flags'),

	    schemaLoader = new SchemaLoader(),
	    schema       = schemaLoader.load(__dirname + '/../schema/message.json');

	module.exports = function (options) {
		var collectionName;

		collectionName = options.collection || 'chats_messages';

		class Message extends Model {
			defaults() {
				return {
					_id:         null,
					chatId:      null,
					text:        '',
					createdAt:   null,
					authorId:    null,
					receivers:   [],
					attachments: [],
					type:        'user',
					system:      {}
				};
			}

			static stream(criteria = {}, streamOptions = {}) {
				var cursor;

				cursor = db.connect().collection(collectionName)
					.find(criteria)
					.stream(streamOptions);

				return cursor;
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

			collection() {
				return collectionName;
			}

			static findLast(dataChatId, user, count, flag = FLAGS.RECEIVER) {
				var chatId = db.ObjectId(dataChatId),
				    userId = db.ObjectId(user),
				    limit  = Math.abs(count) > 50 ? 50 : (Math.abs(count) || 10),
				    query  = { chatId: chatId };

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;
						break;
					case FLAGS.RECEIVER:
						query.receivers = userId;
						break;
				}

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName)
							.find(query)
							.limit(limit)
							.toArray(function (error, result) {
								if (error) {
									return reject(error);
								}

								resolve(result);
							})
					});
				});
			}

			static findFrom(dataChatId, dataMessageId, user, count, flag = FLAGS.RECEIVER) {
				var chatId    = db.ObjectId(dataChatId),
				    messageId = db.ObjectId(dataMessageId),
				    userId    = db.ObjectId(user),
				    limit     = Math.abs(count) > 50 ? 50 : (Math.abs(count) || 10),
				    query     = { _id: { $gt: messageId }, chatId: chatId, receivers: userId };

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;
						break;
					case FLAGS.RECEIVER:
						query.receivers = userId;
						break;
				}

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName)
							.find(query)
							.limit(limit)
							.toArray(function (error, result) {
								if (error) {
									return reject(error);
								}

								resolve(result);
							})
					});
				});
			}

			static findAt(dataChatId, dataMessageId, user, count, flag = FLAGS.RECEIVER) {
				var chatId    = db.ObjectId(dataChatId),
				    messageId = db.ObjectId(dataMessageId),
				    userId    = db.ObjectId(user),
				    limit     = Math.abs(count) > 50 ? 50 : (Math.abs(count) || 10),
				    query     = { _id: { $lt: messageId }, chatId: chatId };

				switch (flag) {
					case FLAGS.AUTHOR:
						query.authorId = userId;
						break;
					case FLAGS.RECEIVER:
						query.receivers = userId;
						break;
				}

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName)
							.find(query)
							.limit(limit)
							.toArray(function (error, result) {
								if (error) {
									return reject(error);
								}

								resolve(result);
							})
					});
				});
			}

		}

		return Message;
	};
}());