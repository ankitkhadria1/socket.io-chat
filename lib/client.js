'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x15, _x16, _x17) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x15,
    property = _x16,
    receiver = _x17; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x15 = parent; _x16 = property; _x17 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

(function () {
	'use strict';

	var IO = require('socket.io'),
	    db = require('./db'),
	    Chat = require('./chat'),
	    Message = require('./message'),
	    EventEmitter = require('events').EventEmitter,
	    util = require('util'),
	    _ = require('lodash'),
	    FLAGS = require('./flags'),
	    socketMixin = require('./socket'),
	    Rooms = require('./rooms'),
	    Members = require('./members'),
	    clientSocket = require('./clientSocket'),
	    ClientError = require('./error');

	require('source-map-support').install();

	/**
  * Verifies that the contractor is to perform the action
  *
  * @param {ChatModel} chat
  * @param {ObjectId} performer
  * @param {Number} flag
  * @returns {Promise}
  */
	function validatePerformer(chat, performer, flag) {
		return new Promise(function (resolve, reject) {
			var result = false,
			    error;

			//if (typeof performer === "undefined" && typeof flag === "undefined") {
			//	return resolve();
			//}

			switch (flag) {
				case FLAGS.AUTHOR:
					result = chat.creatorId && chat.creatorId.equals(performer);
					error = new ClientError('Performer not author');
					break;
				case FLAGS.MEMBER:
					result = chat.hasMember(performer);
					error = new ClientError('Performer not member');
					break;
				case FLAGS.OTHER:
					result = true;
					break;
				default:
					result = false;
					error = new Error('Undefined flag');
			}

			return result ? resolve() : reject(error);
		});
	}

	/**
  * @class ChatClient
  */

	var ChatClient = (function (_EventEmitter) {
		/**
   * @param server Http node.js server
   * @param {object} options
   * @param {String} options.collectionChat
   * @param {String} options.collectionMessages
   * @param {object} options.EVENTS
   * @param {String} options.eventPrefix
   */

		function ChatClient(server) {
			var options = arguments[1] === undefined ? {} : arguments[1];

			_classCallCheck(this, ChatClient);

			_get(Object.getPrototypeOf(ChatClient.prototype), 'constructor', this).call(this);

			if (!server) {
				throw new Error('first argument required `http` server');
			}

			var io,
			    self = this;
			var collectionChat, collectionChatMessages, EVENTS, eventPrefix;

			collectionChat = options.collectionChat || 'chats';
			collectionChatMessages = options.collectionMessage || 'chats_messages';

			eventPrefix = options.eventPrefix || '';

			EVENTS = {
				AUTHENTICATE: 'authenticate',
				CREATE: 'create',
				LEAVE: 'leave',
				ADDMEMBER: 'addMember',
				REMOVEMEMBER: 'removeMember',
				NEWMESSAGE: 'newMessage',
				NEWSYSTEMMESSAGE: 'newSystemMessage',
				CHANGETITLE: 'changeTitle',
				FINDMESSAGESLAST: 'findMessagesLast',
				FINDMESSAGESFROM: 'findMessagesFrom',
				FINDMESSAGESAT: 'findMessagesAt',
				FINDCHATS: 'findChats',
				FINDCHAT: 'findChat'
			};

			_.assign(EVENTS, _.pick(options.EVENTS || {}, Object.keys(EVENTS)));

			EVENTS = _.mapValues(EVENTS, function (value) {
				return eventPrefix + value;
			});

			this.EVENTS = EVENTS;

			this.__validations = {};
			this.__models = {};

			this.__members = new Members();
			this.__rooms = new Rooms();

			this.__models.chat = Chat({ collection: collectionChat });
			this.__models.message = Message({ collection: collectionChatMessages });

			this.io = io = IO(server, { maxHttpBufferSize: 1000 });

			io.on('connection', function (socket) {
				self.emit('connection', socket);

				socket.on(EVENTS.AUTHENTICATE, function (data) {
					clientSocket.onAuthenticate(self, this, data);
				});

				socket.on(EVENTS.CREATE, function (data) {
					self.authorize(this) && clientSocket.onCreate(self, this, data);
				});

				socket.on(EVENTS.LEAVE, function (data) {
					self.authorize(this) && clientSocket.onLeave(self, this, data);
				});

				socket.on(EVENTS.ADDMEMBER, function (data) {
					self.authorize(this) && clientSocket.onAddMember(self, this, data);
				});

				socket.on(EVENTS.REMOVEMEMBER, function (data) {
					self.authorize(this) && clientSocket.onRemoveMember(self, this, data);
				});

				socket.on(EVENTS.NEWMESSAGE, function (data) {
					self.authorize(this) && clientSocket.onNewMessage(self, this, data);
				});

				socket.on(EVENTS.CHANGETITLE, function (data) {
					self.authorize(this) && clientSocket.onChangeTitle(self, this, data);
				});

				socket.on(EVENTS.FINDMESSAGESLAST, function (data) {
					self.authorize(this) && clientSocket.onLoadLast(self, this, data);
				});

				socket.on(EVENTS.FINDMESSAGESFROM, function (data) {
					self.authorize(this) && clientSocket.onLoadFrom(self, this, data);
				});

				socket.on(EVENTS.FINDMESSAGESAT, function (data) {
					self.authorize(this) && clientSocket.onLoadAt(self, this, data);
				});

				socket.on(EVENTS.FINDCHATS, function (data) {
					self.authorize(this) && clientSocket.onFindChats(self, this, data);
				});

				socket.on(EVENTS.FINDCHAT, function (data) {
					self.authorize(this) && clientSocket.onFindChat(self, this, data);
				});

				socket.on('error', function (error) {
					self.emit('error', this, error.event, error);
				});

				socket.on('disconnect', function () {
					socket.auth = false;

					self.__members.remove(socket.user, socket);
					self.emit('disconnect', socket);
				});

				_.extend(socket, socketMixin);
			});
		}

		_inherits(ChatClient, _EventEmitter);

		_createClass(ChatClient, [{
			key: 'eventNames',

			/**
    * Return client event names
    *
    * @returns {EVENTS}
    */
			get: function () {
				return this.EVENTS;
			},

			/**
    * Set client event names
    *
    * @param {object} events
    * @returns {void}
    */
			set: function (events) {
				_.defaults(this.EVENTS, events);
			}
		}, {
			key: 'FLAGS',

			/**
    * Return module flags
    *
    * @returns {*}
    */
			get: function () {
				return FLAGS;
			}
		}, {
			key: 'authorize',

			/**
    * Checks the authorization of the socket
    *
    * @param {Socket} socket
    * @returns {boolean}
    */
			value: function authorize(socket) {
				return !!socket.auth;
			}
		}, {
			key: 'model',

			/**
    * Return model by name (chat/message)
    *
    * var ChatModel = client.model('chat');
    * new ChatModel()
    *
    * @param {String} name
    * @returns {*}
    */
			value: function model(name) {
				return this.__models[name];
			}
		}, {
			key: 'use',

			/**
    * Middleware for socket.io
    *
    * @param {function} cb
    * @returns {ChatClient}
    */
			value: function use(cb) {
				this.io.use(cb);

				return this;
			}
		}, {
			key: 'validate',

			/**
    * Validate client event
    *
    * client.validate('addMember', function (socket, data, next) {
    *     if (data.flag !== client.FLAGS.MEMBER) {
    *       next(new Error('Not allowed'));
    *     }
    * })
    *
    *
    * @param {String} path
    * @param {function} cb
    * @returns {ChatClient}
    */
			value: function validate(path, cb) {
				path = path || 'default';
				cb = cb || function () {};

				if (!this.__validations[path]) {
					this.__validations[path] = [];
				}

				this.__validations[path].push(cb);

				return this;
			}
		}, {
			key: 'create',

			/**
    * Create new chat
    *
    * @param {object} data
    * @param {String} data.name
    * @param {String} data.title
    * @param {ObjectId} creator
    * @returns {Promise}
    */
			value: function create(data, creator) {
				var _this2 = this;

				var chat = new (this.model('chat'))(data);

				chat.setCreator(creator);

				return new Promise(function (resolve, reject) {
					_this2._validatePath(_this2.EVENTS.CREATE, { chat: chat, creator: creator, data: data }).then(function () {
						chat.save(function (error, result) {
							if (error) {
								return reject(error);
							}

							resolve(chat);
							_this2.emit(_this2.EVENTS.CREATE, chat);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'addMember',

			/**
    * Add member to chat
    *
    * @param {ChatModel} chat
    * @param {ObjectId} member
    * @param {ObjectId} performer
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function addMember(chat, member) {
				var _this3 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				chat.addMember(member);

				return new Promise(function (resolve, reject) {
					_this3._validatePath(_this3.EVENTS.ADDMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(member);

							_this3.emit(_this3.EVENTS.ADDMEMBER, chat, member);
						});
					})['catch'](function (error) {
						reject(error);
					});
				});
			}
		}, {
			key: 'removeMember',

			/**
    * Remove member from chat
    *
    * @param {ChatModel} chat
    * @param {ObjectId} member
    * @param {ObjectId} performer
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function removeMember(chat, member) {
				var _this4 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.AUTHOR : arguments[3];

				chat.removeMember(member);

				return new Promise(function (resolve, reject) {
					_this4._validatePath(_this4.EVENTS.REMOVEMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(member);

							_this4.emit(_this4.EVENTS.REMOVEMEMBER, chat, member);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'newMessage',

			/**
    * Create new message in chat
    *
    * @param {ChatModel} chat
    * @param {object} messageData
    * @param {String} messageData.text
    * @param {ObjectId} performer
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function newMessage(chat, messageData) {
				var _this5 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				var message = null;

				message = new (this.model('message'))(messageData);
				message.setChat(chat);
				message.setAuthor(performer);
				message.setReceivers(chat.members);

				return new Promise(function (resolve, reject) {
					_this5._validatePath(_this5.EVENTS.NEWMESSAGE, { chat: chat, message: message, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this5.emit(_this5.EVENTS.NEWMESSAGE, chat, message);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'changeTitle',

			/**
    * Change title in chat
    *
    * @param {ChatModel} chat
    * @param {String} title
    * @param {ObjectId} performer
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function changeTitle(chat, title) {
				var _this6 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				return new Promise(function (resolve, reject) {
					_this6._validatePath(_this6.EVENTS.CHANGETITLE, { chat: chat, title: title, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.setTitle(title).update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(chat);

							_this6.emit(_this6.EVENTS.CHANGETITLE, chat, title);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'leave',

			/**
    * Leave performer from chat
    *
    * @param {ChatModel} chat
    * @param {ObjectId} performer
    * @param flag
    * @returns {Promise}
    */
			value: function leave(chat, performer) {
				var _this7 = this;

				var flag = arguments[2] === undefined ? FLAGS.MEMBER : arguments[2];

				return new Promise(function (resolve, reject) {
					_this7._validatePath(_this7.EVENTS.LEAVE, { chat: chat, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.removeMember(performer);
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(performer);

							_this7.emit(_this7.EVENTS.LEAVE, chat, performer);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'newSystemMessage',

			/**
    * Create new system message (member add/remove chat, changeTitle, or event)
    *
    * @param {ChatModel} chat
    * @param {object} data
    * @returns {Promise}
    */
			value: function newSystemMessage(chat, data) {
				var _this8 = this;

				var message = null;

				message = new (this.model('message'))({ text: ' ' });
				message.setChat(chat);
				message.setAuthor();
				message.setReceivers(chat.members);
				message.setSystem(data);

				return new Promise(function (resolve, reject) {
					_this8._validatePath(_this8.EVENTS.NEWSYSTEMMESSAGE, { chat: chat, message: message, data: data }).then(function () {
						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this8.emit(_this8.EVENTS.NEWSYSTEMMESSAGE, chat, message);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'findLastMessages',

			/** find messages */

			/**
    * Find last message in chat
    *
    * @param {ObjectId} chatId
    * @param {ObjectId} user
    * @param {Number} count
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function findLastMessages(chatId, user, count) {
				var _this9 = this;

				var flag = arguments[3] === undefined ? FLAGS.RECEIVER : arguments[3];

				return new Promise(function (resolve, reject) {
					_this9._validatePath(_this9.EVENTS.FINDMESSAGESLAST, { chatId: chatId, user: user, count: count, flag: flag }).then(function () {
						return _this9.model('message').findLast(chatId, user, count);
					}).then(resolve)['catch'](reject);
				});
			}
		}, {
			key: 'findFromMessages',

			/**
    * Find messages in chat, start from messageId
    *
    * @param {ObjectId} chatId
    * @param {ObjectId} messageId
    * @param {ObjectId} user
    * @param {Number} count
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function findFromMessages(chatId, messageId, user, count) {
				var _this10 = this;

				var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];

				return new Promise(function (resolve, reject) {
					_this10._validatePath(_this10.EVENTS.FINDMESSAGESFROM, { chatId: chatId, messageId: messageId, user: user, count: count, flag: flag }).then(function () {
						return _this10.model('message').findFrom(chatId, messageId, user, count);
					}).then(resolve, reject)['catch'](reject);
				});
			}
		}, {
			key: 'findAtMessages',

			/**
    * Find messages in chat, to the message id
    *
    * @param {ObjectId} chatId
    * @param {ObjectId} messageId
    * @param {ObjectId} user
    * @param {Number} count
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function findAtMessages(chatId, messageId, user, count) {
				var _this11 = this;

				var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];

				return new Promise(function (resolve, reject) {
					_this11._validatePath(_this11.EVENTS.FINDMESSAGESAT, { chatId: chatId, messageId: messageId, user: user, count: count, flag: flag }).then(function () {
						return _this11.model('message').findAt(chatId, messageId, user, count);
					}).then(resolve, reject)['catch'](reject);
				});
			}
		}, {
			key: 'findChats',

			/** find chats */

			value: function findChats(user) {
				var _this12 = this;

				var count = arguments[1] === undefined ? 10 : arguments[1];

				return new Promise(function (resolve, reject) {
					_this12._validatePath(_this12.EVENTS.FINDMESSAGECHATS, { user: user, count: count }).then(function () {
						return _this12.model('chat').findAllByMember(user);
					}).then(resolve, reject)['catch'](reject);
				});
			}
		}, {
			key: 'findChatById',
			value: function findChatById(user, chatId) {
				var _this13 = this;

				return new Promise(function (resolve, reject) {
					_this13._validatePath(_this13.EVENTS.FINDMESSAGECHAT, { user: user, chatId: chatId }).then(function () {
						return _this13.model('chat').findByMember(chatId, user);
					}).then(resolve, reject)['catch'](reject);
				});
			}
		}, {
			key: '_validatePath',

			/**
    * Used in public methods before/save update models (middleware)
    *
    * @param {String} path
    * @param {Socket} socket
    * @param {object} data
    * @returns {Promise}
    * @private
    */
			value: function _validatePath(path, data) {
				var validations = this.__validations[path],
				    index = 0;

				if (!validations) {
					validations = [];
				}

				return new Promise(function (resolve, reject) {
					function next(error) {
						if (typeof error !== 'undefined') {
							return reject(error);
						}

						var validation = validations[index];

						if (validation) {
							index++;
							return validation(data, next);
						}

						if (index === validations.length) {
							return resolve();
						}
					}

					next();
				});
			}
		}, {
			key: 'destroy',

			/**
    * Close socket.io, remove all event listeners
    *
    */
			value: function destroy() {
				this.io.close();
				this.removeAllListeners();
			}
		}]);

		return ChatClient;
	})(EventEmitter);

	module.exports = ChatClient;
})();
//# sourceMappingURL=client.js.map