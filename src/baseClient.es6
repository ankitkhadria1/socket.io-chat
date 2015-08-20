import IO           from 'socket.io';
import EventEmitter from 'events';
import _            from 'underscore';
import { debug }    from './debug';
import ChatModel    from './models/chat';
import MessageModel from './models/message';
import Members      from './members';
import Rooms        from './rooms';
import Memory		from './memory';

const IO_CONNECTION = 'connection';
const SOCKET_USER   = 'user';

const OPTION_IO                   = 'io';
const OPTION_EVENT_PREFIX         = 'eventPrefix';
const OPTION_CHAT_MEMORY          = 'chatMemory';
const OPTION_CHAT_MEMORY_TTL      = 'chatMemoryTtl';
const OPTION_CHAT_MEMORY_PROVIDER = 'chatMemoryProvider';

class BaseClient extends EventEmitter {
	constructor(server, options = {}) {
		super();

		this.__middleware = [];

		this._options = options;

		if (!server) {
			throw new Error('first argument required `http` server');
		}

		this.EVENTS = Object.create(null);

		this._io = io = IO(server, _.extend({ maxHttpBufferSize: 1000 }, this._options[OPTION_IO] || {}));
		this.rooms   = new Rooms();
		this.members = new Members();
	}

	initialize() {
		this._io.on(IO_CONNECTION, (socket) => {
			for (let name in this.EVENTS) {
				let eventName = this.eventName(name);

				socket.on(eventName, this.EVENTS[eventName]);
			}

			socket.on('disconnect', () => {
				this.logoutSocket(socket);
				this.members.remove(socket[SOCKET_USER], socket);
			});
		});

		this.__models = {
			Chat:    ChatModel(options.chat || {}),
			Message: MessageModel(options.message || {})
		};

		if (this._options[OPTION_CHAT_MEMORY]) {
			this._memoryChat = new Memory({ provider: this._options[OPTION_CHAT_MEMORY_PROVIDER], ttl: this._options[OPTION_CHAT_MEMORY_TTL] });
		}
	}

	getIo() {
		return this._io;
	}

		get model = () => {
		return this.__models;
	};

	use(path, callback) {
		if (!this.__middleware[path]) {
			this.__middleware[path] = [];
		}

		if (!(callback instanceof Function)) {
			debug('use: callback is not a function');
			return this;
		}

		this.__middleware[path].push(callback);

		return this;
	}

	unuse(path, callback) {
		if (!(path in this.__middleware)) {
			debug('unuse: path not found');
			return this;
		}

		let index = this.__middleware.indexOf(callback);

		if (index !== -1) {
			this.__middleware.splice(index, 1);
		} else {
			debug('unuse: not found callback, already removed?')
		}

		return this;
	}

	useMiddleware(path, data) {
		var middleware = this.__middleware[path] || [],
			index      = 0;

		return new Promise((resolve, reject) => {
			function next(error) {
				if (typeof error !== "undefined") {
					return reject(error);
				}

				var validation = middleware[index];

				if (validation) {
					index++;
					return validation(data, next);
				}

				if (index === middleware.length) {
					return resolve(data);
				}
			}

			next();
		});
	}

	addEvent(name, callback, force = false) {
		if (name in this.EVENTS && !force) {
			debug('addEvent: the specified name is already taken');
			return false;
		}

		if (force) {
			debug('addEvent: force override EVENT: ' + name);
		}

		return callback && (this.EVENTS[name] = callback);
	}

	eventName(name) {
		if (this._options[OPTION_EVENT_PREFIX]) {
			let prefix = this._options[OPTION_EVENT_PREFIX];

			return name.replace(/^(\w)/, function (firstChar) {
				return prefix + firstChar.toUpperCase();
			});
		}

		return name;
	}

	socketAuthorized(socket) {
		return socket && (socket.auth === true) && socket[SOCKET_USER];
	}

	logoutSocket(socket) {
		delete socket.auth;
		delete socket[SOCKET_USER];
	}

	getChat(id) {
		return new Promise((resolve, rejcet) => {
			if (OPTION_CHAT_MEMORY in this._options) {

			} else {
				this.model.Chat.findById(id).then((chat) => {
					resolve(chat);
				}).catch(reject);
			}
		});
	}
}

export default BaseClient;