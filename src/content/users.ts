import { KeybaseAPI, lookupKeybaseWithRetry, ProofTypes } from "./keybase";

export class HNUser {

	constructor(
		public readonly user: string,
		public readonly type : ProofTypes = 'hackernews'
	) { }

	public key(): string {
		return `identity:${this.type}:${this.user}`;
	}

	public storeDescr(descr: string) {
		descr = descr.trim();

		if (descr == '') {
			return chrome.storage.sync.remove(this.key());
		}

		return chrome.storage.sync.set({ [this.key()]: descr.trim() });
	}

	public async getDescr(): Promise<string> {
		const value = await chrome.storage.sync.get(this.key());
		return value[this.key()] || '';
	}

	public KeybaseLookup(): Promise<KeybaseAPI> {
		return lookupKeybaseWithRetry(this.user, this.type);
	}
}
