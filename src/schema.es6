import fs        from 'fs';
import path      from 'path';
import _         from 'underscore';
import { debug } from './debug';

var slice = Array.prototype.slice;

// TODO: cache model props (defaults/index/readOnly/propPaths)

class SchemaLoader {
	static load(schemaName) {
		let schemaPath = path.join(__dirname, '..', 'schema', schemaName + '.json');
		let schemaJSON = fs.readFileSync(path.resolve(schemaPath));

		let mockSchema = { properties: {} };

		if (schemaJSON) {
			try {
				return JSON.parse(schemaJSON);
			} catch (e) {
				debug('fail parse schema: ' + schemaName);

			}
		} else {
			debug('fail load schema: ' + schemaName);
		}
		return mockSchema;
	}

	static defaults(schema) {
		var output = {};

		var walker = function (props, output) {
			_.each(props, function (prop, key) {
				if (prop.properties) {
					output[key] = {};
				}

				if (prop.default) {
					if (_.isObject(prop.default) && prop.default.type) {

						output[key] = prop.default.value
							? global[prop.default.type](prop.default.value)
							: global[prop.default.type]();

					} else if (_.isString(prop.default)) {
						output[key] = ~['null', 'undefined'].indexOf(prop.default)
							? null
							: global[prop.default]();
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
		let list            = [],
			iterations      = 0,
			limitIterations = 200;

		let walker = function (props, path = []) {
			if (iterations > limitIterations) {
				throw new Error('recursive walk schema for index')
			}

			_.each(props, function (prop, key) {
				if (prop.index) {
					// TODO: if nested properties?
					path.push(key);
					list.push({
						[path.join('.')]: prop.index
					})
				}

				if (prop.properties) {
					path.push(key);
					iterations++;
					walker(prop.properties, path)
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
		let paths = [];

		var walker = function (schema, path) {
			if (!schema.type) {
				return;
			}

			switch (schema.type.toLowerCase()) {
				case 'object':
					for (let prop in schema.properties) {
						if (!schema.properties.hasOwnProperty(prop)) continue;

						let locPath = Array.prototype.slice.call(path || []);
						locPath.push(prop);
						schema.readonly && paths.push(locPath.join('.'));
						walker(schema.properties[prop], locPath);
					}
					break;
				case 'array':
					let locPath = Array.prototype.slice.call(path || []);
					schema.readonly && paths.push(locPath.join('.'));
					walker(schema.items, locPath);
					break;
				default: {
					let locPath = Array.prototype.slice.call(path || []);
					schema.readonly && paths.push(locPath.join('.'));
				}
			}
		};

		walker(schema);

		return paths;
	}

	static propPaths(schema) {
		let paths = [];

		var walker = function (schema, path) {
			if (!schema.type) {
				return;
			}

			switch (schema.type.toLowerCase()) {
				case 'object':
					for (let prop in schema.properties) {
						if (!schema.properties.hasOwnProperty(prop)) continue;

						let locPath = slice.call(path || []);
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

export default SchemaLoader;