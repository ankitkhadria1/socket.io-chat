import fs from 'fs';
import _  from 'underscore';

class SchemaLoader {
	static load(schemaPath) {
		var schema = fs.readFileSync(schemaPath);

		return schema ? JSON.parse(schema) : null;
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
		let list = [],
			iterations = 0,
			limitIterations = 200;

		let walker = function (props, path = []) {
			if (iterations > limitIterations) {
				throw new Error('recursive walk schema for index')
			}

			_.each(props, function (props, key) {
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

	static readOnly(schema){
		var readonlyAttrs = [];
		var path          = [];

		function walk(properties) {
			_.each(properties, (prop, key) => {
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
}

export default SchemaLoader;