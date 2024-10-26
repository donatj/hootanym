import { defaultEmoji } from "./dialog";
import { KeybaseAPI, lookupKeybaseCached, ProofTypes } from "./keybase";

export interface UserInfo {
	descr: string;
	emoji: string;
}

export const descrPrefix = 'identity' as const;
export const emojiPrefix = 'emoji' as const;
export type prefixes = typeof emojiPrefix | typeof descrPrefix;

export function isAValidPrefix(prefix: string): prefix is prefixes {
	return prefix === descrPrefix || prefix === emojiPrefix;
}


export class HNUser {

	constructor(
		public readonly user: string,
		public readonly type : ProofTypes = 'hackernews'
	) { }

	private descrKey(): string {
		return `${descrPrefix}:${this.type}:${this.user}`;
	}

	private emojiKey(): string {
		return `${emojiPrefix}:${this.type}:${this.user}`;
	}

	public async store(info: UserInfo) {
		// store emoji first because storeDescr will remove it if descr is empty
		await this.storeEmoji(info.emoji);
		await this.storeDescr(info.descr);
	}

	public async storeDescr(descr: string) {
		descr = descr.trim();

		if(descr == '') {
			await chrome.storage.sync.remove(this.descrKey());
			await chrome.storage.sync.remove(this.emojiKey());

			return;
		}

		await chrome.storage.sync.set({ [this.descrKey()]: descr.trim() });
	}

	public async storeEmoji(emoji: string) {
		await chrome.storage.sync.set({ [this.emojiKey()]: emoji });
	}

	public async getInfo(): Promise<UserInfo> {
		const descr = await chrome.storage.sync.get(this.descrKey());
		const emoji = await chrome.storage.sync.get(this.emojiKey());

		return {
			descr: (descr[this.descrKey()] || '').trim(),
			emoji: emoji[this.emojiKey()] || defaultEmoji,
		};
	}

	public KeybaseLookup(): Promise<KeybaseAPI> {
		return lookupKeybaseCached(this.user, this.type);
	}
}
