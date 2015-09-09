'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('../debug');

var _utils = require('../utils');

var _base = require('./base');

var _base2 = _interopRequireDefault(_base);

var _middlewares = require('../middlewares');

var middleWares = _interopRequireWildcard(_middlewares);

var _events = require('../events');

var EVENT = _interopRequireWildcard(_events);

var _options = require('../options');

var OPTION = _interopRequireWildcard(_options);

function onError(error) {
	(0, _debug.debug)(error.stack);
}

class Client extends _base2['default'] {
	constructor(server, options) {
		super(server, options);

		this.onAuthenticate.priority = 100;
		this.socketAuthorized.priority = 0;

		this.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate).addEvent(EVENT.NEW_CHAT, this.socketAuthorized, this.onNewChat).addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.onNewMessage).addEvent(EVENT.FIND_CHATS, this.socketAuthorized, this.onFindChats).addEvent(EVENT.FIND_LAST_MESSAGES, this.socketAuthorized, this.onFindLastMessages).addEvent(EVENT.WRITE_MESSAGE, this.socketAuthorized, this.onWriteMessage);

		//.addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite)
		//.addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite)
		//.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
		//.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
		if (this.options[OPTION.CHAT_RECORD_COUNT_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordCountMessages);
		}

		if (this.options[OPTION.CHAT_RECORD_LAST_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordLastMessages);
		}

		if (this.options[OPTION.CHAT_SINGLE_PRIVATE]) {
			this.applyMiddleware(middleWares.chatSinglePrivate);
		}

		if (this.options[OPTION.CHAT_NEW_ON_GROUP]) {
			this.applyMiddleware(middleWares.chatNewOnGroup);
		}

		!options.delayInitialize && this.initialize();

		this.on('onAuthenticate', (function (options) {
			this.findChatsUnread({}, options.socket.user).then(function (chats) {
				chats.forEach(function (chat) {
					options.socket.join(String(chat._id));
				});
			});
		}).bind(this));
	}

	onAuthenticate(socket, data, next) {
		socket.emit(this.eventName(EVENT.AUTHENTICATE), { result: { user: data._id } });
		this.members.add(data._id, socket);
		this.emit('onAuthenticate', { socket: socket });
	}

	onNewChat(socket, options, next) {
		var _this = this;

		this.newChat(options, socket.user).then(function (options) {
			//this.joinQueue.resolve(options.chat.get('members'));

			return _this.respond(socket).newChat(options);
		}).then(function () {
			next();
		})['catch'](onError);
	}

	onNewMessage(socket, options, next) {
		var _this2 = this;

		this.newMessage(options, socket.user).then(function (options) {
			var room = _this2.namespace.to(String(options.chat._id));

			if (!room._connectedChecked) {
				(function () {
					Object.defineProperty(room, '_connectedChecked', {
						enumerable: false,
						value: true
					});

					var roomConnected = [];

					Object.keys(room.connected).forEach(function (key) {
						roomConnected.push(room.connected[key].user);
					});

					(0, _utils.unique_m)(roomConnected);

					if (options.chat.getMembersIds().length !== roomConnected.length) {
						var members = _this2.members.get(options.chat.getMembersIds());

						members.forEach(function (member) {
							member.join(String(options.chat._id));
						});
					}
				})();
			}

			return _this2.respond(room).newMessage(options);
		}).then(function () {
			//next();
		})['catch'](onError);
	}

	onFindChats(socket, options, next) {
		var _this3 = this;

		this.findChats(options, socket.user).then(function (data) {
			return _this3.respond(socket).findChats(data);
		}).then(function () {
			next();
		})['catch'](onError);
	}

	onFindLastMessages(socket, options, next) {
		var _this4 = this;

		this.findLastMessages(options, socket.user).then(function (data) {
			return _this4.respond(socket).findLastMessages(data);
		}).then(function () {
			next();
		})['catch'](onError);
	}

	onWriteMessage(socket, options, next) {
		if (socket.rooms.indexOf(options.chatId) !== -1) {
			this.respond(this.namespace.to(options.chatId)).writeMessage({ chatId: options.chatId, isWrite: options.isWrite });
		}
	}

	newChat() {
		var _this5 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		// TODO: first message

		return this.preMiddleware(EVENT.NEW_CHAT, options).then(function (postOptions) {
			var chat = new _this5.model.Chat(options.data);

			chat.setCreator(user);

			return chat.save();
		}).then(function (chat) {
			return { chat: chat, user: user };
		}).then(function (options) {
			return _this5.postMiddleware(EVENT.NEW_CHAT, options);
		})['catch'](onError);
	}

	newMessage() {
		var _this6 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		var chat = undefined;

		return this.preMiddleware(EVENT.NEW_CHAT, options).then(function () {
			return _this6.model.Chat.findOne({ _id: options.data.chatId, 'members._id': String(user) }).exec();
		}).then(function (result) {
			chat = result;

			if (chat) {
				var message = new _this6.model.Message(options.data);

				message.setChat(chat);
				message.setAuthor(user);
				message.setType('user');

				return message.save();
			}
			// TODO: what if else ?
		}).then(function (message) {
			return { chat: chat, message: message, user: user };
		})['catch'](onError);
	}

	findChats() {
		var _this7 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		return this.preMiddleware(EVENT.FIND_CHATS, options).then(function () {
			return _this7.model.Chat.find({ 'members._id': String(user) }).sort({ lastMessageAt: 1 }).exec({ lean: 1 });
		}).then(function (results) {
			return _this7.postMiddleware(EVENT.FIND_CHATS, results);
		})['catch'](onError);
	}

	findChatsUnread() {
		var _this8 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		return this.preMiddleware(EVENT.FIND_CHATS_UNREAD, options).then(function () {
			return _this8.model.Chat.find({ 'members._id': String(user), 'members.unreadCount': { $gt: 0 } }).exec({ lean: 1 });
		}).then(function (results) {
			return _this8.postMiddleware(EVENT.FIND_CHATS_UNREAD, results);
		})['catch'](onError);
	}

	findLastMessages() {
		var _this9 = this;

		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
		var user = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

		return this.preMiddleware(EVENT.FIND_LAST_MESSAGES, options).then(function () {
			return _this9.model.Message.find({
				chatId: String(options.chatId),
				receivers: String(user),
				deleted: { $nin: [user] }
			}).sort({ createdAt: -1 }).limit(3).exec({ lean: 1 });
		}).then(function (results) {
			results.sort(function (result) {
				return result.createdAt;
			});

			return _this9.postMiddleware(EVENT.FIND_LAST_MESSAGES, {
				chatId: String(options.chatId),
				messages: results
			});
		})['catch'](onError);
	}

	systemNotification() {}

	authorize(socket) {}
}

exports['default'] = Client;
module.exports = exports['default'];
//# sourceMappingURL=client.js.map