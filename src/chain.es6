import _ from 'underscore';

export let exec = function (chain = [], data = {}) {
	return new Promise((resolve, reject) => {
		let index = 0;

		function next(error) {
			if (typeof error !== "undefined") {
				return reject(error);
			}

			let chainItem = chain[index];

			if (chainItem) {
				index++;
				return _.isObject(chainItem) ? chainItem.exec(data, next) : chainItem(data, next);
			}

			if (index === chain.length) {
				return resolve(data);
			}
		}

		if (!_.isArray(chain)) {
			debug('chain is not array');
			return resolve(data);
		}

		next();
	});
};