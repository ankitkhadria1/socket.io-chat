(function () {
	var _            = require('underscore'),
		util         = require('util'),
		debug        = require('debug')('develop'),
		db           = require('./db'),
		SchemaLoader = require('./schema'),
		Model        = require('./model'),
		extend		 = require('extend'),

		schemaLoader = new SchemaLoader();

	var sl = Array.prototype.slice;

	module.exports = function (options = {}) {
		var collectionName = 'chats',
			schema         = schemaLoader.load(__dirname + '/../schema/chat.json');

		options.collection && (collectionName = options.collection);
		options.schema && (schema = extend(true, schema, options.schema));

		class Chat extends Model {
			defaults() {
				return schemaLoader.defaults(schema);
			}

			constructor(props) {
				super(props);

				this.setSchema(schema);

				this.on('beforeValidate', function () {
					this.set('type', this.determinateType());
				});
			}

			setCreator(id) {
				if (db.ObjectID.isValid(id)) {
					this.set('creatorId', id);
					this.addMember(id);
				}

				return this;
			}

			setTitle(title = '') {
				this.set('title', String(title));

				return this;
			}

			addMember(id) {
				var index, memberId;

				if (db.ObjectID.isValid(id)) {
					index    = this.indexMember(id);
					memberId = db.ObjectId(id);

					if (index === -1) {
						this.get('members').push(memberId);
						this.$addToSet('members', memberId);
					}
				}

				return this;
			}

			removeMember(id) {
				var index = this.indexMember(id);

				if (~index) {
					if (this.get('members')[index].equals(this.get('creatorId'))) {
						return this;
					}

					this.get('members').splice(index, 1);
					this.$pull('members', db.ObjectId(id));
				}

				return this;
			}

			indexMember(id) {
				var index;

				id = db.ObjectID.isValid(id) ? db.ObjectID(id) : null;

				index = _.findIndex(this.get('members'), function (member) {
					return member && member.equals(id);
				});

				return index;
			}

			hasMember(id) {
				return !!~this.indexMember(id);
			}

			collection() {
				return collectionName;
			}

			determinateType() {
				if (this.get('members').length <= 2) {
					return 'private';
				}

				if (this.get('members').length > 2) {
					return 'group';
				}

				return null;
			}

			static findById(id) {
				var chatId = db.ObjectId(id);

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName).findOne({ _id: chatId }, function (error, result) {
							return error
								? reject(error)
								: result
								? resolve(new Chat().set(result))
								: resolve(result);
						});
					});
				});
			}

			static findByOwner(id, creatorId) {
				var chatId, chatCreatorId, criteria;

				chatId        = db.ObjectId(id);
				chatCreatorId = db.ObjectId(creatorId);

				criteria = { _id: chatId, creatorId: chatCreatorId };

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName).findOne(criteria, function (error, result) {
							return error
								? reject(error)
								: result
								? resolve(new Chat().set(result))
								: resolve(result);
						});
					});
				});
			}

			static findByMember(id, memberId) {
				var chatId, chatMemberId, criteria;

				chatId       = db.ObjectId(id);
				chatMemberId = db.ObjectId(memberId);

				criteria = { _id: chatId, members: chatMemberId };

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName).findOne(criteria, function (error, result) {
							return error
								? reject(error)
								: result
								? resolve(new Chat().set(result))
								: resolve(result);
						});
					});
				});
			}

			static findAllByMember(memberId) {
				var chatMemberId, criteria;

				chatMemberId = db.ObjectId(memberId);

				criteria = { members: chatMemberId };

				return new Promise((resolve, reject) => {
					db.getConnect(function (connect) {
						connect.collection(collectionName).find(criteria).toArray(function (error, result) {
							return error
								? reject(error)
								: resolve(result);
						});
					});
				});
			}
		}

		return Chat;
	};
}());