import { debug }        from './debug';
import BaseClient       from "./baseClient";
import * as middleWares from './middlewares';
import * as EVENT       from './events';
import * as OPTION      from './options';

class Client extends BaseClient {
	constructor(server, options) {
		super(server, options);

		this.onAuthenticate.priority = 100;
		this.socketAuthorized.priority = 0;

		this
			.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate)
			.addEvent(EVENT.NEW_CHAT, this.socketAuthorized, this.onNewChat)
			.addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.newMessage)
			//.addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite)
			//.addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite)
			//.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
			//.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
		;

		if (this._options[OPTION.CHAT_RECORD_COUNT_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordCountMessages);
		}

		if (this._options[OPTION.CHAT_RECORD_LAST_MESSAGES]) {
			this.applyMiddleware(middleWares.chatRecordLastMessages);
		}

		if (this._options[OPTION.CHAT_SINGLE_PRIVATE]) {
			this.applyMiddleware(middleWares.chatSinglePrivate);
		}

		if (this._options[OPTION.CHAT_NEW_ON_GROUP]) {
			this.applyMiddleware(middleWares.chatNewOnGroup);
		}

		if (!options.delayInitialize) {
			this.initialize();

			this.model.Chat.find({ name: 1 }).exec({})
				.then(function () {
					//console.log('then', arguments);
				})
				.catch(function (err) {
					console.log('catch', err.stack);
				})
		}
	}

	onAuthenticate(socket, data, next) {
		socket.emit(this.eventName(EVENT.AUTHENTICATE), { result: { user: data.user } })
	}

	onNewChat(socket, options, next) {
		this.newChat(options, socket.user);
	}

	newChat(options = {}, user = null) {
		return this.preMiddleware(EVENT.NEW_CHAT, options)
			.then((postOptions) => {
				let chat = new this.model.Chat(options.data);

				//console.log(chat.get('members'));
				chat.setCreator(user);
				//console.log(chat.get('members'));
				//console.log('-----------');
				console.log(chat.toJSON());

				//return chat.save();
			})
			.catch(function (error) {
				debug(error.stack);
			})
		;
	}

	newMessage(options = {}) {
		return this.preMiddleware(EVENT.NEW_CHAT, options)
			.then((post) => {
				this.post(EVENT.NEW_CHAT, post);
			})
			.catch(function (error) {
				debug(error.stack);
			})
		;
	}

	systemNotification() {
	}

	authorize(socket) {

	}
}

export default Client;