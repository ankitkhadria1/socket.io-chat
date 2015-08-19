class PPromise extends Promise {
	constructor (resolve, reject) {
		super(resolve, reject);
	}
}

class Client {
	test() {
		return new PPromise((resolve, reject, progress) => {
			console.log('promise', progress)
		})
	}
}

export default Client;