'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x20, _x21, _x22) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x20,
    property = _x21,
    receiver = _x22; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x20 = parent; _x21 = property; _x22 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _chatMessagesInc$singlePrivateChat$newChatOnGroup = require('./clientValidators');

var _IO = require('socket.io');

var _IO2 = _interopRequireDefault(_IO);

var _db = require('../db');

var _db2 = _interopRequireDefault(_db);

var _Chat = require('../chat');

var _Chat2 = _interopRequireDefault(_Chat);

var _Rooms = require('../rooms');

var _Rooms2 = _interopRequireDefault(_Rooms);

var _Members = require('../members');

var _Members2 = _interopRequireDefault(_Members);

var _Message = require('../message');

var _Message2 = _interopRequireDefault(_Message);

var _EventEmitter2 = require('events');

var _EventEmitter3 = _interopRequireDefault(_EventEmitter2);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

var _debugBase = require('debug');

var _debugBase2 = _interopRequireDefault(_debugBase);

var _import = require('underscore');

var _import2 = _interopRequireDefault(_import);

var _FLAGS = require('../flags');

var _FLAGS2 = _interopRequireDefault(_FLAGS);

var _socketMixin = require('../socket');

var _socketMixin2 = _interopRequireDefault(_socketMixin);

var _ClientSocket = require('./socket');

var _ClientSocket2 = _interopRequireDefault(_ClientSocket);

var _ClientAction = require('./action');

var _ClientAction2 = _interopRequireDefault(_ClientAction);

var _ClientError = require('../error');

var _ClientError2 = _interopRequireDefault(_ClientError);

var debug = _debugBase2['default']('develop');

require('source-map-support').install();

