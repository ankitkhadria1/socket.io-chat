(function () {
	"use strict";

	var IO           = require('socket.io'),
		db           = require('./db'),
		Chat         = require('./chat'),
		Message      = require('./message'),
		EventEmitter = require('events').EventEmitter,
		util         = require('util'),
		_            = require('lodash'),
		FLAGS        = require('./flags'),
		socketMixin  = require('./socket'),
		Rooms        = require('./rooms'),
		Members      = require('./members'),
		ClientError  = require('./error');

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
			var result = false, error;

			//if (typeof performer === "undefined" && typeof flag === "undefined") {
			//	return resolve();
			//}

			switch (flag) {
				case FLAGS.AUTHOR:
					result = chat.creatorId && chat.creatorId.equals(performer);
					error  = new ClientError('Performer not author');
					break;
				case FLAGS.MEMBER:
					result = chat.hasMember(performer);
					console.log('hasMember', performer, result);
					error  = new ClientError('Performer not member');
					break;
				case FLAGS.OTHER:
					result = true;
					break;
				default:
					result = false;
					error  = new Error('Undefined flag');
			}

			return result ? resolve() : reject(error);
		});
	}

	function catchErrorMessage(error) {
		switch (error.type) {
			case 'client':
				return error.message;
			default:
				return 'Unknown error';
		}
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
				ENTER:            'enter',
				LEAVE:            'leave',
				ADDMEMBER:        'addMember',
				REMOVEMEMBER:     'removeMember',
				NEWMESSAGE:       'newMessage',
				NEWSYSTEMMESSAGE: 'newSystemMessage',
				CHANGETITLE:      'changeTitle',
				FINDLAST:         'findLast',
				FINDFROM:         'findFrom',
				FINDAT:           'findAt'
			};

			_.assign(EVENTS, _.pick(options.EVENTS || {}, Object.keys(EVENTS)));

			EVENTS = _.mapValues(EVENTS, function (value) {
				return eventPrefix + value;
			});

			this.EVENTS = EVENTS;

			this.__validations = {};
			this.__models      = {};

			this.__members = new Members();
			this.__rooms   = new Rooms();

			this.__models.chat    = Chat({ collection: collectionChat });
			this.__models.message = Message({ collection: collectionChatMessages });

			this.io = io = IO(server, { maxHttpBufferSize: 1000 });

			io.on('connection', function (socket) {
				self.emit('connection', socket);

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
		 * Find sockets by id`s
		 *
		 * @param {ObjectId|[ObjectId]} ids
		 * @returns {Array}
		 */
		findSockets(ids) {
			var list = [], auth = this.authorize;

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

		/**
		 * Event on socket authenticate
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 */
		onAuthenticate(socket, data = {}) {
			this.emit(this.EVENTS.AUTHENTICATE, socket, data, (error) => {
				if (error) {
					return socket.emitError('login', { message: error.message || error });
				}

				if (!this.authorize(socket)) {
					return;
				}

				this.__members.add(socket.user, socket);

				socket.emitResult('login', { user: socket.user, data: [] });
			});
		}

		/**
		 * Event on socket create new chat
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {String} data.name
		 * @param {String} data.title
		 */
		onCreate(socket, data = {}) {
			this.create(data, socket.user)
				.then((chat) => {
					socket.emitResult(this.EVENTS.CREATE, { message: 'Chat created', data: chat.toJSON() });

					this.__rooms.addMembers(
						chat.get('_id'),
						this.__members.get(chat.get('members'))
					);

					this.__rooms.get();

					this.findSockets()
						.forEach((socket) => {
							socket.join(String(chat.get('_id')));
							socket.emit(this.EVENTS.ENTER, { result: { data: chat.toJSON() } });
						});

				})
				.catch((error) => {
					return socket.emit(this.EVENTS.CREATE, { error: { message: error.message } });
				});
		}

		onEnter(socket, data = {}) {

		}

		/**
		 * Event on socket leave from chat
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.chatId
		 */
		onLeave(socket, data = {}) {
			var chat;

			this.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					console.log('before', chat.get('_id'), chat.get('members'));

					return this.leave(chat, socket.user)
				})
				.then((member) => {
					this.__rooms.removeMember(chat.get('_id'), member);
					this.__members.get(chat.get('members').concat(member))
						.forEach((socket) => {
							socket.emitResult(this.EVENTS.LEAVE, {
								message: 'The member leaved', data: member
							});
						});
				})
				.catch((error) => {
					console.log(error.message);
					socket.emitError(this.EVENTS.LEAVE, { message: catchErrorMessage(error) });
				});
		}

		/**
		 * Event on add new member to chat
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.member
		 * @param {ObjectId} data.chatId
		 */
		onAddMember(socket, data = {}) {
			var chat, countBefore, countAfter;

			this.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return this.addMember(chat, data.member, socket.user)
				})
				.then((member) => {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}

					if (chat.systemMessages && chat.systemMessages.addMember) {
						this.newSystemMessage(socket, {
							whoAdded: socket.user, whomAdded: member
						})
					}

					this.__rooms.addMembers(chat.get('_id'), member);

					this.__members.get(chat.get('members'))
						.forEach((socket) => {
							socket.emitResult(this.EVENTS.ADDMEMBER, {
								message: 'The member added', data: member
							});
						});
				})
				.catch((error) => {
					socket.emitError(this.EVENTS.ADDMEMBER, { message: catchErrorMessage(error) });
				});
		}

		/**
		 * Event on socket remove member from chat
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.member
		 * @param {ObjectId} data.chatId
		 */
		onRemoveMember(socket, data = {}) {
			var chat, countBefore, countAfter;

			this.model('chat').findById(data.chatId)
				.then((result) => {
					if (!(chat = result)) {
						throw new ClientError('Chat not found');
					}

					countBefore = chat.get('members').length;

					return this.removeMember(chat, data.member, socket.user)
				})
				.then((member) => {
					countAfter = chat.get('members').length;

					if (countBefore === countAfter) {
						return;
					}

					if (chat.systemMessages && chat.systemMessages.removeMember) {
						this.newSystemMessage(socket, {
							whoRemove:  socket.user,
							whomRemove: member
						})
					}

					this.__rooms.removeMember(chat.get('_id'), member);

					this.__members.get(chat.get('members').concat(member))
						.forEach((socket) => {
							socket.emitResult(this.EVENTS.REMOVEMEMBER, {
								message: 'The member removed', data: member
							});
						});
				})
				.catch((error) => {
					socket.emitError(this.EVENTS.REMOVEMEMBER, { message: catchErrorMessage(error) });
				});
		}

		/**
		 * Event on socket push new message
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.chatId
		 * @param {String} data.text
		 */
		onNewMessage(socket, data = {}) {
			this.model('chat').findById(data.chatId)
				.then((chat) => {
					if (!chat) {
						return socket.emit(this.EVENTS.NEWMESSAGE, { error: { message: 'Chat not found' } });
					}

					return this.newMessage(chat, data, socket.user);
				})
				.then((message) => {
					this.findSockets(message.get('receivers'))
						.forEach((socket) => {
							socket.emit(this.EVENTS.NEWMESSAGE, {
								result: {
									message: 'New message',
									data:    message.toJSON()
								}
							});
						});
				})
				.catch((error) => {
					socket.emit('error', socketError(this.EVENTS.NEWMESSAGE, error));
				});
		}

		/**
		 * Event on socket load last messages of chat
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.chatId
		 * @param {Number} data.count
		 */
		onLoadLast(socket, data = {}) {
			this.messagesFindLast(data.chatId, socket.user, data.count)
				.then((messages) => {
					socket.emit(this.EVENTS.FINDLAST, {
						result: {
							chatId: data.chatId,
							data:   messages
						}
					})
				})
				.catch((error) => {
					socket.emit('error', socketError(this.EVENTS.FINDLAST, error));
				});
		}

		/**
		 * Event on socket load chat messages, starting from messageId
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.chatId
		 * @param {ObjectId} data.messageId
		 * @param {Number} data.count
		 */
		onLoadFrom(socket, data = {}) {
			this.messagesFindFrom(data.chatId, data.messageId, socket.user, data.count)
				.then((messages) => {
					socket.emit(this.EVENTS.FINDFROM, {
						result: {
							chatId: data.chatId,
							data:   messages
						}
					});
				})
				.catch((error) => {
					socket.emit('error', socketError(this.EVENTS.FINDFROM, error));
				});
		}

		/**
		 * Event on socket load chat messages, to the messageId
		 *
		 * @param {Socket} socket
		 * @param {object} data
		 * @param {ObjectId} data.chatId
		 * @param {ObjectId} data.messageId
		 * @param {Number} data.count
		 */
		onLoadAt(socket, data = {}) {
			this.messagesFindAt(data.chatId, data.messageId, socket.user, data.count)
				.then((messages) => {
					socket.emit(this.EVENTS.FINDAT, {
						result: {
							chatId: data.chatId,
							data:   messages
						}
					});
				})
				.catch((error) => {
					socket.emit('error', socketError(this.EVENTS.FINDAT, error));
				});
		}

		/**
		 * Event on socket change title chat
		 *
		 * @param socket
		 * @param data
		 * @param {ObjectId} data.chatId
		 * @param {String} data.title
		 */
		onChangeTitle(socket, data = {}) {
			this.model('chat').findById(data.chatId)
				.then((chat) => {
					if (!chat) {
						return socket.emit(this.EVENTS.CHANGETITLE, { error: { message: 'Chat not found' } });
					}

					var oldTitle = String(chat.get('title'));

					this.changeTitle(chat, data.title, socket.user)
						.then((chat) => {
							if (chat.systemMessages && chat.systemMessages.changeTitle) {
								this.newSystemMessage(chat, {
									changed:  socket.user,
									oldTitle: oldTitle,
									newTitle: chat.get('title')
								})
							}

							this.findSockets(chat.get('members'))
								.forEach((socket) => {
									socket.emit(this.EVENTS.CHANGETITLE, {
										result: {
											message: 'Title changed',
											data:    message.toJSON()
										}
									});
								});
						})
						.catch((error) => {
							socket.emit('error', socketError(this.EVENTS.CHANGETITLE, error));
						});
				})
				.catch((error) => {
					socket.emit('error', socketError(this.EVENTS.CHANGETITLE, error));
				});
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
						return validatePerformer(chat, performer, flag);
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
					.then(function () {
						return validatePerformer(chat, performer, flag);
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
					.then(function () {
						return validatePerformer(chat, performer, flag);
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
					.then(function () {
						return validatePerformer(chat, performer, flag)
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
					.then(function () {
						return validatePerformer(chat, performer, flag)
					})
					.then(() => {
						//chat.removeMember(performer);
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
			var message;

			message = new (this.model('message'))({ text: " " });
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

		/**
		 * Find last message in chat
		 *
		 * @param {ObjectId} chatId
		 * @param {ObjectId} user
		 * @param {Number} count
		 * @param {Number} flag
		 * @returns {Promise}
		 */
		messagesFindLast(chatId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDLAST, { chatId, user, count, flag })
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
		messagesFindFrom(chatId, messageId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDFROM, { chatId, messageId, user, count, flag })
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
		messagesFindAt(chatId, messageId, user, count, flag = FLAGS.RECEIVER) {
			return new Promise((resolve, reject) => {
				this._validatePath(this.EVENTS.FINDAT, { chatId, messageId, user, count, flag })
					.then(() => {
						return this.model('message').findAt(chatId, messageId, user, count)
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
		_validatePath(path, socket, data) {
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
						return validation(socket, data, next);
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

		auth() {

		}
	}

	module.exports = ChatClient;
}());