export default class MArray extends Array {
	addToSet(value) {
		if (!~this.indexOf(value)) {
			this.push(value);
		}
	}

	pull(value) {
		let index = this.indexOf(value);

		if (index !== -1) {
			this.splice(index, 1);
		}
	}
}