'use strict';

(function () {
	"use strict";

	var fs = require('fs');
	var _ = require('underscore');

	class SchemaLoader {
		load(schemaPath) {
			var schema = fs.readFileSync(schemaPath);

			if (schema) {
				return JSON.parse(schema);
			}

			return null;
		}

		defaults(schema) {
			//console.time('defaults');

			var output = {};

			var walker = function walker(props, output) {
				_.each(props, function (prop, key) {
					if (prop.properties) {
						output[key] = {};
					}

					if (prop['default']) {
						if (_.isObject(prop['default']) && prop['default'].type) {

							output[key] = prop['default'].value ? global[prop['default'].type](prop['default'].value) : global[prop['default'].type]();
						} else if (_.isString(prop['default'])) {
							output[key] = ~['null', 'undefined'].indexOf(prop['default']) ? null : global[prop['default']]();
						}
					}

					if (prop.properties) {
						walker(prop.properties, output[key]);
					}
				});
			};

			walker(schema.properties, output);

			//console.timeEnd('defaults');

			return output;
		}
	}

	module.exports = SchemaLoader;
})();
//# sourceMappingURL=schema.js.map