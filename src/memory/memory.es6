import MemoryMap from './Map';
import Redis     from './Redis';

class Memory {
	constructor(options = {}) {
		switch (options.provider) {
			case 'map':
				this.provider = new MemoryMap();
				break;
			case 'redis':
				this.provider = new Redis();
				break;
			default:
				this.provider = new MemoryMap();
		}
	}
}

export default Memory;