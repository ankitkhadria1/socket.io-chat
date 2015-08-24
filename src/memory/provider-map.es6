import { debug } from '../debug';
import Provider  from './provider';

const DEFAULT_TTL = 360000;

class ProviderMap extends Provider {
	constructor(options = {}) {
		super();

		this.chatTtl       = options.chatTtl || DEFAULT_TTL;
		this.maxCountChats = options.maxCountChats || null;

		this.chatsMap    = new Map();
		this.messagesMap = new Map();

		this._timeoutid = null;
	}

	updateNear() {
		this._timeoutid = setTimeout(function () {}, 1);
	}

	hasChat(chatModel) {
		// TODO: strict validate for chatModel? this.chatmap.get(Id) === chatModel
		return chatModel && this.chatsMap.has(String(chatModel._id));
	}

	addChat(chatModel) {
		if (this.maxCountChats !== null && this.chatsMap.size() > this.maxCountChats) {
			let oldTimestamp = Date.now();
			let oldId = null;

			for (wrap of this.chatsMap.values()) {
				if (wrap.timestamp + wrap.ttl < oldTimestamp) {
					oldTimestamp = wrap.timestamp + wrap.ttl;
					oldId = String(wrap.model._id);
				}
			}

			oldId && this.dumpAndClear(oldId);
		}

		if (!chatModel) {
			debug('ProviderMap addChat: chat model is empty');
			return this;
		}

		if (this.chatsMap.has(String(chatModel._id))) {
			debug('ProviderMap addChat: override exists chat in memory');
		}

		this.chatsMap.set(String(chatModel._id), { model: chatModel, ttl: this.chatTtl, timestamp: Date.now() });

		return this;
	}

	clearChat(id) {
		this.chatsMap.delete(String(id));

		return this;
	}

	getChat(id) {
		let wrap = this.chatsMap.get(String(id));

		if (wrap) {
			if (wrap.timestamp + wrap.chatTtl < Date.now()) {
				this.dumpAndClear(id);
				return null;
			}
		}

		return wrap;
	}

	dumpChat(id) {
		let wrap = this.getChat(id);

		if (!wrap) {
			debug('ProviderMap addChat: dump fail, chat not found');
			return this;
		}

		wrap.model.save();

		return this;
	}

	dumpAndClear(id) {
		this.dumpChat(id);
		this.clearChat(id);
	}
}

export default ProviderMap;