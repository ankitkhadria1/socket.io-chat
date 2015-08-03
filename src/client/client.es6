import { chatMessagesInc, singlePrivateChat, newChatOnGroup } from './clientValidators';
import IO           from 'socket.io';
import db           from '../db';
import Chat         from '../chat';
import Rooms        from '../rooms';
import Members      from '../members';
import Message      from '../message';
import EventEmitter from 'events';
import util         from 'util';
import debugBase    from 'debug';
import _            from 'underscore';
import FLAGS        from '../flags';
import socketMixin  from '../socket';
import ClientSocket from './socket';
import ClientAction from './action';
import ClientError  from '../error';

var debug = debugBase('develop');

require('source-map-support').install();

class Client extends EventEmitter {
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

		this.options = options;

		options.chatMessagesInc = options.chatMessagesInc || true;

		EVENTS = {
			AUTHENTICATE:     'authenticate',
			JOIN:             'join',
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

		this.__members = this.members = new Members();
		this.__rooms = this.rooms = new Rooms();

		this.__models.chat = Chat({
			collection: collectionChat,
			schema:     options.schemaChat || undefined
		});

		this.__models.message = Message({
			collection: collectionChatMessages,
			schema:     options.schemaMessage || undefined
		});

		this.io = io = IO(server, {maxHttpBufferSize: 1000});

		io.on('connection', function (socket) {
			self.emit('connection', socket);

			socket.on(EVENTS.AUTHENTICATE, function (data) {
				self.socket.onAuthenticate(self, this, data);
			});

			socket.pipe(EVENTS.CREATE)
				.then(request.onCreate)
				.then(client.create)
				.then(response.onCreate);

			chat.request.onCreate();
			chat.response.onCreate();

			client.response.Create()

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

			_.extend(socket, socketMixin);
		});

		if (this.options.chatMessagesInc) {
			this.on(this.EVENTS.NEWMESSAGE, chatMessagesInc.bind(this));
		}

		if (this.options.singlePrivateChat) {
			this.validate(this.EVENTS.CREATE, singlePrivateChat.bind(this));
		}

		if (this.options.newChatOnGroup) {
			this.validate(this.EVENTS.ADDMEMBER, newChatOnGroup.bind(this));
		}
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

		chat.members = chat.members && chat.members.map(function (id) {
				return db.ObjectId(id);
			}).filter(function (id) {
				return !!id;
			});

		chat.setCreator(db.ObjectId(creator));

		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.CREATE, {chat, creator, data})
				.then((post) => {
					post.chat.save((error, result) => {
						if (error) {
							return reject(error);
						}

						resolve(post.chat);

						this.emit(this.EVENTS.CREATE, post.chat);
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
			this._validatePath(this.EVENTS.ADDMEMBER, {chat, member, performer, flag})
				.then(() => {
					return this.action.validate(flag, {chat, performer});
				})
				.then(() => {
					chat.save((error) => {
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
			this._validatePath(this.EVENTS.REMOVEMEMBER, {chat, member, performer, flag})
				.then(() => {
					return this.action.validate(flag, {chat, performer});
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
		message.addAttachments(messageData.files);

		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.NEWMESSAGE, {chat, message, performer, flag})
				.then((post) => {
					return this.action.validate(flag, {chat: post.chat, performer: post.performer})
						.then(() => {
							post.message.save((error) => {
								if (error) {
									return reject(error);
								}

								resolve(post.message);

								this.emit(this.EVENTS.NEWMESSAGE, {chat: post.chat, message: post.message});
							});
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
			this._validatePath(this.EVENTS.CHANGETITLE, {chat, title, performer, flag})
				.then(() => {
					return this.action.validate(flag, {chat, performer});
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
			this._validatePath(this.EVENTS.LEAVE, {chat, performer, flag})
				.then(() => {
					return this.action.validate(flag, {chat, performer});
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

		message = new (this.model('message'))({text: ' '});
		message.setChat(chat);
		message.setSystemAuthor();
		message.setReceivers(chat.members);
		message.setSystem(data);

		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.NEWSYSTEMMESSAGE, {chat, message, data})
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
	 * @param {Number} limit
	 * @param {Number} flag
	 * @param {Object} criteria
	 * @returns {Promise}
	 */
	findLastMessages(chatId, user, limit, flag = FLAGS.RECEIVER, criteria = {}) {
		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.FINDMESSAGESLAST, {chatId, user, limit, flag, criteria})
				.then(() => {
					return this.model('message').findLast(chatId, user, limit, criteria);
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
	 * @param {Number} limit
	 * @param {Number} flag
	 * @param {Object} criteria
	 * @returns {Promise}
	 */
	findFromMessages(chatId, messageId, user, limit, flag = FLAGS.RECEIVER, criteria = {}) {
		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.FINDMESSAGESFROM, {chatId, messageId, user, limit, flag, criteria})
				.then(() => {
					return this.model('message').findFrom(chatId, messageId, user, limit, criteria)
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
	 * @param {Number} limit
	 * @param {Number} flag
	 * @param {Object} criteria
	 * @returns {Promise}
	 */
	findAtMessages(chatId, messageId, user, limit, flag = FLAGS.RECEIVER, criteria = {}) {
		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.FINDMESSAGESAT, {chatId, messageId, user, limit, flag, criteria})
				.then(() => {
					return this.model('message').findAt(chatId, messageId, user, limit, criteria)
				})
				.then(resolve, reject)
				.catch(reject);
		});
	}

	/** find chats */
	findChats(user, limit = 10, criteria = {}) {
		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.FINDCHATS, {user, limit, criteria})
				.then(() => {
					return this.model('chat').findAllByMember(user, limit, criteria)
				})
				.then(resolve, reject)
				.catch(reject);
		});
	}

	/** find one chat */
	findChatById(user, chatId, criteria = {}) {
		return new Promise((resolve, reject) => {
			this._validatePath(this.EVENTS.FINDCHAT, {user, chatId, criteria})
				.then(() => {
					return this.model('chat').findByMember(chatId, user, criteria)
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
					return resolve(data);
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

export default Client;