var Client = (function (_EventEmitter) {
	/**
  * @param server Http node.js server
  * @param {object} options
  * @param {String} options.collectionChat
  * @param {String} options.collectionMessages
  * @param {object} options.EVENTS
  * @param {String} options.eventPrefix
  */

	function Client(server) {
		var options = arguments[1] === undefined ? {} : arguments[1];

		_classCallCheck(this, Client);

		_get(Object.getPrototypeOf(Client.prototype), 'constructor', this).call(this);

		if (!server) {
			throw new Error('first argument required `http` server');
		}

		var io,
		    self = this;
		var collectionChat, collectionChatMessages, EVENTS, eventPrefix;

		collectionChat = options.collectionChat || 'chats';
		collectionChatMessages = options.collectionMessage || 'chats_messages';

		eventPrefix = options.eventPrefix || '';

		this.options = options;

		options.chatMessagesInc = options.chatMessagesInc || true;

		EVENTS = {
			AUTHENTICATE: 'authenticate',
			JOIN: 'join',
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

		_import2['default'].assign(EVENTS, _import2['default'].pick(options.EVENTS || {}, Object.keys(EVENTS)));

		EVENTS = _import2['default'].mapObject(EVENTS, function (value) {
			return eventPrefix + value;
		});

		this.EVENTS = EVENTS;

		this.__validations = {};
		this.__models = {};

		this.action = new _ClientAction2['default']();
		this.socket = new _ClientSocket2['default']();

		this.__members = this.members = new _Members2['default']();
		this.__rooms = this.rooms = new _Rooms2['default']();

		this.__models.chat = _Chat2['default']({
			collection: collectionChat,
			schema: options.schemaChat || undefined
		});

		this.__models.message = _Message2['default']({
			collection: collectionChatMessages,
			schema: options.schemaMessage || undefined
		});

		this.io = io = _IO2['default'](server, { maxHttpBufferSize: 1000 });

		io.on('connection', function (socket) {
			self.emit('connection', socket);

			socket.on(EVENTS.AUTHENTICATE, function (data) {
				self.socket.onAuthenticate(self, this, data);
			});

			socket.pipe(EVENTS.CREATE).then(request.onCreate).then(client.create).then(response.onCreate);

			chat.request.onCreate();
			chat.response.onCreate();

			client.response.Create();

			socket.on(EVENTS.CREATE, function (data) {
				self.authorize(this) && self.socket.onCreate(self, this, data);
			});

			socket.on(EVENTS.LEAVE, function (data) {
				self.authorize(this) && self.socket.onLeave(self, this, data);
			});

			socket.on(EVENTS.ADDMEMBER, function (data) {
				self.authorize(this) && self.socket.onAddMember(self, this, data);
			});

			socket.on(EVENTS.REMOVEMEMBER, function (data) {
				self.authorize(this) && self.socket.onRemoveMember(self, this, data);
			});

			socket.on(EVENTS.NEWMESSAGE, function (data) {
				self.authorize(this) && self.socket.onNewMessage(self, this, data);
			});

			socket.on(EVENTS.CHANGETITLE, function (data) {
				self.authorize(this) && self.socket.onChangeTitle(self, this, data);
			});

			socket.on(EVENTS.FINDMESSAGESLAST, function (data) {
				self.authorize(this) && self.socket.onFindMessagesLast(self, this, data);
			});

			socket.on(EVENTS.FINDMESSAGESFROM, function (data) {
				self.authorize(this) && self.socket.onFindMessagesFrom(self, this, data);
			});

			socket.on(EVENTS.FINDMESSAGESAT, function (data) {
				self.authorize(this) && self.socket.onFindMessagesAt(self, this, data);
			});

			socket.on(EVENTS.FINDCHATS, function (data) {
				self.authorize(this) && self.socket.onFindChats(self, this, data);
			});

			socket.on(EVENTS.FINDCHAT, function (data) {
				self.authorize(this) && self.socket.onFindChat(self, this, data);
			});

			socket.on('error', function (error) {
				console.log(error.stack);
				self.emit('error', this, error.event, error);
			});

			socket.on('disconnect', function () {
				socket.auth = false;

				self.members.remove(socket.user, socket);
				self.emit('disconnect', socket);
			});

			_import2['default'].extend(socket, _socketMixin2['default']);
		});

		if (this.options.chatMessagesInc) {
			this.on(this.EVENTS.NEWMESSAGE, _chatMessagesInc$singlePrivateChat$newChatOnGroup.chatMessagesInc.bind(this));
		}

		if (this.options.singlePrivateChat) {
			this.validate(this.EVENTS.CREATE, _chatMessagesInc$singlePrivateChat$newChatOnGroup.singlePrivateChat.bind(this));
		}

		if (this.options.newChatOnGroup) {
			this.validate(this.EVENTS.ADDMEMBER, _chatMessagesInc$singlePrivateChat$newChatOnGroup.newChatOnGroup.bind(this));
		}
	}

	_inherits(Client, _EventEmitter);

	_createClass(Client, [{
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
			_import2['default'].defaults(this.EVENTS, events);
		}
	}, {
		key: 'FLAGS',

		/**
   * Return module flags
   *
   * @returns {*}
   */
		get: function () {
			return _FLAGS2['default'];
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

			chat.members = chat.members && chat.members.map(function (id) {
				return _db2['default'].ObjectId(id);
			}).filter(function (id) {
				return !!id;
			});

			chat.setCreator(_db2['default'].ObjectId(creator));

			return new Promise(function (resolve, reject) {
				_this2._validatePath(_this2.EVENTS.CREATE, { chat: chat, creator: creator, data: data }).then(function (post) {
					post.chat.save(function (error, result) {
						if (error) {
							return reject(error);
						}

						resolve(post.chat);

						_this2.emit(_this2.EVENTS.CREATE, post.chat);
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
			var flag = arguments[3] === undefined ? _FLAGS2['default'].MEMBER : arguments[3];

			chat.addMember(member);

			return new Promise(function (resolve, reject) {
				_this3._validatePath(_this3.EVENTS.ADDMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
					return _this3.action.validate(flag, { chat: chat, performer: performer });
				}).then(function () {
					chat.save(function (error) {
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
			var flag = arguments[3] === undefined ? _FLAGS2['default'].AUTHOR : arguments[3];

			chat.removeMember(member);

			return new Promise(function (resolve, reject) {
				_this4._validatePath(_this4.EVENTS.REMOVEMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
					return _this4.action.validate(flag, { chat: chat, performer: performer });
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
			var flag = arguments[3] === undefined ? _FLAGS2['default'].MEMBER : arguments[3];

			var message = null;

			message = new (this.model('message'))(messageData);
			message.setChat(chat);
			message.setAuthor(performer);
			message.setReceivers(chat.members);
			message.addAttachments(messageData.files);

			return new Promise(function (resolve, reject) {
				_this5._validatePath(_this5.EVENTS.NEWMESSAGE, { chat: chat, message: message, performer: performer, flag: flag }).then(function (post) {
					return _this5.action.validate(flag, { chat: post.chat, performer: post.performer }).then(function () {
						post.message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(post.message);

							_this5.emit(_this5.EVENTS.NEWMESSAGE, { chat: post.chat, message: post.message });
						});
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
			var flag = arguments[3] === undefined ? _FLAGS2['default'].MEMBER : arguments[3];

			return new Promise(function (resolve, reject) {
				_this6._validatePath(_this6.EVENTS.CHANGETITLE, { chat: chat, title: title, performer: performer, flag: flag }).then(function () {
					return _this6.action.validate(flag, { chat: chat, performer: performer });
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

			var flag = arguments[2] === undefined ? _FLAGS2['default'].MEMBER : arguments[2];

			return new Promise(function (resolve, reject) {
				_this7._validatePath(_this7.EVENTS.LEAVE, { chat: chat, performer: performer, flag: flag }).then(function () {
					return _this7.action.validate(flag, { chat: chat, performer: performer });
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
			message.setSystemAuthor();
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
   * @param {Number} limit
   * @param {Number} flag
   * @param {Object} criteria
   * @returns {Promise}
   */
		value: function findLastMessages(chatId, user, limit) {
			var _this9 = this;

			var flag = arguments[3] === undefined ? _FLAGS2['default'].RECEIVER : arguments[3];
			var criteria = arguments[4] === undefined ? {} : arguments[4];

			return new Promise(function (resolve, reject) {
				_this9._validatePath(_this9.EVENTS.FINDMESSAGESLAST, { chatId: chatId, user: user, limit: limit, flag: flag, criteria: criteria }).then(function () {
					return _this9.model('message').findLast(chatId, user, limit, criteria);
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
   * @param {Number} limit
   * @param {Number} flag
   * @param {Object} criteria
   * @returns {Promise}
   */
		value: function findFromMessages(chatId, messageId, user, limit) {
			var _this10 = this;

			var flag = arguments[4] === undefined ? _FLAGS2['default'].RECEIVER : arguments[4];
			var criteria = arguments[5] === undefined ? {} : arguments[5];

			return new Promise(function (resolve, reject) {
				_this10._validatePath(_this10.EVENTS.FINDMESSAGESFROM, { chatId: chatId, messageId: messageId, user: user, limit: limit, flag: flag, criteria: criteria }).then(function () {
					return _this10.model('message').findFrom(chatId, messageId, user, limit, criteria);
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
   * @param {Number} limit
   * @param {Number} flag
   * @param {Object} criteria
   * @returns {Promise}
   */
		value: function findAtMessages(chatId, messageId, user, limit) {
			var _this11 = this;

			var flag = arguments[4] === undefined ? _FLAGS2['default'].RECEIVER : arguments[4];
			var criteria = arguments[5] === undefined ? {} : arguments[5];

			return new Promise(function (resolve, reject) {
				_this11._validatePath(_this11.EVENTS.FINDMESSAGESAT, { chatId: chatId, messageId: messageId, user: user, limit: limit, flag: flag, criteria: criteria }).then(function () {
					return _this11.model('message').findAt(chatId, messageId, user, limit, criteria);
				}).then(resolve, reject)['catch'](reject);
			});
		}
	}, {
		key: 'findChats',

		/** find chats */
		value: function findChats(user) {
			var _this12 = this;

			var limit = arguments[1] === undefined ? 10 : arguments[1];
			var criteria = arguments[2] === undefined ? {} : arguments[2];

			return new Promise(function (resolve, reject) {
				_this12._validatePath(_this12.EVENTS.FINDCHATS, { user: user, limit: limit, criteria: criteria }).then(function () {
					return _this12.model('chat').findAllByMember(user, limit, criteria);
				}).then(resolve, reject)['catch'](reject);
			});
		}
	}, {
		key: 'findChatById',

		/** find one chat */
		value: function findChatById(user, chatId) {
			var _this13 = this;

			var criteria = arguments[2] === undefined ? {} : arguments[2];

			return new Promise(function (resolve, reject) {
				_this13._validatePath(_this13.EVENTS.FINDCHAT, { user: user, chatId: chatId, criteria: criteria }).then(function () {
					return _this13.model('chat').findByMember(chatId, user, criteria);
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
						return resolve(data);
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

	return Client;
})(_EventEmitter3['default']);

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=client.js.map