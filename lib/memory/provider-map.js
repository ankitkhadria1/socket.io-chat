'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x2, _x3, _x4) { var _again = true; _function: while (_again) { var object = _x2, property = _x3, receiver = _x4; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x2 = parent; _x3 = property; _x4 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _debug = require('../debug');

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

var DEFAULT_TTL = 360000;

var ProviderMap = (function (_Provider) {
	_inherits(ProviderMap, _Provider);

	function ProviderMap() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		_classCallCheck(this, ProviderMap);

		_get(Object.getPrototypeOf(ProviderMap.prototype), 'constructor', this).call(this);

		this.chatTtl = options.chatTtl || DEFAULT_TTL;
		this.maxCountChats = options.maxCountChats || null;

		this.chatsMap = new Map();
		this.messagesMap = new Map();

		this._timeoutid = null;
	}

	_createClass(ProviderMap, [{
		key: 'updateNear',
		value: function updateNear() {
			this._timeoutid = setTimeout(function () {}, 1);
		}
	}, {
		key: 'hasChat',
		value: function hasChat(chatModel) {
			// TODO: strict validate for chatModel? this.chatmap.get(Id) === chatModel
			return chatModel && this.chatsMap.has(String(chatModel._id));
		}
	}, {
		key: 'addChat',
		value: function addChat(chatModel) {
			if (this.maxCountChats !== null && this.chatsMap.size() > this.maxCountChats) {
				var oldTimestamp = Date.now();
				var oldId = null;

				var _iteratorNormalCompletion = true;
				var _didIteratorError = false;
				var _iteratorError = undefined;

				try {
					for (var _iterator = this.chatsMap.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
						wrap = _step.value;

						if (wrap.timestamp + wrap.ttl < oldTimestamp) {
							oldTimestamp = wrap.timestamp + wrap.ttl;
							oldId = String(wrap.model._id);
						}
					}
				} catch (err) {
					_didIteratorError = true;
					_iteratorError = err;
				} finally {
					try {
						if (!_iteratorNormalCompletion && _iterator['return']) {
							_iterator['return']();
						}
					} finally {
						if (_didIteratorError) {
							throw _iteratorError;
						}
					}
				}

				oldId && this.dumpAndClear(oldId);
			}

			if (!chatModel) {
				(0, _debug.debug)('ProviderMap addChat: chat model is empty');
				return this;
			}

			if (this.chatsMap.has(String(chatModel._id))) {
				(0, _debug.debug)('ProviderMap addChat: override exists chat in memory');
			}

			this.chatsMap.set(String(chatModel._id), { model: chatModel, ttl: this.chatTtl, timestamp: Date.now() });

			return this;
		}
	}, {
		key: 'clearChat',
		value: function clearChat(id) {
			this.chatsMap['delete'](String(id));

			return this;
		}
	}, {
		key: 'getChat',
		value: function getChat(id) {
			var wrap = this.chatsMap.get(String(id));

			if (wrap) {
				if (wrap.timestamp + wrap.chatTtl < Date.now()) {
					this.dumpAndClear(id);
					return null;
				}
			}

			return wrap;
		}
	}, {
		key: 'dumpChat',
		value: function dumpChat(id) {
			var wrap = this.getChat(id);

			if (!wrap) {
				(0, _debug.debug)('ProviderMap addChat: dump fail, chat not found');
				return this;
			}

			wrap.model.save();

			return this;
		}
	}, {
		key: 'dumpAndClear',
		value: function dumpAndClear(id) {
			this.dumpChat(id);
			this.clearChat(id);
		}
	}]);

	return ProviderMap;
})(_provider2['default']);

exports['default'] = ProviderMap;
module.exports = exports['default'];
//# sourceMappingURL=provider-map.js.map