'use strict';

Object.defineProperty(exports, '__esModule', {
	value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _underscore = require('underscore');

var _underscore2 = _interopRequireDefault(_underscore);

var _debug = require('./debug');

var slice = Array.prototype.slice;

// TODO: cache model props (defaults/index/readOnly/propPaths)

class SchemaLoader {
	static load(schemaName) {
		var schemaPath = _path2['default'].join(__dirname, '..', 'schema', schemaName + '.json');
		var schemaJSON = _fs2['default'].readFileSync(_path2['default'].resolve(schemaPath));

		var mockSchema = { properties: {} };

		if (schemaJSON) {
			try {
				return JSON.parse(schemaJSON);
			} catch (e) {
				(0, _debug.debug)('fail parse schema: ' + schemaName);
			}
		} else {
			(0, _debug.debug)('fail load schema: ' + schemaName);
		}
		return mockSchema;
	}

	static defaults(schema) {
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
						output[key] = ~['null', 'undefined'].indexOf(prop['default']) ? null : new global[prop['default']]();
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

	static index(schema) {
		var list = [],
		    iterations = 0,
		    limitIterations = 200;

		var walker = function walker(props) {
			var path = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

			if (iterations > limitIterations) {
				throw new Error('recursive walk schema for index');
			}

			_underscore2['default'].each(props, function (prop, key) {
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

	static readOnly(schema) {
		var paths = [];

		var walker = function walker(schema, path) {
			if (!schema.type) {
				return;
			}

			switch (schema.type.toLowerCase()) {
				case 'object':
					for (var prop in schema.properties) {
						if (!schema.properties.hasOwnProperty(prop)) continue;

						var _locPath = Array.prototype.slice.call(path || []);
						_locPath.push(prop);
						schema.properties[prop].readonly && paths.push(_locPath.join('.'));
						walker(schema.properties[prop], _locPath);
					}
					break;
				case 'array':
					var locPath = Array.prototype.slice.call(path || []);
					schema.readonly && paths.push(locPath.join('.'));
					walker(schema.items, locPath);
					break;
				default:
					{
						var _locPath2 = Array.prototype.slice.call(path || []);
						schema.readonly && paths.push(_locPath2.join('.'));
					}
			}
		};

		walker(schema);

		return paths;
	}

	static propPaths(schema) {
		var paths = [];

		var walker = function walker(schema, path) {
			if (!schema.type) {
				return;
			}

			switch (schema.type.toLowerCase()) {
				case 'object':
					for (var prop in schema.properties) {
						if (!schema.properties.hasOwnProperty(prop)) continue;

						var locPath = slice.call(path || []);
						locPath.push(prop);

						paths.push(locPath.join('.'));

						walker(schema.properties[prop], locPath);
					}
					break;
				case 'array':
					walker(schema.items, slice.call(path || []));
					break;
			}
		};

		walker(schema);

		return paths;
	}
}

exports['default'] = SchemaLoader;
module.exports = exports['default'];
//# sourceMappingURL=schema.js.map