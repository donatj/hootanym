export interface KeybaseAPI {
	readonly status: Status;
	readonly them: Them[];
}

export interface Status {
	readonly code: number;
	readonly name: string;
}

export interface Them {
	readonly basics: Basics;
	readonly proofs_summary: ProofsSummary;
}

export interface Basics {
	readonly username: Username;
	readonly ctime: number;
	readonly mtime: number;
	readonly id_version: number;
	readonly track_version: number;
	readonly last_id_change: number;
	readonly username_cased: Username;
	readonly status: number;
	readonly salt: string;
	readonly eldest_seqno: number;
}

export type Username = string;

export interface CryptocurrencyAddresses {}

export interface Device {
	readonly type: DeviceType;
	readonly ctime: number;
	readonly mtime: number;
	readonly name: string;
	readonly status: number;
	readonly keys: Key[];
}

export interface Key {
	readonly kid: string;
	readonly key_role: number;
	readonly sig_id: string;
}

export type DeviceType = string;

export interface Pictures {
	readonly primary: PicturesPrimary;
}

export interface PicturesPrimary {
	readonly url: string;
	readonly source: null;
}

export interface Profile {
	readonly mtime: null;
	readonly full_name: string;
	readonly location: string;
	readonly bio: string;
}

export interface ProofsSummary {
	readonly by_presentation_group: { [key: string]: Proof[] };
	readonly by_sig_id: { [key: string]: Proof };
	readonly all: Proof[];
	readonly has_web: boolean;
}

export interface Proof {
	readonly proof_type: string;
	readonly nametag: Username;
	readonly state: number;
	readonly service_url: string;
	readonly proof_url: string;
	readonly sig_id: string;
	readonly proof_id: string;
	readonly human_url: string;
	readonly presentation_group: string;
	readonly presentation_tag: string;
}

export interface PublicKeys {
	readonly primary: PublicKeysPrimary;
	readonly all_bundles: string[];
	readonly subkeys: string[];
	readonly sibkeys: string[];
	readonly families: { [key: string]: string[] };
	readonly eldest_kid: string;
	readonly eldest_key_fingerprint: string;
	readonly pgp_public_keys: string[];
}

export interface PublicKeysPrimary {
	readonly kid: string;
	readonly key_type: number;
	readonly bundle: string;
	readonly mtime: number;
	readonly ctime: number;
	readonly ukbid: string;
	readonly key_fingerprint: string;
	readonly key_bits: number;
	readonly key_algo: number;
	readonly signing_kid: string;
	readonly key_level: number;
	readonly etime: number;
	readonly eldest_kid: string;
	readonly status: number;
	readonly self_signed: boolean;
}

export interface Sigs {
	readonly last: Last;
}

export interface Last {
	readonly sig_id: string;
	readonly seqno: number;
	readonly payload_hash: string;
}

export interface Stellar {
	readonly hidden: boolean;
	readonly primary: StellarPrimary;
}

export interface StellarPrimary {
	readonly account_id: string;
}

export type KeybaseFrom = ProofTypes;

export function lookupKeybase(
	username: string,
	from: KeybaseFrom,
): Promise<KeybaseAPI> {
	return fetch(
		`https://keybase.io/_/api/1.0/user/lookup.json?${from}=${username}&fields=basics,proofs_summary`,
	)
		.then((response) => response.json())
		.then((json) => {
			return json;
		});
}

export function lookupKeybaseWithRetry(
	username: string,
	from: KeybaseFrom,
	retries: number = 3,
): Promise<KeybaseAPI> {
	return lookupKeybase(username, from).catch((err) => {
		if (retries > 0) {
			return new Promise((resolve) =>
				setTimeout(
					() =>
						resolve(
							lookupKeybaseWithRetry(username, from, retries - 1),
						),
					1000,
				),
			);
		}

		throw err;
	});
}

interface CacheWrapper<T> {
	readonly value: T;
	readonly expiry: number;
}

function isCacheWrapper<T>(value: unknown): value is CacheWrapper<T> {
	return (
		typeof value === "object" &&
		value !== null &&
		"value" in value &&
		value.value !== undefined &&
		"expiry" in value &&
		typeof value.expiry === "number"
	);
}

const cachePrefix = "cache:keybase:api:";
const cacheLimitBytes = 5 * 1024 * 1024;

async function trimCache(): Promise<void> {
	const items = await chrome.storage.local.get(null);
	const entries = Object.entries(items)
		.filter(([key]) => key.startsWith(cachePrefix))
		// Sort the new array in place for compatibility with older Chrome versions.
		// oxlint-disable-next-line unicorn/no-array-sort
		.sort(([, a], [, b]) => {
			const aExpiry = isCacheWrapper(a) ? a.expiry : 0;
			const bExpiry = isCacheWrapper(b) ? b.expiry : 0;
			return aExpiry - bExpiry;
		});
	const keys = entries
		.slice(0, Math.ceil(entries.length / 2))
		.map(([key]) => key);
	if (keys.length > 0) {
		await chrome.storage.local.remove(keys);
	}
}

export async function lookupKeybaseCached(
	username: string,
	from: KeybaseFrom,
): Promise<KeybaseAPI> {
	const cacheKey = `${cachePrefix}${from}:${username}`;

	try {
		const cached = (await chrome.storage.local.get(cacheKey))[cacheKey];
		if (isCacheWrapper<KeybaseAPI>(cached) && cached.expiry > Date.now()) {
			return cached.value;
		}
	} catch {
		// A cache failure should not prevent a fresh lookup.
	}

	const result = await lookupKeybaseWithRetry(username, from);
	const cache: CacheWrapper<KeybaseAPI> = {
		value: result,
		expiry: Date.now() + 1000 * 60 * 60 * 24,
	};

	try {
		if (
			(await chrome.storage.local.getBytesInUse(null)) >= cacheLimitBytes
		) {
			await trimCache();
		}
		await chrome.storage.local.set({ [cacheKey]: cache });
	} catch {
		// The lookup remains usable if it cannot be cached.
	}
	return result;
}

export const proof_types = [
	"keybase",
	"hackernews",
	"reddit",
	"github",
	"generic_web_site",
	"dns",
	"facebook",
	"twitter",
] as const;

export type ProofTypes = (typeof proof_types)[number];

export function isKnownProofType(type: string): type is ProofTypes {
	return proof_types.includes(type as ProofTypes);
}
