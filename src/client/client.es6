import { debug }        from '../debug';
import { unique_m }        from '../utils';
import BaseClient       from './base';
import * as middleWares from '../middlewares';
import * as EVENT       from '../events';
import * as OPTION      from '../options';

function onError(error) {
	debug(error.stack);
}

class Client extends BaseClient {
	constructor(server, options) {
		super(server, options);

		this.onAuthenticate.priority   = 100;
		this.socketAuthorized.priority = 0;

		this
			.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate)
			.addEvent(EVENT.NEW_CHAT, this.socketAuthorized, this.onNewChat)
			.addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.onNewMessage)
			.addEvent(EVENT.FIND_CHATS, this.socketAuthorized, this.onFindChats)
			.addEvent(EVENT.FIND_LAST_MESSAGES, this.socketAuthorized, this.onFindLastMessages)
			.addEvent(EVENT.WRITE_MESSAGE, this.socketAuthorized, this.onWriteMessage)
			//.addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite)
			//.addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite)
			//.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
			//.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
		;

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

		this.on('onAuthenticate', function (options) {
			this.findChatsUnread({}, options.socket.user)
				.then((chats) => {
					chats.forEach(function (chat) {
						options.socket.join(String(chat._id));
					});
				});
		}.bind(this));
	}

	onAuthenticate(socket, data, next) {
		socket.emit(this.eventName(EVENT.AUTHENTICATE), { result: { user: data._id } });
		this.members.add(data._id, socket);
		this.emit('onAuthenticate', { socket })
	}

	onNewChat(socket, options, next) {
		this.newChat(options, socket.user)
			.then((options) => {
				//this.joinQueue.resolve(options.chat.get('members'));

				return this.respond(socket).newChat(options);
			})
			.then(function () {
				next();
			})
			.catch(onError);
	}

	onNewMessage(socket, options, next) {
		this.newMessage(options, socket.user)
			.then((options) => {
				let room = this.namespace.to(String(options.chat._id));

				if (!room._connectedChecked) {
					Object.defineProperty(room, '_connectedChecked', {
						enumerable: false,
						value:      true
					});

					let roomConnected = [];

					Object.keys(room.connected).forEach(function (key) {
						roomConnected.push(room.connected[key].user);
					});

					unique_m(roomConnected);

					if (options.chat.getMembersIds().length !== roomConnected.length) {
						let members = this.members.get(options.chat.getMembersIds());

						members.forEach(function (member) {
							member.join(String(options.chat._id));
						});
					}
				}

				return this.respond(room).newMessage(options);
			})
			.then(function () {
				//next();
			})
			.catch(onError);
	}

	onFindChats(socket, options, next) {
		this.findChats(options, socket.user)
			.then((data) => {
				return this.respond(socket).findChats(data);
			})
			.then(function () {
				next();
			})
			.catch(onError);
	}

	onFindLastMessages(socket, options, next) {
		this.findLastMessages(options, socket.user)
			.then((data) => {
				return this.respond(socket).findLastMessages(data)
			})
			.then(function () {
				next();
			})
			.catch(onError);
	}

	onWriteMessage(socket, options, next) {
		if (socket.rooms.indexOf(options.chatId) !== -1) {
			this.respond(this.namespace.to(options.chatId)).writeMessage({ chatId: options.chatId, isWrite: options.isWrite });
		}
	}

	newChat(options = {}, user = null) {
		// TODO: first message

		return this.preMiddleware(EVENT.NEW_CHAT, options)
			.then((postOptions) => {
				let chat = new this.model.Chat(options.data);

				chat.setCreator(user);

				return chat.save();
			})
			.then((chat) => {
				return { chat, user }
			})
			.then((options) => {
				return this.postMiddleware(EVENT.NEW_CHAT, options)
			})
			.catch(onError);
	}

	newMessage(options = {}, user = null) {
		let chat;

		return this.preMiddleware(EVENT.NEW_CHAT, options)
			.then(() => {
				return this.model.Chat.findOne({ _id: options.data.chatId, 'members._id': String(user) }).exec();
			})
			.then((result) => {
				chat = result;

				if (chat) {
					let message = new this.model.Message(options.data);

					message.setChat(chat);
					message.setAuthor(user);
					message.setType('user');

					return message.save();
				}
				// TODO: what if else ?
			})
			.then((message) => {
				return { chat, message, user };
			})
			.catch(onError);
	}

	findChats(options = {}, user = null) {
		return this.preMiddleware(EVENT.FIND_CHATS, options)
			.then(() => {
				return this.model.Chat.find({ 'members._id': String(user) })
					.sort({ lastMessageAt: 1 })
					.exec({ lean: 1 })
			})
			.then((results) => {
				return this.postMiddleware(EVENT.FIND_CHATS, results);
			})
			.catch(onError);
	}

	findChatsUnread(options = {}, user = null) {
		return this.preMiddleware(EVENT.FIND_CHATS_UNREAD, options)
			.then(() => {
				return this.model.Chat.find({ 'members._id': String(user), 'members.unreadCount': { $gt: 0 } })
					.exec({ lean: 1 })
			})
			.then((results) => {
				return this.postMiddleware(EVENT.FIND_CHATS_UNREAD, results);
			})
			.catch(onError);
	}

	findLastMessages(options = {}, user = null) {
		return this.preMiddleware(EVENT.FIND_LAST_MESSAGES, options)
			.then(() => {
				return this.model.Message.find({
					chatId:    String(options.chatId),
					receivers: String(user),
					deleted:   { $nin: [user] }
				})
					.sort({ createdAt: -1 })
					.limit(3)
					.exec({ lean: 1 })
			})
			.then((results) => {
				results.sort(function (result) {
					return result.createdAt;
				});

				return this.postMiddleware(EVENT.FIND_LAST_MESSAGES, {
					chatId:   String(options.chatId),
					messages: results
				});
			})
			.catch(onError);
	}

	systemNotification() {
	}

	authorize(socket) {

	}
}

export default Client;