'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var exec = function exec() {
	var chain = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];
	var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	return new Promise(function (resolve, reject) {
		var index = 0;

		function next(error) {
			if (typeof error !== "undefined") {
				return reject(error);
			}

			var chainItem = chain[index];

			if (chainItem) {
				index++;
				return _underscore2['default'].isObject(chainItem) ? chainItem.exec(data, next) : chainItem(data, next);
			}

			if (index === chain.length) {
				return resolve(data);
			}
		}

		if (!_underscore2['default'].isArray(chain)) {
			debug('chain is not array');
			return resolve(data);
		}

		next();
	});
};
exports.exec = exec;
//# sourceMappingURL=chain.js.map