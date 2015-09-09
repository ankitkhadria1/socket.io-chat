export function slice (arr) {
	return Array.prototype.slice.call(arr);
}

export function typeOf(object) {
	return Object.prototype.toString.call(object).slice(8, -1);
}

export function unique(arr = []) {
	let values = [];

	for (value of arr) {
		if (values.indexOf(value) === -1) {
			values.push(value);
		}
	}

	return values;
}

export function unique_m(arr = []) {
	let values = [];
	let indexes = [];
	let i = 0;

	arr.forEach(function (value, key) {
		if (values.indexOf(value) === -1) {
			values.push(value);
		} else {
			indexes.push(key)
		}
	});

	console.log(indexes);

	indexes.forEach(function (index) {
		arr.splice(index - i, 1);
		i++;
	});
}