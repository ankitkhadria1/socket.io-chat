'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var fs = require('fs');

var SchemaLoader = (function () {
	function SchemaLoader() {
		_classCallCheck(this, SchemaLoader);
	}

	_createClass(SchemaLoader, [{
		key: 'load',
		value: function load(schemaPath) {
			var schema = fs.readFileSync(schemaPath);

			if (schema) {
				return JSON.parse(schema);
			}

			return null;
		}
	}]);

	return SchemaLoader;
})();

module.exports = SchemaLoader;
//# sourceMappingURL=schema.js.map