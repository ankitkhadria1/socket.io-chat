'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _socketIo = require('socket.io');

var _socketIo2 = _interopRequireDefault(_socketIo);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _deepExtend = require('deep-extend');

var _deepExtend2 = _interopRequireDefault(_deepExtend);

var _debug = require('./debug');

var _modelsChat = require('./models/chat');

var _modelsChat2 = _interopRequireDefault(_modelsChat);

var _modelsMessage = require('./models/message');

var _modelsMessage2 = _interopRequireDefault(_modelsMessage);

var _members = require('./members');

var _members2 = _interopRequireDefault(_members);

var _rooms = require('./rooms');

var _rooms2 = _interopRequireDefault(_rooms);

var _memory = require('./memory');

var _memory2 = _interopRequireDefault(_memory);

var _dbIndex = require('./db/index');

var _dbIndex2 = _interopRequireDefault(_dbIndex);

var _middlewares = require('./middlewares');

var middleWares = _interopRequireWildcard(_middlewares);

var _options = require('./options');

var OPTION = _interopRequireWildcard(_options);

var _events3 = require('./events');

var EVENT = _interopRequireWildcard(_events3);

var IO_CONNECTION = 'connection';
var SOCKET_USER = 'user';

var BaseClient = (function (_EventEmitter) {
	_inherits(BaseClient, _EventEmitter);

	function BaseClient(server) {
		var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

		_classCallCheck(this, BaseClient);

		_get(Object.getPrototypeOf(BaseClient.prototype), 'constructor', this).call(this);

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

		this.__middleware = [];
		this._options = _underscore2['default'].clone(options);
		this._io = (0, _socketIo2['default'])(server, _underscore2['default'].extend({ maxHttpBufferSize: 1000 }, this._options[OPTION.IO] || {}));
		this.EVENTS = Object.create(null);
		this.rooms = new _rooms2['default']();
		this.members = new _members2['default']();
	}

	_createClass(BaseClient, [{
		key: 'initialize',
		value: function initialize() {
			var _this = this;

			this.emit('pre-initialize');

			this._db = new _dbIndex2['default'](this._options.db);
			this._io.on(IO_CONNECTION, function (socket) {
				for (var _name in _this.EVENTS) {
					var eventName = _this.eventName(_name);

					socket.on(eventName, _this.EVENTS[eventName]);
				}

				socket.on('disconnect', function () {
					_this.logoutSocket(socket);
					_this.members.remove(socket[SOCKET_USER], socket);
				});
			});

			this.__models = {
				Chat: (0, _modelsChat2['default'])(this._db, this._options.chat || {}),
				Message: (0, _modelsMessage2['default'])(this._db, this._options.message || {})
			};

			if (this._options[OPTION.CHAT_MEMORY]) {
				this._memoryChat = new _memory2['default']({
					provider: this._options[OPTION.CHAT_MEMORY_PROVIDER],
					ttl: this._options[OPTION.CHAT_MEMORY_TTL]
				});
			}

			this.emit('initialize');
		}
	}, {
		key: 'applyMiddleware',
		value: function applyMiddleware(_Middleware) {
			if (!_Middleware.event) {
				(0, _debug.debug)('middleware not specified event name');
				return this;
			}

			this.use(_Middleware.event, new _Middleware(this));

			return this;
		}
	}, {
		key: 'use',
		value: function use(path, middleware) {
			if (!this.__middleware[path]) {
				this.__middleware[path] = [];
			}

			this.__middleware[path].push(middleware);

			return this;
		}
	}, {
		key: 'unuse',
		value: function unuse(path, callback) {
			if (!(path in this.__middleware)) {
				(0, _debug.debug)('unuse: path not found');
				return this;
			}

			var index = this.__middleware.indexOf(callback);

			if (index !== -1) {
				this.__middleware.splice(index, 1);
			} else {
				(0, _debug.debug)('unuse: not found callback, already removed?');
			}

			return this;
		}
	}, {
		key: 'useMiddleware',
		value: function useMiddleware(path, data) {
			var middleware = this.__middleware[path] || [],
			    index = 0;

			return new Promise(function (resolve, reject) {
				function next(error) {
					if (typeof error !== "undefined") {
						return reject(error);
					}

					var _middleware = middleware[index];

					if (_middleware) {
						index++;
						return _underscore2['default'].isObject(_middleware) ? _middleware.exec(data, next) : _middleware(data, next);
					}

					if (index === middleware.length) {
						return resolve(data);
					}
				}

				next();
			});
		}
	}, {
		key: 'invoke',
		value: function invoke(name) {}
	}, {
		key: 'addEvent',
		value: function addEvent(name) {
			var callbacks = Array.prototype.slice.call(arguments, 1);

			if (!this.EVENTS[name]) {
				this.EVENTS[name] = [];
			}

			callbacks.forEach(function (callback) {
				if (callback instanceof Function) {
					this.EVENTS[name].push(callback);
				}
			});

			return this;
		}
	}, {
		key: 'removeEvent',
		value: function removeEvent(name) {
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
	}, {
		key: 'eventName',
		value: function eventName(name) {
			var _this2 = this;

			if (this._options[OPTION.EVENT_PREFIX]) {
				var _ret = (function () {
					var prefix = _this2._options[OPTION.EVENT_PREFIX];

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
	}, {
		key: 'socketAuthorized',
		value: function socketAuthorized(socket) {
			return socket && socket.auth === true && socket[SOCKET_USER];
		}
	}, {
		key: 'logoutSocket',
		value: function logoutSocket(socket) {
			delete socket.auth;
			delete socket[SOCKET_USER];
		}
	}, {
		key: 'getChat',
		value: function getChat(id) {
			var _this3 = this;

			return new Promise(function (resolve, rejcet) {
				if (OPTION.CHAT_MEMORY in _this3._options) {} else {
					_this3.model.Chat.findById(id).then(function (chat) {
						resolve(chat);
					})['catch'](reject);
				}
			});
		}
	}, {
		key: 'io',
		get: function get() {
			return this._io;
		}
	}, {
		key: 'model',
		get: function get() {
			return this.__models;
		}
	}]);

	return BaseClient;
})(_events2['default']);

exports['default'] = BaseClient;
module.exports = exports['default'];
//# sourceMappingURL=baseClient.js.map