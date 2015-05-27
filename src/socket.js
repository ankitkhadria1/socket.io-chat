(function () {
	"use strict";

	/**
	 * @mixin
	 */
	module.exports = {
		emitError: function (event, data) {
			this.emit(event, { error: data });
		},
		emitResult: function (event, data) {
			this.emit(event, { result: data });
		}
	};
}());