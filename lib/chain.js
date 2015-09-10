'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _options = require('./options');

var _debug = require('./debug');

var _middlewares = require('./middlewares');

var _middlewares2 = _interopRequireDefault(_middlewares);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var add = function add(list) {
	function push(callback) {
		//if (callback.name === 'chatRecordCountMessages') {
		//	debug(callback.prototype instanceof Middleware);
		//}
		if (!_underscore2['default'].isFunction(callback) && !(callback.prototype instanceof _middlewares2['default'])) {
			return (0, _debug.debug)('add chain middleware: callback is not a function or Middleware instance', callback);
		}

		if (!callback.hasOwnProperty(_options.LABEL_PRIORITY)) {
			Object.defineProperty(callback, _options.LABEL_PRIORITY, {
				enumerable: false,
				value: list.length + 1
			});
		}

		list.push(callback);
	}

	Array.prototype.slice.call(arguments, 1).forEach(function (middleware) {
		_underscore2['default'].isArray(middleware) ? middleware.forEach(push) : push(middleware);
	});

	resort(list);
};

exports.add = add;
var resort = function resort(list) {
	list.sort(function (middleware) {
		return parseInt(middleware[_options.LABEL_PRIORITY], 10);
	});
};

exports.resort = resort;
var exec = function exec() {
	var _arguments = arguments;
	var chain = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	var context = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	return new Promise(function (resolve, reject) {
		var index = 0;
		var data = Array.prototype.slice.call(_arguments, 2);

		function next(error) {
			if (typeof error !== "undefined") {
				return reject(error);
			}

			var chainItem = chain[index];

			if (chainItem) {
				index++;

				if (chainItem.prototype instanceof _middlewares2['default']) {
					var _chainItem = new chainItem(context);
					return _chainItem.exec.apply(_chainItem, data.concat(next));
				} else {
					return chainItem.apply(context, data.concat(next));
				}
			}

			if (index === chain.length) {
				return resolve.apply({}, data);
			}
		}

		if (!_underscore2['default'].isArray(chain)) {
			(0, _debug.debug)('chain is not array');
			return resolve(data);
		}

		next();
	});
};
exports.exec = exec;
//# sourceMappingURL=chain.js.map