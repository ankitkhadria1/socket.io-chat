'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x27, _x28, _x29) { var _again = true; _function: while (_again) { desc = parent = getter = undefined; _again = false; var object = _x27,
    property = _x28,
    receiver = _x29; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x27 = parent; _x28 = property; _x29 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

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
	    Rooms = require('./rooms'),
	    Members = require('./members');

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
					result = chat.authorId && chat.authorId.equals(performer);
					error = new Error('Performer not author');
					break;
				case FLAGS.MEMBER:
					result = chat.hasMember(performer);
					error = new Error('Performer not member');
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
  * @function socketError
  * @param {String} event
  * @param {Error|String} error
  * @returns {Error}
  */
	function socketError(event, error) {
		var sError = new Error();

		sError.event = String(event);

		switch (Object.prototype.toString.call(error)) {
			case '[object Error]':
				sError.message = error.message;
				break;
			case '[object String]':
				sError.message = error;
				break;
			default:
				sError.message = String(error);
		}

		return sError;
	}

	/**
  * @function toUpper
  * @param {String} str
  * @returns {String}
  */
	function toUpper(str) {
		return str.replace(/^(\w)/, function (char) {
			return char.toUpperCase();
		});
	}

	/**
  * @function findSocket
  * @param io
  * @param id
  * @param cb
  */
	function findSocket(io, id, cb) {
		var ioSockets;

		ioSockets = io.sockets.filter(function (socket) {
			return socket.user && socket.user.equals(id);
		});

		if (ioSockets[0]) {
			cb(ioSockets[0]);
		}
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
				ENTER: 'enter',
				LEAVE: 'leave',
				ADDMEMBER: 'addMember',
				REMOVEMEMBER: 'removeMember',
				NEWMESSAGE: 'newMessage',
				NEWSYSTEMMESSAGE: 'newSystemMessage',
				CHANGETITLE: 'changeTitle',
				FINDLAST: 'findLast',
				FINDFROM: 'findFrom',
				FINDAT: 'findAt'
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
				socket.on(EVENTS.AUTHENTICATE, function (data) {
					self.onAuthenticate(this, data);
				});

				socket.on(EVENTS.CREATE, function (data) {
					self.authorize(this) && self.onCreate(this, data);
				});

				socket.on(EVENTS.ENTER, function (data) {
					self.authorize(this) && self.onEnter(this, data);
				});

				socket.on(EVENTS.LEAVE, function (data) {
					self.authorize(this) && self.onLeave(this, data);
				});

				socket.on(EVENTS.ADDMEMBER, function (data) {
					self.authorize(this) && self.onAddMember(this, data);
				});

				socket.on(EVENTS.REMOVEMEMBER, function (data) {
					self.authorize(this) && self.onRemoveMember(this, data);
				});

				socket.on(EVENTS.NEWMESSAGE, function (data) {
					self.authorize(this) && self.onNewMessage(this, data);
				});

				socket.on(EVENTS.CHANGETITLE, function (data) {
					self.authorize(this) && self.onChangeTitle(this, data);
				});

				socket.on(EVENTS.FINDLAST, function (data) {
					self.authorize(this) && self.onLoadLast(this, data);
				});

				socket.on(EVENTS.FINDFROM, function (data) {
					self.authorize(this) && self.onLoadFrom(this, data);
				});

				socket.on(EVENTS.FINDAT, function (data) {
					self.authorize(this) && self.onLoadAt(this, data);
				});

				socket.on('error', function (error) {
					self.emit('error', this, error.event, error);
				});

				socket.on('disconnect', function () {
					socket.auth = false;

					self.__members.remove(socket.user, socket);
					self.emit('disconnect', socket);
				});

				socket.emitError = function (event) {
					var data = arguments[1] === undefined ? {} : arguments[1];

					this.emit(event, { error: data });
				};

				socket.emitResult = function (event) {
					var data = arguments[1] === undefined ? {} : arguments[1];

					this.emit(event, { result: data });
				};
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
			key: 'findSockets',

			/**
    * Find sockets by id`s
    *
    * @param {ObjectId|[ObjectId]} ids
    * @returns {Array}
    */
			value: function findSockets(ids) {
				var list = [],
				    auth = this.authorize;

				if (!(ids instanceof Array)) {
					ids = [ids];
				}

				list = this.io.sockets.sockets.filter(function (socket) {
					return ids.filter(function (id) {
						return auth(socket) && socket.user.equals(id);
					}).length !== 0;
				});

				return list;
			}
		}, {
			key: 'onAuthenticate',

			/**
    * Event on socket authenticate
    *
    * @param {Socket} socket
    * @param {object} data
    */
			value: function onAuthenticate(socket) {
				var _this2 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.emit(this.EVENTS.AUTHENTICATE, socket, data, function (error) {
					if (error) {
						return socket.emitError('login', { message: error.message });
					}

					if (!_this2.authorize(socket)) {
						return;
					}

					_this2.model('chat').findAllByMember(socket.user).then(function (result) {
						if (!result) {
							return socket.emit(_this2.EVENTS.AUTHENTICATE, { error: { message: 'Invalid login/password' } });
						}

						_this2.__members.add(socket.user, socket);

						socket.emit('login', { result: { data: result } });
					})['catch'](function (error) {
						return socket.emit('error', socketError(_this2.EVENTS.AUTHENTICATE, error));
					});
				});
			}
		}, {
			key: 'onCreate',

			/**
    * Event on socket create new chat
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {String} data.name
    * @param {String} data.title
    */
			value: function onCreate(socket) {
				var _this3 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.create(data, socket.user).then(function (chat) {
					socket.emitResult(_this3.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

					console.log(_this3.__rooms.addMember);

					_this3.__rooms.addMembers(chat.get('_id'), _this3.__members.get(chat.get('members')));

					_this3.__rooms.get();

					_this3.findSockets().forEach(function (socket) {
						socket.join(String(chat.get('_id')));
						socket.emit(_this3.EVENTS.ENTER, { result: { data: chat.toJSON() } });
					});
				})['catch'](function (error) {
					return socket.emit(_this3.EVENTS.CREATE, { error: { message: error.message } });
				});
			}
		}, {
			key: 'onEnter',
			value: function onEnter(socket) {
				var data = arguments[1] === undefined ? {} : arguments[1];
			}
		}, {
			key: 'onLeave',

			/**
    * Event on socket leave from chat
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.chatId
    */
			value: function onLeave(socket) {
				var _this4 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						return socket.emit(_this4.EVENTS.LEAVE, { error: { message: 'Chat not found' } });
					}

					_this4.leave(chat, socket.user);
				})['catch'](function (error) {
					socket.emit('error', socketError(_this4.EVENTS.LEAVE, error));
				});
			}
		}, {
			key: 'onAddMember',

			/**
    * Event on add new member to chat
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.member
    * @param {ObjectId} data.chatId
    */
			value: function onAddMember(socket) {
				var _this5 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						return socket.emit(_this5.EVENTS.ADDMEMBER, { error: { message: 'Chat not found' } });
					}

					_this5.addMember(chat, data.member, socket.user).then(function (member) {
						if (chat.systemMessages && chat.systemMessages.addMember) {
							_this5.newSystemMessage(socket, {
								whoAdded: socket.user,
								whomAdded: member
							});
						}

						_this5.findSockets(chat.get('members')).forEach(function (socket) {
							socket.emit(_this5.EVENTS.ADDMEMBER, {
								message: 'The member added',
								data: chat.toJSON()
							});
						});
					})['catch'](function (error) {
						socket.emit('error', socketError(_this5.EVENTS.ADDMEMBER, error));
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this5.EVENTS.ADDMEMBER, error));
				});
			}
		}, {
			key: 'onRemoveMember',

			/**
    * Event on socket remove member from chat
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.member
    * @param {ObjectId} data.chatId
    */
			value: function onRemoveMember(socket) {
				var _this6 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						return socket.emit(_this6.EVENTS.REMOVEMEMBER, { error: { message: 'Chat not found' } });
					}

					_this6.removeMember(chat, data.member, socket.user).then(function (chat, member) {
						if (chat.systemMessages && chat.systemMessages.removeMember) {
							_this6.newSystemMessage(socket, {
								whoRemove: socket.user,
								whomRemove: member
							});
						}

						_this6.io['in'](String(chat.get('_id'))).emit(_this6.EVENTS.REMOVEMEMBER, {
							message: 'The member removed',
							data: chat.toJSON(),
							member: member
						});

						findSocket(_this6.io, member, function (socket) {
							socket.join(String(chat.get('_id')));
						});
					})['catch'](function () {
						return socket.emit('error', socketError(_this6.EVENTS.REMOVEMEMBER, error));
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this6.EVENTS.REMOVEMEMBER, error));
				});
			}
		}, {
			key: 'onNewMessage',

			/**
    * Event on socket push new message
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.chatId
    * @param {String} data.text
    */
			value: function onNewMessage(socket) {
				var _this7 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						return socket.emit(_this7.EVENTS.NEWMESSAGE, { error: { message: 'Chat not found' } });
					}

					return _this7.newMessage(chat, data, socket.user);
				}).then(function (message) {
					_this7.findSockets(message.get('receivers')).forEach(function (socket) {
						socket.emit(_this7.EVENTS.NEWMESSAGE, {
							result: {
								message: 'New message',
								data: message.toJSON()
							}
						});
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this7.EVENTS.NEWMESSAGE, error));
				});
			}
		}, {
			key: 'onLoadLast',

			/**
    * Event on socket load last messages of chat
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.chatId
    * @param {Number} data.count
    */
			value: function onLoadLast(socket) {
				var _this8 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindLast(data.chatId, socket.user, data.count).then(function (messages) {
					socket.emit(_this8.EVENTS.FINDLAST, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this8.EVENTS.FINDLAST, error));
				});
			}
		}, {
			key: 'onLoadFrom',

			/**
    * Event on socket load chat messages, starting from messageId
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.chatId
    * @param {ObjectId} data.messageId
    * @param {Number} data.count
    */
			value: function onLoadFrom(socket) {
				var _this9 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindFrom(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emit(_this9.EVENTS.FINDFROM, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this9.EVENTS.FINDFROM, error));
				});
			}
		}, {
			key: 'onLoadAt',

			/**
    * Event on socket load chat messages, to the messageId
    *
    * @param {Socket} socket
    * @param {object} data
    * @param {ObjectId} data.chatId
    * @param {ObjectId} data.messageId
    * @param {Number} data.count
    */
			value: function onLoadAt(socket) {
				var _this10 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindAt(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emit(_this10.EVENTS.FINDAT, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this10.EVENTS.FINDAT, error));
				});
			}
		}, {
			key: 'onChangeTitle',

			/**
    * Event on socket change title chat
    *
    * @param socket
    * @param data
    * @param {ObjectId} data.chatId
    * @param {String} data.title
    */
			value: function onChangeTitle(socket) {
				var _this11 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findById(data.chatId).then(function (chat) {
					if (!chat) {
						return socket.emit(_this11.EVENTS.CHANGETITLE, { error: { message: 'Chat not found' } });
					}

					var oldTitle = String(chat.get('title'));

					_this11.changeTitle(chat, data.title, socket.user).then(function (chat) {
						if (chat.systemMessages && chat.systemMessages.changeTitle) {
							_this11.newSystemMessage(chat, {
								changed: socket.user,
								oldTitle: oldTitle,
								newTitle: chat.get('title')
							});
						}

						_this11.findSockets(chat.get('members')).forEach(function (socket) {
							socket.emit(_this11.EVENTS.CHANGETITLE, {
								result: {
									message: 'Title changed',
									data: message.toJSON()
								}
							});
						});
					})['catch'](function (error) {
						socket.emit('error', socketError(_this11.EVENTS.CHANGETITLE, error));
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this11.EVENTS.CHANGETITLE, error));
				});
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
				var _this12 = this;

				var chat = new (this.model('chat'))(data);

				chat.setCreator(creator);

				return new Promise(function (resolve, reject) {
					_this12._validatePath(_this12.EVENTS.CREATE, { chat: chat, creator: creator, data: data }).then(function () {
						chat.save(function (error, result) {
							if (error) {
								return reject(error);
							}

							resolve(chat);
							_this12.emit(_this12.EVENTS.CREATE, chat);
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
				var _this13 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				chat.addMember(member);

				return new Promise(function (resolve, reject) {
					_this13._validatePath(_this13.EVENTS.ADDMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(member);

							_this13.emit(_this13.EVENTS.ADDMEMBER, chat, member);
						});
					})['catch'](reject);
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
				var _this14 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				chat.removeMember(member);

				return new Promise(function (resolve, reject) {
					_this14._validatePath(_this14.EVENTS.REMOVEMEMBER, { chat: chat, member: member, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(chat, member);

							_this14.emit(_this14.EVENTS.REMOVEMEMBER, chat, member);
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
				var _this15 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				var message = null;

				message = new (this.model('message'))(messageData);
				message.setChat(chat);
				message.setAuthor(performer);
				message.setReceivers(chat.members);

				return new Promise(function (resolve, reject) {
					_this15._validatePath(_this15.EVENTS.NEWMESSAGE, { chat: chat, message: message, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this15.emit(_this15.EVENTS.NEWMESSAGE, chat, message);
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
				var _this16 = this;

				var performer = arguments[2] === undefined ? null : arguments[2];
				var flag = arguments[3] === undefined ? FLAGS.MEMBER : arguments[3];

				return new Promise(function (resolve, reject) {
					_this16._validatePath(_this16.EVENTS.CHANGETITLE, { chat: chat, title: title, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.setTitle(title).update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(chat);

							_this16.emit(_this16.EVENTS.CHANGETITLE, chat, title);
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
				var _this17 = this;

				var flag = arguments[2] === undefined ? FLAGS.MEMBER : arguments[2];

				return new Promise(function (resolve, reject) {
					_this17._validatePath(_this17.EVENTS.LEAVE, { chat: chat, performer: performer, flag: flag }).then(function () {
						return validatePerformer(chat, performer, flag);
					}).then(function () {
						chat.removeMember(performer);
						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(chat, performer);

							_this17.emit(_this17.EVENTS.LEAVE, chat, performer);
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
				var _this18 = this;

				var message;

				message = new (this.model('message'))({ text: ' ' });
				message.setChat(chat);
				message.setSystemAuthor();
				message.setReceivers(chat.members);
				message.setSystem(data);

				return new Promise(function (resolve, reject) {
					_this18._validatePath(_this18.EVENTS.NEWSYSTEMMESSAGE, { chat: chat, message: message, data: data }).then(function () {
						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this18.emit(_this18.EVENTS.NEWSYSTEMMESSAGE, chat, message);
						});
					})['catch'](reject);
				});
			}
		}, {
			key: 'messagesFindLast',

			/**
    * Find last message in chat
    *
    * @param {ObjectId} chatId
    * @param {ObjectId} user
    * @param {Number} count
    * @param {Number} flag
    * @returns {Promise}
    */
			value: function messagesFindLast(chatId, user, count) {
				var _this19 = this;

				var flag = arguments[3] === undefined ? FLAGS.RECEIVER : arguments[3];

				return new Promise(function (resolve, reject) {
					_this19._validatePath(_this19.EVENTS.FINDLAST, { chatId: chatId, user: user, count: count, flag: flag }).then(function () {
						return _this19.model('message').findLast(chatId, user, count);
					}).then(resolve)['catch'](reject);
				});
			}
		}, {
			key: 'messagesFindFrom',

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
			value: function messagesFindFrom(chatId, messageId, user, count) {
				var _this20 = this;

				var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];

				return new Promise(function (resolve, reject) {
					_this20._validatePath(_this20.EVENTS.FINDFROM, { chatId: chatId, messageId: messageId, user: user, count: count, flag: flag }).then(function () {
						return _this20.model('message').findFrom(chatId, messageId, user, count);
					}).then(resolve, reject)['catch'](reject);
				});
			}
		}, {
			key: 'messagesFindAt',

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
			value: function messagesFindAt(chatId, messageId, user, count) {
				var _this21 = this;

				var flag = arguments[4] === undefined ? FLAGS.RECEIVER : arguments[4];

				return new Promise(function (resolve, reject) {
					_this21._validatePath(_this21.EVENTS.FINDAT, { chatId: chatId, messageId: messageId, user: user, count: count, flag: flag }).then(function () {
						return _this21.model('message').findAt(chatId, messageId, user, count);
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
			value: function _validatePath(path, socket, data) {
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
							return validation(socket, data, next);
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