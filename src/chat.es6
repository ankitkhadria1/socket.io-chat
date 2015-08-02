(function () {
	var _             = require('underscore'),
		util          = require('util'),
		debug         = require('debug')('develop'),
		db            = require('./db'),
		SchemaLoader  = require('./schema'),
		Model         = require('./model'),
		extend        = require('extend'),
		QueryResolver = require('./queryResolver'),

		schemaLoader  = new SchemaLoader();

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
					this.set('creatorId', db.ObjectId(id));
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
						this.$addToSet('members', memberId, true);
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

			incCountMessages() {
				if (typeof this.get('countMessages') !== 'undefined') {
					this.set('countMessages', this.get('countMessages'));
				}
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

			determinateType() {
				if (this.get('members').length <= 2) {
					return 'private';
				}

				if (this.get('members').length > 2) {
					return 'group';
				}

				return null;
			}

			static fill (props, isAtomic) {
				var model = new Chat();

				model.isNew = false;
				model.fill(props, !!isAtomic);

				return model;
			}

			static findById(id, criteria = {}) {
				var chatId        = db.ObjectId(id),
					query,
					queryResolver = new QueryResolver();

				query = { _id: chatId };

				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.findOne()
					.then(function (result) {
						var m = Chat.fill(result);

						return result && Chat.fill(result);
					});
			}

			static findByOwner(id, creatorId, criteria = {}) {
				var chatId,
					chatCreatorId,
					query,
					queryResolver = new QueryResolver();

				chatId        = db.ObjectId(id);
				chatCreatorId = db.ObjectId(creatorId);

				query = { _id: chatId, creatorId: chatCreatorId };
				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.findOne()
					.then(function (result) {
						return result && Chat.fill(result);
					});
			}

			static findByMember(id, memberId, criteria = {}) {
				var chatId,
					chatMemberId,
					query,
					queryResolver = new QueryResolver();

				chatId       = db.ObjectId(id);
				chatMemberId = db.ObjectId(memberId);

				query = { _id: chatId, members: chatMemberId };
				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.setQuery(query, criteria.filter)
					.findOne()
					.then(function (result) {
						return result && Chat.fill(result);
					});
			}

			static findAllByMember(memberId, count, criteria = {}) {
				var chatMemberId,
					query,
					queryResolver = new QueryResolver();

				chatMemberId = db.ObjectId(memberId);

				query = { members: chatMemberId };
				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.addQuery(query)
					.bindCriteria(criteria)
					.find();
			}

			static findEqual(chatModel) {
				var queryResolver = new QueryResolver(),
					query = {
						_id: db.ObjectId(chatModel.get('_id')),
						members: chatModel.get('members').map(db.ObjectId)
					};

				queryResolver.setSchema(schema);

				return queryResolver
					.collection(collectionName)
					.findOne(query)
					.then(function (result) {
						return result && Chat.fill(result);
					});
			}

			static find(query) {
				return Model.find(Chat, query);
			}

			static findOne(query) {
				return Model.findOne(Chat, query);
			}

			static update() {
				return Model.update.apply(Model, arguments);
			}
		}

		return Chat;
	};
}());