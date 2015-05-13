var fs = require('fs');

class SchemaLoader {
	load (schemaPath) {
		var schema = fs.readFileSync(schemaPath);

		if (schema) {
			return JSON.parse(schema);
		}

		return null;
	}
}

module.exports = SchemaLoader;