'use strict';

var _createClass = (function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ('value' in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
		}
	}return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	};
})();

var _get = function get(_x15, _x16, _x17) {
	var _again = true;_function: while (_again) {
		desc = parent = getter = undefined;_again = false;var object = _x15,
		    property = _x16,
		    receiver = _x17;var desc = Object.getOwnPropertyDescriptor(object, property);if (desc === undefined) {
			var parent = Object.getPrototypeOf(object);if (parent === null) {
				return undefined;
			} else {
				_x15 = parent;_x16 = property;_x17 = receiver;_again = true;continue _function;
			}
		} else if ('value' in desc) {
			return desc.value;
		} else {
			var getter = desc.get;if (getter === undefined) {
				return undefined;
			}return getter.call(receiver);
		}
	}
};

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError('Cannot call a class as a function');
	}
}

function _inherits(subClass, superClass) {
	if (typeof superClass !== 'function' && superClass !== null) {
		throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass);
	}subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) subClass.__proto__ = superClass;
}

(function () {
	'use strict';

	var IO = require('socket.io'),
	    db = require('./db'),
	    Chat = require('./chat'),
	    Message = require('./message'),
	    EventEmitter = require('events').EventEmitter,
	    util = require('util'),
	    _ = require('lodash'),
	    sl = Array.prototype.slice;

	/**
  * @function socketError
  * @param {string} event
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
  * @param {string} str
  * @returns {string}
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
   *
   * @param server Http node.js server
   * @param options
   * @param options.collectionChat
   * @param options.collectionMessages
   * @param options.EVENTS
   * @param options.eventPrefix
   */

		function ChatClient(server) {
			var options = arguments[1] === undefined ? {} : arguments[1];

			_classCallCheck(this, ChatClient);

			_get(Object.getPrototypeOf(ChatClient.prototype), 'constructor', this).call(this);

			var io,
			    self = this;
			var collectionChat, collectionChatMessages, EVENTS, eventPrefix;

			collectionChat = options.collectionChat || 'chats';
			collectionChatMessages = options.collectionMessages || 'chats_messages';

			eventPrefix = options.eventPrefix || '';

			this.EVENTS = EVENTS = {
				AUTHENTICATE: eventPrefix + 'authenticate',
				CREATE: eventPrefix + 'create',
				ENTER: eventPrefix + 'enter',
				LEAVE: eventPrefix + 'leave',
				ADDMEMBER: eventPrefix + 'addMember',
				REMOVEMEMBER: eventPrefix + 'removeMember',
				NEWMESSAGE: eventPrefix + 'newMessage',
				NEWSYSTEMMESSAGE: eventPrefix + 'newSystemMessage',
				CHANGETITLE: eventPrefix + 'changeTitle',
				LOADLAST: eventPrefix + 'loadLast',
				LOADFROM: eventPrefix + 'loadFrom',
				LOADAT: eventPrefix + 'loadAt'
			};

			_.defaults(EVENTS, options.EVENTS || {});

			this.__validations = {};
			this.__models = {};

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

				socket.on(EVENTS.LOADLAST, function (data) {
					self.authorize(this) && self.onLoadLast(this, data);
				});

				socket.on(EVENTS.LOADFROM, function (data) {
					self.authorize(this) && self.onLoadFrom(this, data);
				});

				socket.on(EVENTS.LOADAT, function (data) {
					self.authorize(this) && self.onLoadAt(this, data);
				});

				socket.on('error', function (error) {
					self.emit('error', this, error.event, error);
				});

				socket.on('disconnect', function () {
					socket.auth = false;
					self.emit('disconnect', socket);
				});
			});
		}

		_inherits(ChatClient, _EventEmitter);

		_createClass(ChatClient, [{
			key: 'eventNames',
			get: function get() {
				return this.EVENTS;
			},
			set: function set(events) {
				_.defaults(this.EVENTS, events);

				return this;
			}
		}, {
			key: 'findSockets',
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
			value: function onAuthenticate(socket) {
				var _this2 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.emit(this.EVENTS.AUTHENTICATE, socket, data, function (error) {
					if (error) {
						return;
					}
					if (!_this2.authorize(socket)) {
						return;
					}

					_this2.model('chat').findAllByMember(socket.user).then(function (result) {
						if (!result) {
							return socket.emit(_this2.EVENTS.AUTHENTICATE, { error: { message: 'Неправильный логин/пароль' } });
						}

						socket.emit('login', { result: { data: result } });
					})['catch'](function (error) {
						return socket.emit('error', socketError(_this2.EVENTS.AUTHENTICATE, error));
					});
				});
			}
		}, {
			key: 'onCreate',
			value: function onCreate(socket) {
				var _this3 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.create(data, socket.user).then(function (chat) {
					socket.emit(_this3.EVENTS.CREATE, { result: { message: 'Чат создан', data: chat.toJSON() } });

					_this3.findSockets(chat.get('members')).forEach(function (socket) {
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
			value: function onLeave(socket) {
				var data = arguments[1] === undefined ? {} : arguments[1];
			}
		}, {
			key: 'onAddMember',
			value: function onAddMember(socket) {
				var _this4 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findByMember(data.chatId, socket.user).then(function (chat) {
					if (!chat) {
						return socket.emit(_this4.EVENTS.ADDMEMBER, { error: { message: 'Чат не найден' } });
					}

					_this4.addMember(chat, data).then(function (member) {
						if (chat.systemMessages && chat.systemMessages.addMember) {
							_this4.onNewMessage(socket, { chatId: chat.get('_id'), text: '' }, 'system');
						}

						_this4.findSockets(chat.get('members')).forEach(function (socket) {
							socket.emit(_this4.EVENTS.ADDMEMBER, {
								message: 'Пользователь добавлен',
								data: chat.toJSON()
							});
						});
					})['catch'](function (error) {
						socket.emit('error', socketError(_this4.EVENTS.ADDMEMBER, error));
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this4.EVENTS.ADDMEMBER, error));
				});
			}
		}, {
			key: 'onRemoveMember',
			value: function onRemoveMember(socket) {
				var _this5 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findByMember(data.chatId, socket.user).then(function (chat) {
					if (!chat) {
						return socket.emit(_this5.EVENTS.REMOVEMEMBER, { error: { message: 'Чат не найден' } });
					}

					_this5.removeMember(chat, data, function (error, chat, member) {
						if (error) {
							return socket.emit('error', socketError(_this5.EVENTS.REMOVEMEMBER, error));
						}

						_this5.io['in'](String(chat.get('_id'))).emit(_this5.EVENTS.REMOVEMEMBER, {
							message: 'Пользователь удален',
							data: chat.toJSON()
						});

						findSocket(_this5.io, member, function (socket) {
							socket.join(String(chat.get('_id')));
						});
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this5.EVENTS.REMOVEMEMBER, error));
				});
			}
		}, {
			key: 'onNewMessage',
			value: function onNewMessage(socket) {
				var _this6 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];
				var type = arguments[2] === undefined ? '' : arguments[2];

				this.model('chat').findByMember(data.chatId, socket.user).then(function (chat) {
					if (!chat) {
						return socket.emit(_this6.EVENTS.NEWMESSAGE, { error: { message: 'Чат не найден' } });
					}

					return _this6.newMessage(chat, data, socket.user);
				}).then(function (message) {
					_this6.findSockets(message.get('receivers')).forEach(function (socket) {
						socket.emit(_this6.EVENTS.NEWMESSAGE, {
							result: {
								message: 'Новое сообщение',
								data: message.toJSON()
							}
						});
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this6.EVENTS.NEWMESSAGE, error));
				});
			}
		}, {
			key: 'onNewSystemMessage',
			value: function onNewSystemMessage(socket) {
				var _this7 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.model('chat').findByMember(data.chatId, socket.user).then(function (chat) {
					if (!chat) {
						return false;
					}

					return _this7.newSystemMessage(chat, data, socket.user);
				}).then(function () {});
			}
		}, {
			key: 'onLoadLast',
			value: function onLoadLast(socket) {
				var _this8 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindLast(data.chatId, socket.user, data.count).then(function (messages) {
					socket.emit(_this8.EVENTS.LOADLAST, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this8.EVENTS.LOADLAST, error));
				});
			}
		}, {
			key: 'onLoadFrom',
			value: function onLoadFrom(socket) {
				var _this9 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindFrom(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emit(_this9.EVENTS.LOADFROM, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this9.EVENTS.LOADFROM, error));
				});
			}
		}, {
			key: 'onLoadAt',
			value: function onLoadAt(socket) {
				var _this10 = this;

				var data = arguments[1] === undefined ? {} : arguments[1];

				this.messagesFindAt(data.chatId, data.messageId, socket.user, data.count).then(function (messages) {
					socket.emit(_this10.EVENTS.LOADAT, {
						result: {
							chatId: data.chatId,
							data: messages
						}
					});
				})['catch'](function (error) {
					socket.emit('error', socketError(_this10.EVENTS.LOADAT, error));
				});
			}
		}, {
			key: 'onChangeTitle',
			value: function onChangeTitle(socket) {
				var data = arguments[1] === undefined ? {} : arguments[1];
			}
		}, {
			key: 'authorize',

			/**
    *
    * @param socket
    * @returns {boolean}
    */
			value: function authorize(socket) {
				return !!socket.auth;
			}
		}, {
			key: 'model',

			/**
    *
    * @param {string} name
    * @returns {*}
    */
			value: function model(name) {
				return this.__models[name];
			}
		}, {
			key: 'use',

			/**
    *
    * @param {function}    cb
    * @returns {ChatClient}
    */
			value: function use(cb) {
				this.io.use(cb);

				return this;
			}
		}, {
			key: 'validate',

			/**
    *
    * @param {string}      path
    * @param {function}    cb
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
    *
    * @param {object}      data
    * @param {ObjectId}    creator
    */
			value: function create(data, creator) {
				var _this11 = this;

				var chat = new (this.model('chat'))(data);

				chat.setCreator(creator);

				return new Promise(function (resolve, reject) {
					_this11._validatePath(_this11.EVENTS.CREATE, { chat: chat }, function (error) {
						if (error) {
							return reject(error);
						}

						chat.save(function (error, result) {
							if (error) {
								return reject(error);
							}

							resolve(chat);
							_this11.emit(_this11.EVENTS.CREATE, chat);
						});
					});
				});
			}
		}, {
			key: 'addMember',

			/**
    *
    * @param {Chat}        chat
    * @param {ObjectId}    member
    */
			value: function addMember(chat, member) {
				var _this12 = this;

				chat.addMember(member);

				return new Promise(function (resolve, reject) {
					_this12._validatePath(_this12.EVENTS.ADDMEMBER, { chat: chat, member: member }, function (error) {
						if (error) {
							return reject(error);
						}

						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(member);
							_this12.emit(_this12.EVENTS.ADDMEMBER, chat, member);
						});
					});
				});
			}
		}, {
			key: 'removeMember',

			/**
    *
    * @param {Chat}        chat
    * @param {ObjectId}    member
    */
			value: function removeMember(chat, member) {
				var _this13 = this;

				chat.removeMember(member);

				return new Promise(function (resolve, reject) {
					_this13._validatePath(_this13.EVENTS.REMOVEMEMBER, { chat: chat, member: member }, function (error) {
						if (error) {
							return reject(error);
						}

						chat.update(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(chat, member);
							_this13.emit(_this13.EVENTS.REMOVEMEMBER, chat, member);
						});
					});
				});
			}
		}, {
			key: 'newMessage',

			/**
    *
    * @param {Chat}        chat
    * @param {object}      messageData
    * @param {ObjectId}    creator
    */
			value: function newMessage(chat, messageData, creator) {
				var _this14 = this;

				var self = this,
				    message = null;

				message = new (self.model('message'))(messageData);
				message.setChat(chat);
				message.setAuthor(creator);
				message.setReceivers(chat.members);

				return new Promise(function (resolve, reject) {
					_this14._validatePath(_this14.EVENTS.NEWMESSAGE, { chat: chat, message: message }, function (error) {
						if (error) {
							return reject(error);
						}

						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this14.emit(_this14.EVENTS.NEWMESSAGE, chat, message);
						});
					});
				});
			}
		}, {
			key: 'newSystemMessage',
			value: function newSystemMessage(chat, messageData, type) {
				var _this15 = this;

				var message;

				message = new (this.model('message'))(messageData);
				message.setChat(chat);
				message.setSystemAuthor();
				message.setReceivers(chat.members);

				message.set('type', type);
				message.set('system', messageData);

				return new Promise(function (resolve, reject) {
					_this15._validatePath(_this15.EVENTS.NEWSYSTEMMESSAGE, { chat: chat, message: message }, function (error) {
						if (error) {
							return reject(error);
						}

						message.save(function (error) {
							if (error) {
								return reject(error);
							}

							resolve(message);

							_this15.emit(_this15.EVENTS.NEWSYSTEMMESSAGE, chat, message);
						});
					});
				});
			}
		}, {
			key: 'messagesFindLast',
			value: function messagesFindLast(chatId, user, count) {
				var _this16 = this;

				return new Promise(function (resolve, reject) {
					_this16._validatePath(_this16.EVENTS.LOADLAST, { chatId: chatId, user: user, count: count }, function (error) {
						if (error) {
							reject(error);
						}

						return _this16.model('message').findLast(chatId, user, count).then(resolve, reject);
					});
				});
			}
		}, {
			key: 'messagesFindFrom',
			value: function messagesFindFrom(chatId, messageId, user, count) {
				var _this17 = this;

				return new Promise(function (resolve, reject) {
					_this17._validatePath(_this17.EVENTS.LOADFROM, { chatId: chatId, messageId: messageId, user: user, count: count }, function (error) {
						if (error) {
							reject(error);
						}

						return _this17.model('message').findFrom(chatId, messageId, user, count).then(resolve, reject);
					});
				});
			}
		}, {
			key: 'messagesFindAt',
			value: function messagesFindAt(chatId, messageId, user, count) {
				var _this18 = this;

				return new Promise(function (resolve, reject) {
					_this18._validatePath(_this18.EVENTS.LOADAT, { chatId: chatId, messageId: messageId, user: user, count: count }, function (error) {
						if (error) {
							reject(error);
						}

						return _this18.model('message').findAt(chatId, messageId, user, count).then(resolve, reject);
					});
				});
			}
		}, {
			key: '_validatePath',
			value: function _validatePath(path, socket, data) {
				var validations = this.__validations[path],
				    index = 0,
				    cb = sl.call(arguments, -1)[0];

				if (!validations) {
					validations = [];
				}

				function next(error) {
					if (typeof error !== 'undefined') {
						return cb(error);
					}

					var validation = validations[index];

					if (validation) {
						index++;
						return validation(socket, data, next);
					}

					if (index === validations.length) {
						return cb();
					}
				}

				next();
			}
		}]);

		return ChatClient;
	})(EventEmitter);

	module.exports = ChatClient;
})();

//# sourceMappingURL=client-compiled.js.map