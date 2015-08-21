import ProviderMap		from './provider-map';
import ProviderRedis    from './provider-redis';

class Memory {
	constructor(options = {}) {
		switch (options.provider) {
			case 'map':
				this.provider = new ProviderMap();
				break;
			case 'redis':
				this.provider = new Redis();
				break;
			default:
				this.provider = new ProviderRedis();
		}
	}

	getChat(id) {
		return this.provider.getChat();
	}
}

export default Memory;