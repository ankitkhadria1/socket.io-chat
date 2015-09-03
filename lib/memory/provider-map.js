'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _debug = require('../debug');

var _provider = require('./provider');

var _provider2 = _interopRequireDefault(_provider);

var DEFAULT_TTL = 360000;

class ProviderMap extends _provider2['default'] {
	constructor() {
		var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

		super();

		this.chatTtl = options.chatTtl || DEFAULT_TTL;
		this.maxCountChats = options.maxCountChats || null;

		this.chatsMap = new Map();
		this.messagesMap = new Map();

		this._timeoutid = null;
	}

	updateNear() {
		this._timeoutid = setTimeout(function () {}, 1);
	}

	hasChat(chatModel) {
		// TODO: strict validate for chatModel? this.chatmap.get(Id) === chatModel
		return chatModel && this.chatsMap.has(String(chatModel._id));
	}

	addChat(chatModel) {
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

	clearChat(id) {
		this.chatsMap['delete'](String(id));

		return this;
	}

	getChat(id) {
		var wrap = this.chatsMap.get(String(id));

		if (wrap) {
			if (wrap.timestamp + wrap.chatTtl < Date.now()) {
				this.dumpAndClear(id);
				return null;
			}
		}

		return wrap;
	}

	dumpChat(id) {
		var wrap = this.getChat(id);

		if (!wrap) {
			(0, _debug.debug)('ProviderMap addChat: dump fail, chat not found');
			return this;
		}

		wrap.model.save();

		return this;
	}

	dumpAndClear(id) {
		this.dumpChat(id);
		this.clearChat(id);
	}
}

exports['default'] = ProviderMap;
module.exports = exports['default'];
//# sourceMappingURL=provider-map.js.map