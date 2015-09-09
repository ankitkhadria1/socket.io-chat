'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _socketIo = require('socket.io');

var _socketIo2 = _interopRequireDefault(_socketIo);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _debug = require('../debug');

var _modelsChat = require('../models/chat');

var _modelsChat2 = _interopRequireDefault(_modelsChat);

var _modelsMessage = require('../models/message');

var _modelsMessage2 = _interopRequireDefault(_modelsMessage);

var _members = require('../members');

var _members2 = _interopRequireDefault(_members);

var _rooms = require('../rooms');

var _rooms2 = _interopRequireDefault(_rooms);

var _memory = require('../memory');

var _memory2 = _interopRequireDefault(_memory);

var _dbIndex = require('../db/index');

var _dbIndex2 = _interopRequireDefault(_dbIndex);

var _componentIndex = require('../component/index');

var _componentIndex2 = _interopRequireDefault(_componentIndex);

var _componentRespond = require('../component/respond');

var _componentRespond2 = _interopRequireDefault(_componentRespond);

var _componentJoinQueue = require('../component/joinQueue');

var _componentJoinQueue2 = _interopRequireDefault(_componentJoinQueue);

var _chain = require('../chain');

var chain = _interopRequireWildcard(_chain);

var _middlewares = require('../middlewares');

var middleWares = _interopRequireWildcard(_middlewares);

var _options = require('../options');

var OPTION = _interopRequireWildcard(_options);

var _events3 = require('../events');

var EVENT = _interopRequireWildcard(_events3);

require('source-map-support').install();

var typeOf = function typeOf(object) {
	return Object.prototype.toString.call(object).replace(/\[object\s(\w+)\]/, '$1');
};

var IO_CONNECTION = 'connection';
var SOCKET_USER = 'user';

class BaseClient extends _events2['default'] {
	constructor(server) {
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
				writable: true,
				value: []
			},
			options: {
				enumerable: false,
				writable: true,
				value: _underscore2['default'].clone(options)
			},
			io: {
				enumerable: false,
				writable: true,
				value: (0, _socketIo2['default'])(server, (0, _deepExtend2['default'])({ maxHttpBufferSize: 1000 }, options[OPTION.IO] || {}))
			},
			EVENTS: {
				enumerable: false,
				writable: true,
				value: Object.create(null)
			},
			components: {
				enumerable: false,
				value: {
					Respond: null,
					joinQueue: null,
					Model: null
				}
			},
			//rooms:        {
			//	enumerable: false,
			//	writable:   true,
			//	value:      new Rooms()
			//},
			members: {
				enumerable: false,
				writable: true,
				value: new _members2['default']()
			}
		});
	}

	initialize() {
		var _this = this;

		this.emit('pre-initialize');

		this.db = new _dbIndex2['default'](this.options.db);

		this.initializeComponents();

		//this.io.on(IO_CONNECTION, (socket) => {});

		var _client = this;
		var wrapEventCallback = function wrapEventCallback(event, socket, data) {
			_client.invoke(event, socket, data);
		};

		this.namespace = this.io.of('/' + this.options[OPTION.NAMESPACE]);
		this.namespace.on(EVENT.IO_CONNECTION, function (socket) {
			for (var eventName in _this.EVENTS) {
				socket.on(eventName, (function (event) {
					return function () {
						var data = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

						wrapEventCallback(event, socket, data);
					};
				})(eventName));
			}

			socket.on(EVENT.ERROR, function (error) {
				console.log(error.stack);
			});

			socket.on(EVENT.OPTIONS, function () {
				var events = {};

				for (var eventName in _this.EVENTS) {
					events[_this.revertEventName(eventName)] = eventName;
				}

				socket.emit(EVENT.OPTIONS, { events: events });
			});

			socket.on('disconnect', function () {
				_this.members.remove(socket.user, socket);
				_this.logoutSocket(socket);
			});
		});

		this.__models = {
			Chat: (0, _modelsChat2['default'])(this, this.options.chat),
			Message: (0, _modelsMessage2['default'])(this, this.options.message)
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
		if (!this.components.Respond) this.register('Respond', _componentRespond2['default']);
		if (!this.components.joinQueue) this.register('joinQueue', new _componentJoinQueue2['default'](this));
	}

	get model() {
		return this.__models;
	}

	applyMiddleware(_Middleware) {
		if (!_Middleware.event) {
			(0, _debug.debug)('middleware not specified event name');
			return this;
		}

		_underscore2['default'].isFunction(_Middleware) ? this.use(_Middleware.event, _Middleware) : this.use(_Middleware.event, new _Middleware(this));

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
			(0, _debug.debug)('unUse: path not found');
			return this;
		}

		var index = this.middleware.pre.indexOf(obj);

		if (index !== -1) {
			this.middleware.pre.splice(index, 1);
		} else {
			(0, _debug.debug)('unuse: not found callback, already removed?');
		}

		return this;
	}

	unPost(path, obj) {
		if (!(path in this.middleware)) {
			(0, _debug.debug)('unPost: path not found');
			return this;
		}

		var index = this.middleware.post.indexOf(obj);

		if (index !== -1) {
			this.middleware.post.splice(index, 1);
		} else {
			(0, _debug.debug)('unuse: not found obj, already removed?');
		}

		return this;
	}

	preMiddleware(path, data) {
		var middleware = this.middleware[path] ? this.middleware[path].pre : [];

		return chain.exec(middleware, this, data)['catch'](function (error) {
			(0, _debug.debug)(error);
		});
	}

	postMiddleware(path, data) {
		var middleware = this.middleware[path] ? this.middleware[path].post : [];

		return chain.exec(middleware, this, data)['catch'](function (error) {
			(0, _debug.debug)(error);
		});
	}

	invoke(name, socket, data) {
		var _this2 = this;

		var promise = function promise(resolve, reject) {

			if (!(name in _this2.EVENTS)) {
				return reject();
			}

			chain.exec(_this2.EVENTS[name], _this2, socket, data)['catch'](function (error) {
				(0, _debug.debug)(error);
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
			var indexCb = undefined;

			if ((indexCb = this.EVENTS[name].indexOf(callback)) !== -1) {
				this.EVENTS[name].splice(indexCb, 1);
			}
		});

		return this;
	}

	eventName(name) {
		var _this3 = this;

		if (this.options[OPTION.NAMESPACE]) {
			var _ret = (function () {
				var prefix = _this3.options[OPTION.NAMESPACE];

				return {
					v: name.replace(/^(\w)/, function (firstChar) {
						return prefix + firstChar.toUpperCase();
					})
				};
			})();

			if (typeof _ret === 'object') return _ret.v;
		}

		return name;
	}

	revertEventName(name) {
		if (this.options[OPTION.NAMESPACE]) {
			var prefix = this.options[OPTION.NAMESPACE];

			return name.replace(prefix, '').replace(/^(\w)/, function (firstChar) {
				return firstChar.toLowerCase();
			});
		}

		return name;
	}

	socketAuthorized(socket, options, next) {
		return socket && socket.auth === true && socket[SOCKET_USER] && next();
	}

	logoutSocket(socket) {
		delete socket.auth;
		delete socket[SOCKET_USER];
	}

	getChat(id) {
		var _this4 = this;

		return new Promise(function (resolve, rejcet) {
			if (OPTION.CHAT_MEMORY in _this4.options) {} else {
				_this4.model.Chat.findById(id).then(function (chat) {
					resolve(chat);
				})['catch'](reject);
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

exports['default'] = BaseClient;
module.exports = exports['default'];
//# sourceMappingURL=base.js.map