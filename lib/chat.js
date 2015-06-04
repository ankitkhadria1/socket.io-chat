'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x2,
    property = _x3,
    receiver = _x4; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

(function () {
	var _ = require('underscore'),
	    util = require('util'),
	    db = require('./db'),
	    SchemaLoader = require('./schema'),
	    Model = require('./model'),
	    schemaLoader = new SchemaLoader(),
	    schema = schemaLoader.load(__dirname + '/../schema/chat.json');

	var sl = Array.prototype.slice;

	module.exports = function (options) {
		var collectionName;

		collectionName = options.collection || 'chats';

		var Chat = (function (_Model) {
			function Chat(props) {
				_classCallCheck(this, Chat);

				_get(Object.getPrototypeOf(Chat.prototype), 'constructor', this).call(this, props);

				this.setSchema(schema);

				this.on('beforeValidate', function () {
					if (!this.get('createdAt')) {
						this.set('createdAt', new Date());
					}

					this.set('type', this.determinateType());
				});
			}

			_inherits(Chat, _Model);

			_createClass(Chat, [{
				key: 'defaults',
				value: function defaults() {
					return {
						_id: null,
						name: '',
						title: '',
						creatorId: null,
						members: [],
						createdAt: null,
						type: 'private',
						systemMessages: {
							addMember: false,
							removeMember: false,
							changeTitle: false
						}
					};
				}
			}, {
				key: 'setCreator',
				value: function setCreator(id) {
					if (db.ObjectID.isValid(id)) {
						this.set('creatorId', id);
						this.addMember(id);
					}

					return this;
				}
			}, {
				key: 'setTitle',
				value: function setTitle() {
					var title = arguments[0] === undefined ? '' : arguments[0];

					this.set('title', String(title));

					return this;
				}
			}, {
				key: 'addMember',
				value: function addMember(id) {
					var index, memberId;

					if (db.ObjectID.isValid(id)) {
						index = this.indexMember(id);
						memberId = db.ObjectId(id);

						if (index === -1) {
							this.get('members').push(memberId);
							this.$addToSet('members', memberId);
						}
					}

					return this;
				}
			}, {
				key: 'removeMember',
				value: function removeMember(id) {
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
			}, {
				key: 'indexMember',
				value: function indexMember(id) {
					var index;

					id = db.ObjectID.isValid(id) ? db.ObjectID(id) : null;

					index = _.findIndex(this.get('members'), function (member) {
						return member && member.equals(id);
					});

					return index;
				}
			}, {
				key: 'hasMember',
				value: function hasMember(id) {
					return !! ~this.indexMember(id);
				}
			}, {
				key: 'collection',
				value: function collection() {
					return collectionName;
				}
			}, {
				key: 'determinateType',
				value: function determinateType() {
					if (this.get('members').length <= 2) {
						return 'private';
					}

					if (this.get('members').length > 2) {
						return 'group';
					}

					return null;
				}
			}], [{
				key: 'findById',
				value: function findById(id) {
					var chatId = db.ObjectId(id);

					return new Promise(function (resolve, reject) {
						db.getConnect(function (connect) {
							connect.collection(collectionName).findOne({ _id: chatId }, function (error, result) {
								return error ? reject(error) : result ? resolve(new Chat().set(result)) : resolve(result);
							});
						});
					});
				}
			}, {
				key: 'findByOwner',
				value: function findByOwner(id, creatorId) {
					var chatId, chatCreatorId, criteria;

					chatId = db.ObjectId(id);
					chatCreatorId = db.ObjectId(creatorId);

					criteria = { _id: chatId, creatorId: chatCreatorId };

					return new Promise(function (resolve, reject) {
						db.getConnect(function (connect) {
							connect.collection(collectionName).findOne(criteria, function (error, result) {
								return error ? reject(error) : result ? resolve(new Chat().set(result)) : resolve(result);
							});
						});
					});
				}
			}, {
				key: 'findByMember',
				value: function findByMember(id, memberId) {
					var chatId, chatMemberId, criteria;

					chatId = db.ObjectId(id);
					chatMemberId = db.ObjectId(memberId);

					criteria = { _id: chatId, members: chatMemberId };

					return new Promise(function (resolve, reject) {
						db.getConnect(function (connect) {
							connect.collection(collectionName).findOne(criteria, function (error, result) {
								return error ? reject(error) : result ? resolve(new Chat().set(result)) : resolve(result);
							});
						});
					});
				}
			}, {
				key: 'findAllByMember',
				value: function findAllByMember(memberId) {
					var chatMemberId, criteria;

					chatMemberId = db.ObjectId(memberId);

					criteria = { members: chatMemberId };

					return new Promise(function (resolve, reject) {
						db.getConnect(function (connect) {
							connect.collection(collectionName).find(criteria).toArray(function (error, result) {
								return error ? reject(error) : resolve(result);
							});
						});
					});
				}
			}]);

			return Chat;
		})(Model);

		return Chat;
	};
})();
//# sourceMappingURL=chat.js.map