import BaseClient from "./baseClient";

const EVENT_AUTHENTICATE = 'authenticate';
const EVENT_NEW_CHAT     = 'newChat';
const EVENT_NEW_MESSAGE  = 'newMessage';

class Client extends BaseClient {
	constructor(server, options) {
		super(server, options);

		this.addEvent(EVENT_AUTHENTICATE, (socket, data) => {
			this.socketAuthorized(socket) && this.authorize && this.authorize(this, socket, data);
		});

		this.addEvent(EVENT_NEW_CHAT, (socket, data) => {
			this.socketAuthorized(socket) && this.newChat(data);
		});

		this.addEvent(EVENT_NEW_MESSAGE, (socket, data) => {
			this.socketAuthorized(socket) && this.newMessage(data);
		});

		if (!options.delayInitialize) {
			this.initialize();
		}
	}

	/**
	 * @param {object} options
	 * @param {object} options.data
	 * @param {string} options.data.name
	 */
	newChat(options = {}) {
		return this.useMiddleware(EVENT_NEW_CHAT, options)
			.then((postOptions) => {

			})
	}

	/**
	 * @param {object}   options
	 * @param {ObjectId} options.chatId
	 * @param {object}   options.data
	 * @param {string}   options.data.text
	 */
	newMessage(options = {}) {
		return this.useMiddleware(EVENT_NEW_CHAT, options)
			.then((postOptions) => {
				this.getChat(postOptions.chatId)
			})
	}

	systemNotification() {}

	// Must be overridden
	authorize(client, socket, data) {
		socket.auth = false;
	}
}

export default Client;