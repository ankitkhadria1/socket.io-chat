import IO               from 'socket.io';
import EventEmitter     from 'events';
import _                from 'underscore';
import deepExtend       from 'deep-extend';
import { debug }        from './debug';
import ChatModel        from './models/chat';
import MessageModel     from './models/message';
import Members          from './members';
import Rooms            from './rooms';
import Memory           from './memory';
import Db               from './db/index';
import * as chain		from './chain';
import * as middleWares from './middlewares';
import * as OPTION      from './options';
import * as EVENT       from './events';

const IO_CONNECTION = 'connection';
const SOCKET_USER   = 'user';

class BaseClient extends EventEmitter {
	constructor(server, options = {}) {
		super();

		if (!server) {
			throw new Error('first argument required `http` server');
		}

		if (!options.db) {
			throw new Error('options required `db` section');
		}

		if (!options.db.connect) {
			throw new Error('options.db required `connect`');
		}

		//if (!options.db.provider) {
		//	throw new Error('options.db required `provider` (mongodb)');
		//}

		this.__middleware = [];
		this._options     = _.clone(options);
		this._io          = IO(server, _.extend({ maxHttpBufferSize: 1000 }, this._options[OPTION.IO] || {}));
		this.EVENTS       = Object.create(null);
		this.rooms        = new Rooms();
		this.members      = new Members();
	}

	initialize() {
		this.emit('pre-initialize');

		this.addEvent(EVENT.EVENTS, function (socket, data) {

		});

		this._db = new Db(this._options.db);
		this._io.on(IO_CONNECTION, (socket) => {
			let _client = this;

			let wrapEventCallback = function (data) {
				_client.invoke('someName', this, data);
			};

			for (let name in this.EVENTS) {
				let eventName = this.eventName(name);

				socket.on(eventName, wrapEventCallback);
			}

			socket.on('disconnect', () => {
				this.logoutSocket(socket);
				this.members.remove(socket[SOCKET_USER], socket);
			});
		});

		this.__models = {
			Chat:    ChatModel(this._db, this._options.chat || {}),
			Message: MessageModel(this._db, this._options.message || {})
		};

		if (this._options[OPTION.CHAT_MEMORY]) {
			this._memoryChat = new Memory({
				provider: this._options[OPTION.CHAT_MEMORY_PROVIDER],
				ttl:      this._options[OPTION.CHAT_MEMORY_TTL]
			});
		}

		this.emit('initialize');
	}

	get io() {
		return this._io;
	}

	get model() {
		return this.__models;
	}

	applyMiddleware(_Middleware) {
		if (!_Middleware.event) {
			debug('middleware not specified event name');
			return this;
		}

		_.isFunction(_Middleware)
			? this.use(_Middleware.event, _Middleware)
			: this.use(_Middleware.event, new _Middleware(this));


		return this;
	}

	use(path, middleware) {
		if (!this.__middleware[path]) {
			this.__middleware[path] = [];
		}

		if (_.isArray(middleware))
			middleware.forEach((_middleware) => { this.__middleware[path].push(_middleware); });

		if (middleware.exec)
			if (_.isArray(middleware.exec))
				middleware.exec.forEach((_middleware) => { this.__middleware[path].push(_middleware); });
			else
				this.__middleware[path].push(middleware.exec);

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

	execMiddleware(path, data) {
		var middleware = this.__middleware[path] || [];

		return chain.exec(middleware, data);
	}

	invoke(name, socket, data) {
		let promise = (resolve, reject) => {

			if (!(name in this.EVENTS)) {
				return reject();
			}


		};

		return new Promise(promise);
	}

	addEvent(name) {
		var callbacks = Array.prototype.slice.call(arguments, 1);

		if (!this.EVENTS[name]) {
			this.EVENTS[name] = [];
		}

		callbacks.forEach(function (callback) {
			if (callback instanceof Function) {
				this.EVENTS[name].push(callback)
			}
		});

		return this;
	}

	removeEvent(name) {
		var callbacks = Array.prototype.slice.call(arguments, 1);

		if (!this.EVENTS[name]) {
			this.EVENTS[name] = [];
		}

		callbacks.forEach(function (callback) {
			let indexCb;

			if ((indexCb = this.EVENTS[name].indexOf(callback)) !== -1) {
				this.EVENTS[name].splice(indexCb, 1);
			}
		});

		return this;
	}

	eventName(name) {
		if (this._options[OPTION.EVENT_PREFIX]) {
			let prefix = this._options[OPTION.EVENT_PREFIX];

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
			if (OPTION.CHAT_MEMORY in this._options) {

			} else {
				this.model.Chat.findById(id).then((chat) => {
					resolve(chat);
				}).catch(reject);
			}
		});
	}
}

export default BaseClient;