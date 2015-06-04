(function () {
	"use strict";

	var IO           = require('socket.io'),
		db           = require('./db'),
		Chat         = require('./chat'),
		Message      = require('./message'),
		EventEmitter = require('events').EventEmitter,
		util         = require('util'),
		_            = require('underscore'),
		FLAGS        = require('./flags'),
		socketMixin  = require('./socket'),
		Rooms        = require('./rooms'),
		Members      = require('./members'),
		ClientSocket = require('./clientSocket'),
		ClientAction = require('./clientAction'),
		ClientError  = require('./error');

	require('source-map-support').install();

	/**
	 * @class ChatClient
	 */
	class ChatClient extends EventEmitter {
		/**
		 * @param server Http node.js server
		 * @param {object} options
		 * @param {String} options.collectionChat
		 * @param {String} options.collectionMessages
		 * @param {object} options.EVENTS
		 * @param {String} options.eventPrefix
		 */
		constructor(server, options = {}) {
			super();

			if (!server) {
				throw new Error('first argument required `http` server');
			}

			var io, self = this;
			var collectionChat, collectionChatMessages, EVENTS, eventPrefix;

			collectionChat         = options.collectionChat || 'chats';
			collectionChatMessages = options.collectionMessage || 'chats_messages';

			eventPrefix = options.eventPrefix || '';

			EVENTS = {
				AUTHENTICATE:     'authenticate',
				CREATE:           'create',
				LEAVE:            'leave',
				ADDMEMBER:        'addMember',
				REMOVEMEMBER:     'removeMember',
				NEWMESSAGE:       'newMessage',
				NEWSYSTEMMESSAGE: 'newSystemMessage',
				CHANGETITLE:      'changeTitle',
				FINDMESSAGESLAST: 'findMessagesLast',
				FINDMESSAGESFROM: 'findMessagesFrom',
				FINDMESSAGESAT:   'findMessagesAt',
				FINDCHATS:        'findChats',
				FINDCHAT:         'findChat'
			};

			_.assign(EVENTS, _.pick(options.EVENTS || {}, Object.keys(EVENTS)));

			EVENTS = _.mapObject(EVENTS, function (value) {
				return eventPrefix + value;
			});

			this.EVENTS = EVENTS;

			this.__validations = {};
			this.__models      = {};

			this.action = new ClientAction();
			this.socket = new ClientSocket();

			this.__members = new Members();
			this.__rooms   = new Rooms();

			this.__models.chat    = Chat({ collection: collectionChat });
			this.__models.message = Message({ collection: collectionChatMessages });

			this.io = io = IO(server, { maxHttpBufferSize: 1000 });

			io.on('connection', function (socket) {
				self.emit('connection', socket);

				socket.on(EVENTS.AUTHENTICATE, function (data) {
					self.socket.onAuthenticate(self, this, data);
				});

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
					console.log(error);
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

		/**
		 * Return client event names
		 *
		 * @returns {EVENTS}
		 */
		get eventNames() {
			return this.EVENTS;
		}

		/**
		 * Set client event names
		 *
		 * @param {object} events
		 * @returns {void}
		 */
		set eventNames(events) {
			_.defaults(this.EVENTS, events);
		}

		/**
		 * Return module flags
		 *
		 * @returns {*}
		 */
		get FLAGS() {
			return FLAGS;
		}

		/**
		 * Checks the authorization of the socket
		 *
		 * @param {Socket} socket
		 * @returns {boolean}
		 */
		authorize(socket) {
			return !!socket.auth;
		}

		/**
		 * Return model by name (chat/message)
		 *
		 * var ChatModel = client.model('chat');
		 * new ChatModel()
		 *
		 * @param {String} name
		 * @returns {*}
		 */
		model(name) {
			return this.__models[name];
		}

		/**
		 * Middleware for socket.io
		 *
		 * @param {function} cb
		 * @returns {ChatClient}
		 */
		use(cb) {
			this.io.use(cb);

			return this;
		}

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
		validate(path, cb) {
			path = path || 'default';
			cb   = cb || function () {
				};

			if (!this.__validations[path]) {
				this.__validations[path] = [];
			}

			this.__validations[path].push(cb);

			return this;
		}

		/**
		 * Create new chat
		 *
		 * @param {object} data
		 * @param {String} data.name
		 * @param {String} data.title
		 * @param {ObjectId} creator
		 * @returns {Promise}
		 */
		create(data, creator) {
			var chat = new (this.model('chat'))(data);

			chat.setCreator(creator);

			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.CREATE, { chat, creator, data })
					.then(() => {
						chat.save((error, result) => {
							if (error) {
								return reject(error);
							}

							resolve(chat);
							this.emit(this.EVENTS.CREATE, chat);
						});
					})
					.catch(reject);
			});
		}

		/**
		 * Add member to chat
		 *
		 * @param {ChatModel} chat
		 * @param {ObjectId} member
		 * @param {ObjectId} performer
		 * @param {Number} flag
		 * @returns {Promise}
		 */
		addMember(chat, member, performer = null, flag = FLAGS.MEMBER) {
			chat.addMember(member);

			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.ADDMEMBER, { chat, member, performer, flag })
					.then(() => {
						return this.action.validate(flag, { chat, performer });
					})
					.then(() => {
						chat.update((error) => {
							if (error) {
								return reject(error);
							}

							resolve(member);

							this.emit(this.EVENTS.ADDMEMBER, chat, member);
						});
					})
					.catch(function (error) {
						reject(error);
					});
			});
		}

		/**
		 * Remove member from chat
		 *
		 * @param {ChatModel} chat
		 * @param {ObjectId} member
		 * @param {ObjectId} performer
		 * @param {Number} flag
		 * @returns {Promise}
		 */
		removeMember(chat, member, performer = null, flag = FLAGS.AUTHOR) {
			chat.removeMember(member);

			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.REMOVEMEMBER, { chat, member, performer, flag })
					.then(() => {
						return this.action.validate(flag, { chat, performer });
					})
					.then(() => {
						chat.update((error) => {
							if (error) {
								return reject(error);
							}

							resolve(member);

							this.emit(this.EVENTS.REMOVEMEMBER, chat, member);
						});
					})
					.catch(reject);
			});
		}

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
		newMessage(chat, messageData, performer = null, flag = FLAGS.MEMBER) {
			var message = null;

			message = new (this.model('message'))(messageData);
			message.setChat(chat);
			message.setAuthor(performer);
			message.setReceivers(chat.members);

			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.NEWMESSAGE, { chat, message, performer, flag })
					.then(() => {
						return this.action.validate(flag, { chat, performer });
					})
					.then(() => {
						message.save((error) => {
							if (error) {
								return reject(error);
							}

							resolve(message);

							this.emit(this.EVENTS.NEWMESSAGE, chat, message);
						});
					})
					.catch(reject);
			});
		}

		/**
		 * Change title in chat
		 *
		 * @param {ChatModel} chat
		 * @param {String} title
		 * @param {ObjectId} performer
		 * @param {Number} flag
		 * @returns {Promise}
		 */
		changeTitle(chat, title, performer = null, flag = FLAGS.MEMBER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.CHANGETITLE, { chat, title, performer, flag })
					.then(() => {
						return this.action.validate(flag, { chat, performer });
					})
					.then(() => {
						chat.setTitle(title)
							.update((error) => {
								if (error) {
									return reject(error);
								}

								resolve(chat);

								this.emit(this.EVENTS.CHANGETITLE, chat, title);
							});
					})
					.catch(reject);
			});
		}

		/**
		 * Leave performer from chat
		 *
		 * @param {ChatModel} chat
		 * @param {ObjectId} performer
		 * @param flag
		 * @returns {Promise}
		 */
		leave(chat, performer, flag = FLAGS.MEMBER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.LEAVE, { chat, performer, flag })
					.then(() => {
						return this.action.validate(flag, { chat, performer });
					})
					.then(() => {
						chat.removeMember(performer);
						chat.update((error) => {
							if (error) {
								return reject(error);
							}

							resolve(performer);

							this.emit(this.EVENTS.LEAVE, chat, performer);
						})
					})
					.catch(reject);
			});
		}

		/**
		 * Create new system message (member add/remove chat, changeTitle, or event)
		 *
		 * @param {ChatModel} chat
		 * @param {object} data
		 * @returns {Promise}
		 */
		newSystemMessage(chat, data) {
			var message = null;

			message = new (this.model('message'))({ text: ' ' });
			message.setChat(chat);
			message.setSystemAuthor();
			message.setReceivers(chat.members);
			message.setSystem(data);

			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.NEWSYSTEMMESSAGE, { chat, message, data })
					.then(() => {
						message.save((error) => {
							if (error) {
								return reject(error);
							}

							resolve(message);

							this.emit(this.EVENTS.NEWSYSTEMMESSAGE, chat, message);
						});
					})
					.catch(reject);
			});
		}

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
		findLastMessages(chatId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDMESSAGESLAST, { chatId, user, count, flag })
					.then(() => {
						return this.model('message').findLast(chatId, user, count);
					})
					.then(resolve)
					.catch(reject);
			});
		}

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
		findFromMessages(chatId, messageId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDMESSAGESFROM, { chatId, messageId, user, count, flag })
					.then(() => {
						return this.model('message').findFrom(chatId, messageId, user, count)
					})
					.then(resolve, reject)
					.catch(reject);
			});
		}

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
		findAtMessages(chatId, messageId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDMESSAGESAT, { chatId, messageId, user, count, flag })
					.then(() => {
						return this.model('message').findAt(chatId, messageId, user, count)
					})
					.then(resolve, reject)
					.catch(reject);
			});
		}

		/** find chats */

		findChats(user, count = 10) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDMESSAGECHATS, { user, count })
					.then(() => {
						return this.model('chat').findAllByMember(user)
					})
					.then(resolve, reject)
					.catch(reject);
			});
		}

		findChatById(user, chatId) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDMESSAGECHAT, { user, chatId })
					.then(() => {
						return this.model('chat').findByMember(chatId, user)
					})
					.then(resolve, reject)
					.catch(reject);
			});
		}

		/**
		 * Used in public methods before/save update models (middleware)
		 *
		 * @param {String} path
		 * @param {Socket} socket
		 * @param {object} data
		 * @returns {Promise}
		 * @private
		 */
		_validatePath(path, data) {
			var validations = this.__validations[path],
				index       = 0;

			if (!validations) {
				validations = [];
			}

			return new Promise((resolve, reject) => {
				function next(error) {
					if (typeof error !== "undefined") {
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

		/**
		 * Close socket.io, remove all event listeners
		 *
		 */
		destroy() {
			this.io.close();
			this.removeAllListeners();
		}
	}

	module.exports = ChatClient;
}());