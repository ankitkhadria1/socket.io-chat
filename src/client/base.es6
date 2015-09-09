import IO                 from 'socket.io';
import EventEmitter       from 'events';
import _                  from 'underscore';
import deepExtend         from 'deep-extend';
import { debug }          from '../debug';
import ChatModel          from '../models/chat';
import MessageModel       from '../models/message';
import Members            from '../members';
import Rooms              from '../rooms';
import Memory             from '../memory';
import Db                 from '../db/index';
import Component          from '../component/index';
import RespondComponent   from '../component/respond';
import JoinQueueComponent from '../component/joinQueue';
import * as chain         from '../chain';
import * as middleWares   from '../middlewares';
import * as OPTION        from '../options';
import * as EVENT         from '../events';

require('source-map-support').install();

var typeOf = function (object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

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

		if (!options.db.provider) {
			throw new Error('options.db required `provider` (mongodb)');
		}

		Object.defineProperties(this, {
			middleware: {
				enumerable: false,
				writable:   true,
				value:      []
			},
			options:    {
				enumerable: false,
				writable:   true,
				value:      _.clone(options)
			},
			io:         {
				enumerable: false,
				writable:   true,
				value:      IO(server, deepExtend({ maxHttpBufferSize: 1000 }, options[OPTION.IO] || {}))
			},
			EVENTS:     {
				enumerable: false,
				writable:   true,
				value:      Object.create(null)
			},
			components: {
				enumerable: false,
				value:      {
					Respond:   null,
					joinQueue: null,
					Model:     null
				}
			},
			//rooms:        {
			//	enumerable: false,
			//	writable:   true,
			//	value:      new Rooms()
			//},
			members:    {
				enumerable: false,
				writable:   true,
				value:      new Members()
			}
		});
	}

	initialize() {
		this.emit('pre-initialize');

		this.db = new Db(this.options.db);

		this.initializeComponents();

		//this.io.on(IO_CONNECTION, (socket) => {});

		let _client           = this;
		let wrapEventCallback = function (event, socket, data) {
			_client.invoke(event, socket, data);
		};

		this.namespace = this.io.of('/' + this.options[OPTION.NAMESPACE]);
		this.namespace.on(EVENT.IO_CONNECTION, (socket) => {
			for (let eventName in this.EVENTS) {
				socket.on(eventName, (function (event) {
					return function (data = {}) {
						wrapEventCallback(event, socket, data)
					};
				}(eventName)));
			}

			socket.on(EVENT.ERROR, function (error) {
				console.log(error.stack);
			});

			socket.on(EVENT.OPTIONS, () => {
				let events = {};

				for (let eventName in this.EVENTS) {
					events[this.revertEventName(eventName)] = eventName;
				}

				socket.emit(EVENT.OPTIONS, { events });
			});

			socket.on('disconnect', () => {
				this.members.remove(socket.user, socket);
				this.logoutSocket(socket);
			});
		});

		this.__models = {
			Chat:    ChatModel(this, this.options.chat),
			Message: MessageModel(this, this.options.message)
		};


		//if (this.options[OPTION.CHAT_MEMORY]) {
		//	this._memoryChat = new Memory({
		//		provider: this.options[OPTION.CHAT_MEMORY_PROVIDER],
		//		ttl:      this.options[OPTION.CHAT_MEMORY_TTL]
		//	});
		//}

		this.emit('initialize');
	}

	initializeComponents() {
		if (!this.components.Respond) this.register('Respond', RespondComponent);
		if (!this.components.joinQueue) this.register('joinQueue', new JoinQueueComponent(this));
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

	pre(path) {
		this.use.apply(this, [path].concat(Array.prototype.slice.call(arguments, 1)));
	}

	post(path) {
		if (!this.middleware[path]) {
			this.middleware[path] = { pre: [], post: [] };
		}

		chain.add.apply(chain, [this.middleware[path].post].concat(Array.prototype.slice.call(arguments, 1)));

		return this;
	}

	use(path) {
		if (!this.middleware[path]) {
			this.middleware[path] = { pre: [], post: [] };
		}

		chain.add.apply(chain, [this.middleware[path].pre].concat(Array.prototype.slice.call(arguments, 1)));

		return this;
	}

	unUse(path, obj) {
		if (!(path in this.middleware)) {
			debug('unUse: path not found');
			return this;
		}

		let index = this.middleware.pre.indexOf(obj);

		if (index !== -1) {
			this.middleware.pre.splice(index, 1);
		} else {
			debug('unuse: not found callback, already removed?')
		}

		return this;
	}

	unPost(path, obj) {
		if (!(path in this.middleware)) {
			debug('unPost: path not found');
			return this;
		}

		let index = this.middleware.post.indexOf(obj);

		if (index !== -1) {
			this.middleware.post.splice(index, 1);
		} else {
			debug('unuse: not found obj, already removed?')
		}

		return this;
	}

	preMiddleware(path, data) {
		var middleware = this.middleware[path] ? this.middleware[path].pre : [];

		return chain.exec(middleware, this, data)
			.catch(function (error) {
				debug(error);
			});
	}

	postMiddleware(path, data) {
		var middleware = this.middleware[path] ? this.middleware[path].post : [];

		return chain.exec(middleware, this, data)
			.catch(function (error) {
				debug(error);
			});
	}

	invoke(name, socket, data) {
		let promise = (resolve, reject) => {

			if (!(name in this.EVENTS)) {
				return reject();
			}

			chain.exec(this.EVENTS[name], this, socket, data)
				.catch(function (error) {
					debug(error);
					reject(error);
				});
		};

		return new Promise(promise);
	}

	addEvent(name) {
		var eventName = this.eventName(name);

		if (!this.EVENTS[eventName]) {
			this.EVENTS[eventName] = [];
		}

		chain.add.apply(chain, [this.EVENTS[eventName]].concat(Array.prototype.slice.call(arguments, 1)));

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
		if (this.options[OPTION.NAMESPACE]) {
			let prefix = this.options[OPTION.NAMESPACE];

			return name.replace(/^(\w)/, function (firstChar) {
				return prefix + firstChar.toUpperCase();
			});
		}

		return name;
	}

	revertEventName(name) {
		if (this.options[OPTION.NAMESPACE]) {
			let prefix = this.options[OPTION.NAMESPACE];

			return name.replace(prefix, '').replace(/^(\w)/, function (firstChar) {
				return firstChar.toLowerCase();
			});
		}

		return name;
	}

	socketAuthorized(socket, options, next) {
		return socket && (socket.auth === true) && socket[SOCKET_USER] && next();
	}

	logoutSocket(socket) {
		delete socket.auth;
		delete socket[SOCKET_USER];
	}

	getChat(id) {
		return new Promise((resolve, rejcet) => {
			if (OPTION.CHAT_MEMORY in this.options) {

			} else {
				this.model.Chat.findById(id).then((chat) => {
					resolve(chat);
				}).catch(reject);
			}
		});
	}

	respond(namespace) {
		return new this.components.Respond(this, namespace);
	}

	register(componentName, NewComponent) {
		this.components[componentName] = NewComponent;
	}

	registerModel(modelName, Model) {
		this.__models[modelName] = Model;
	}
}

export default BaseClient;