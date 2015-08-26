import BaseClient       from "./baseClient";
import * as middleWares from './middlewares';
import * as EVENT       from './events';
import * as OPTION      from './options';

class Client extends BaseClient {
	constructor(server, options) {
		super(server, options);

		this
			.addEvent(EVENT.AUTHENTICATE, this.onAuthenticate)
			.addEvent(EVENT.NEW_CHAT, this.socketAuthorized, this.newChat)
			.addEvent(EVENT.NEW_MESSAGE, this.socketAuthorized, this.newMessage)
			.addEvent(EVENT.START_WRITE, this.socketAuthorized, this.onStartWrite)
			.addEvent(EVENT.END_WRITE, this.socketAuthorized, this.onEndWrite)
			.addEvent(EVENT.FOCUS, this.socketAuthorized, this.onFocus)
			.addEvent(EVENT.BLUR, this.socketAuthorized, this.onBlur)
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
		}
	}

	onAuthenticate(options = {}) {
		return this.useMiddleware(EVENT.AUTHENTICATE, options)
			.then(function () {

			})
	}

	newChat(options = {}) {
		return this.useMiddleware(EVENT.NEW_CHAT, options)
			.then((postOptions) => {

			})
	}

	newMessage(options = {}) {
		return this.useMiddleware(EVENT.NEW_CHAT, options)
			.then((postOptions) => {
				this.getChat(postOptions.chatId)
			})
	}

	systemNotification() {
	}

	authorize(callback) {

	}
}

export default Client;