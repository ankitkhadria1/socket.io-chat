import { debug }        from '../debug';
import { unique_m }     from '../utils';
import BaseClient       from './base';
import * as middleWares from '../middlewares';
import * as EVENT       from '../events';
import * as OPTION      from '../options';

function onError(error) {
	debug(error.stack);
}

const TIME_REQUESTS_COUNT  = 10;
const LIMIT_DELTA_REQUESTS = 550;
const REQUESTS_BAN         = 1000 * 60 * 2; // 2 minutes

let TIME_REQUESTS     = Symbol('TIME_REQUESTS');
let TIME_REQUESTS_BAN = Symbol('TIME_REQUESTS_BAN');

class Client extends BaseClient {
	constructor(server, options) {
		super(server, options);

		this.onAuthenticate.priority   = 100;
		this.socketAuthorized.priority = 0;
		this.requestTimes.priority     = 1;

		this
			.addEvent(EVENT.AUTHENTICATE, this.requestTimes, this.onAuthenticate)
			.addEvent(EVENT.NEW_CHAT, this.requestTimes, this.socketAuthorized, this.onNewChat)
			.addEvent(EVENT.NEW_MESSAGE, this.requestTimes, this.socketAuthorized, this.onNewMessage)
			.addEvent(EVENT.FIND_CHATS, this.requestTimes, this.socketAuthorized, this.onFindChats)
			.addEvent(EVENT.FIND_LAST_MESSAGES, this.requestTimes, this.socketAuthorized, this.onFindLastMessages)
			.addEvent(EVENT.WRITE_MESSAGE, this.requestTimes, this.socketAuthorized, this.onWriteMessage)
			//.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
			//.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
		;

		if (this.options[OPTION.CHAT_RECORD_COUNT_MESSAGES]) {
			this.post(middleWares.chatRecordCountMessages.event(), middleWares.chatRecordCountMessages);
			process.exit(9);
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
		socket.emit(this.eventName(EVENT.AUTHENTICATE), {result: {user: data._id}});
		this.members.add(data._id, socket);
		this.emit('onAuthenticate', {socket})
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

				return this.respond(room).newMessage(options, options.uuid);
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
				return this.respond(socket).findLastMessages(data, options.uuid)
			})
			.then(function () {
				next();
			})
			.catch(onError);
	}

	onWriteMessage(socket, options, next) {
		if (socket.rooms.indexOf(options.chatId) !== -1) {
			this.respond(this.namespace.to(options.chatId)).writeMessage({
				chatId:  options.chatId,
				isWrite: options.isWrite,
				user:    socket.user
			});
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
				return {chat, user}
			})
			.then((options) => {
				return this.postMiddleware(EVENT.NEW_CHAT, options)
			})
			.catch(onError);
	}

	newMessage(options = {}, user = null) {
		let chat;

		return this.preMiddleware(EVENT.NEW_MESSAGE, options)
			.then(() => {
				if (!options.data) {
					options.data = {};
				}

				return this.model.Chat.findOne({_id: options.data.chatId, 'members._id': String(user)}).exec();
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
				return this.postMiddleware(EVENT.NEW_MESSAGE, {chat, message, user});
			})
			.then((results) => {
				return results
			})
			.catch(onError);
	}

	findChats(options = {}, user = null) {
		return this.preMiddleware(EVENT.FIND_CHATS, options)
			.then(() => {
				return this.model.Chat.find({'members._id': String(user)})
					.sort({lastMessageAt: 1})
					.exec({lean: 1})
			})
			.then((results) => {
				return this.postMiddleware(EVENT.FIND_CHATS, results);
			})
			.catch(onError);
	}

	findChatsUnread(options = {}, user = null) {
		return this.preMiddleware(EVENT.FIND_CHATS_UNREAD, options)
			.then(() => {
				return this.model.Chat.find({'members._id': String(user), 'members.unreadCount': {$gt: 0}})
					.exec({lean: 1})
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
					deleted:   {$nin: [user]}
				})
					.sort({createdAt: -1})
					.limit(3)
					.exec({lean: 1})
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

	// TODO: WRITE_MESSAGE can be do often, or just increase TIME_REQUESTS_COUNT
	requestTimes(socket, data, next) {
		var delta = 0, length = 0, diffs;

		// TODO: key name of options move to OPTION module
		var limitDeltaRequest = this.options.limitDeltaRequest || LIMIT_DELTA_REQUESTS,
		    timeRequestsCount = this.options.timeRequestsCount || TIME_REQUESTS_COUNT;

		if (!socket[TIME_REQUESTS]) {
			socket[TIME_REQUESTS] = [];
		}

		if (socket[TIME_REQUESTS_BAN]) {
			if (socket[TIME_REQUESTS_BAN] < Date.now()) {
				delete socket[TIME_REQUESTS_BAN];
			} else {
				// TODO: key name of options move to OPTION module
				this.options.emitOnBanNotOver && this.emit(EVENT.CLIENT_SOCKET_BAN_NOT_OVER, {socket});
				return;
			}
		}

		socket[TIME_REQUESTS].push(Date.now());

		if (socket[TIME_REQUESTS].length > 5) {
			if (socket[TIME_REQUESTS].length > timeRequestsCount) {
				socket[TIME_REQUESTS].splice(0, socket[TIME_REQUESTS].length - timeRequestsCount);
			}

			length = socket[TIME_REQUESTS].length;

			diffs = socket[TIME_REQUESTS].map(function (value, index) {
				return index === length - 1 ? value - (socket[TIME_REQUESTS][index - 1] || 0) : socket[TIME_REQUESTS][index + 1] - value;
			});

			delta = diffs.reduce(function (prev, next) {
				return prev + next;
			});

			if (delta < limitDeltaRequest) {
				socket[TIME_REQUESTS_BAN] = Date.now() + (this.options.requestsBan || REQUESTS_BAN);
				// TODO: key name of options move to OPTION module
				this.options.emitOnBan && this.emit(EVENT.CLIENT_SOCKET_BAN, {socket})
			} else {
				next();
			}
		} else {
			next();
		}
	}
}

export default Client;