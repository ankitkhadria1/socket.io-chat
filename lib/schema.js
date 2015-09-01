'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var SchemaLoader = (function () {
	function SchemaLoader() {
		_classCallCheck(this, SchemaLoader);
	}

	_createClass(SchemaLoader, null, [{
		key: 'load',
		value: function load(schemaPath) {
			var schema = _fs2['default'].readFileSync(schemaPath);

			return schema ? JSON.parse(schema) : null;
		}
	}, {
		key: 'defaults',
		value: function defaults(schema) {
			var output = {};

			var walker = function walker(props, output) {
				_underscore2['default'].each(props, function (prop, key) {
					if (prop.properties) {
						output[key] = {};
					}

					if (prop['default']) {
						if (_underscore2['default'].isObject(prop['default']) && prop['default'].type) {

							output[key] = prop['default'].value ? global[prop['default'].type](prop['default'].value) : global[prop['default'].type]();
						} else if (_underscore2['default'].isString(prop['default'])) {
							output[key] = ~['null', 'undefined'].indexOf(prop['default']) ? null : global[prop['default']]();
						}
					}

					if (prop.properties) {
						walker(prop.properties, output[key]);
					}
				});
			};

			walker(schema.properties, output);

			return output;
		}
	}, {
		key: 'index',
		value: function index(schema) {
			var list = [],
			    iterations = 0,
			    limitIterations = 200;

			var walker = function walker(props) {
				var path = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

				if (iterations > limitIterations) {
					throw new Error('recursive walk schema for index');
				}

				_underscore2['default'].each(props, function (props, key) {
					if (prop.index) {
						// TODO: if nested properties?
						path.push(key);
						list.push(_defineProperty({}, path.join('.'), prop.index));
					}

					if (prop.properties) {
						path.push(key);
						iterations++;
						walker(prop.properties, path);
					}

					if (prop.items && prop.items.properties) {
						path.push(key);
						iterations++;
						walker(prop.items.properties, path);
					}
				});
			};

			walker(schema.properties);

			return list;
		}
	}, {
		key: 'readOnly',
		value: function readOnly(schema) {
			var readonlyAttrs = [];
			var path = [];

			function walk(properties) {
				_underscore2['default'].each(properties, function (prop, key) {
					path.push(key);

					if (prop.readonly) {
						readonlyAttrs.push(path.join('.'));
					}

					if (prop.properties) {
						walk(prop.properties);
					} else {
						path = [];
					}
				});
			}

			walk(schema.properties);

			return readonlyAttrs;
		}
	}]);

	return SchemaLoader;
})();

exports['default'] = SchemaLoader;
module.exports = exports['default'];
//# sourceMappingURL=schema.js.map