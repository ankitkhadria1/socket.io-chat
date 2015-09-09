"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.slice = slice;
exports.typeOf = typeOf;
exports.unique = unique;
exports.unique_m = unique_m;

function slice(arr) {
	return Array.prototype.slice.call(arr);
}

function typeOf(object) {
	return Object.prototype.toString.call(object).slice(8, -1);
}

function unique() {
	var arr = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

	var values = [];

	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = arr[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			value = _step.value;

			if (values.indexOf(value) === -1) {
				values.push(value);
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator["return"]) {
				_iterator["return"]();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	return values;
}

function unique_m() {
	var arr = arguments.length <= 0 || arguments[0] === undefined ? [] : arguments[0];

	var values = [];
	var indexes = [];
	var i = 0;

	arr.forEach(function (value, key) {
		if (values.indexOf(value) === -1) {
			values.push(value);
		} else {
			indexes.push(key);
		}
	});

	console.log(indexes);

	indexes.forEach(function (index) {
		arr.splice(index - i, 1);
		i++;
	});
}
//# sourceMappingURL=utils.js.map