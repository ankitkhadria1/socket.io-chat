'use strict';

(function () {
	'use strict';

	class ClientError extends Error {
		constructor(message, type) {
			super(message);

			this.message = message;
			this.type = type || 'client';
		}
	}

	module.exports = ClientError;
})();
//# sourceMappingURL=error.js.map