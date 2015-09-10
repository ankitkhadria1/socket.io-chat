import { LABEL_PRIORITY }   from './options';
import { debug }            from './debug';
import Middleware           from './middlewares';
import _                    from 'underscore';

export let add = function (list) {
	function push(callback) {
		//if (callback.name === 'chatRecordCountMessages') {
		//	debug(callback.prototype instanceof Middleware);
		//}
		if (!_.isFunction(callback) && !(callback.prototype instanceof Middleware)) {
			return debug('add chain middleware: callback is not a function or Middleware instance', callback);
		}

		if (!callback.hasOwnProperty(LABEL_PRIORITY)) {
			Object.defineProperty(callback, LABEL_PRIORITY, {
				enumerable: false,
				value:      list.length + 1
			});
		}

		list.push(callback);
	}

	Array.prototype.slice.call(arguments, 1).forEach(function (middleware) {
		_.isArray(middleware) ? middleware.forEach(push) : push(middleware);
	});

	resort(list);
};

export let resort = function (list) {
	list.sort(function (middleware) {
		return parseInt(middleware[LABEL_PRIORITY], 10);
	})
};

export let exec = function (chain = [], context = {}) {
	return new Promise((resolve, reject) => {
		let index = 0;
		let data  = Array.prototype.slice.call(arguments, 2);

		function next(error) {
			if (typeof error !== "undefined") {
				return reject(error);
			}

			let chainItem = chain[index];

			if (chainItem) {
				index++;

				if (chainItem.prototype instanceof Middleware) {
					let _chainItem = new chainItem(context);
					return _chainItem.exec.apply(_chainItem, data.concat(next));
				} else {
					return chainItem.apply(context, data.concat(next))
				}
			}

			if (index === chain.length) {
				return resolve.apply({}, data);
			}
		}

		if (!_.isArray(chain)) {
			debug('chain is not array');
			return resolve(data);
		}

		next();
	});
};