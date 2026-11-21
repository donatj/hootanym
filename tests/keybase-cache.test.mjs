import assert from "node:assert/strict";
import { test } from "node:test";
import { lookupKeybaseCached } from "../src/content/keybase.ts";

const prefix = "cache:keybase:api:hackernews:";
const result = { status: { code: 0, name: "OK" }, them: [] };

function setup(t, initial = {}, options = {}) {
	const items = structuredClone(initial);
	const calls = [];
	const previousChrome = globalThis.chrome;
	const previousFetch = globalThis.fetch;

	globalThis.chrome = {
		storage: {
			local: {
				async get(key) {
					if (options.failRead) throw new Error("Storage unavailable");
					return key === null ? { ...items } : { [key]: items[key] };
				},
				async getBytesInUse() {
					return options.bytesInUse ?? 0;
				},
				async set(values) {
					if (options.failWrite) throw new Error("Storage full");
					Object.assign(items, values);
				},
				async remove(keys) {
					for (const key of keys) delete items[key];
				},
			},
		},
	};
	globalThis.fetch = async (url) => {
		calls.push(new URL(url));
		return { json: async () => result };
	};
	t.after(() => {
		globalThis.chrome = previousChrome;
		globalThis.fetch = previousFetch;
	});

	return { items, calls };
}

test("uses an unexpired extension cache entry", async (t) => {
	const cached = { status: { code: 0, name: "OK" }, them: [{ id: "cached" }] };
	const { calls } = setup(t, {
		[`${prefix}sam`]: { value: cached, expiry: Date.now() + 60_000 },
	});

	assert.deepEqual(await lookupKeybaseCached("sam", "hackernews"), cached);
	assert.equal(calls.length, 0);
});

test("fetches limited fields and replaces an expired entry", async (t) => {
	const { items, calls } = setup(t, {
		[`${prefix}sam`]: { value: result, expiry: Date.now() - 1 },
	});

	assert.deepEqual(await lookupKeybaseCached("sam", "hackernews"), result);
	assert.equal(calls.length, 1);
	assert.equal(calls[0].searchParams.get("hackernews"), "sam");
	assert.equal(calls[0].searchParams.get("fields"), "basics,proofs_summary");
	assert.deepEqual(items[`${prefix}sam`].value, result);
	assert.ok(items[`${prefix}sam`].expiry > Date.now());
});

test("trims old cache entries without removing other extension data", async (t) => {
	const now = Date.now();
	const { items } = setup(
		t,
		{
			[`${prefix}expired`]: { value: result, expiry: now - 1 },
			[`${prefix}old`]: { value: result, expiry: now + 1_000 },
			[`${prefix}newer`]: { value: result, expiry: now + 2_000 },
			[`${prefix}newest`]: { value: result, expiry: now + 3_000 },
			unrelated: "keep",
		},
		{ bytesInUse: 5 * 1024 * 1024 },
	);

	await lookupKeybaseCached("sam", "hackernews");
	assert.equal(items[`${prefix}expired`], undefined);
	assert.equal(items[`${prefix}old`], undefined);
	assert.ok(items[`${prefix}newer`]);
	assert.ok(items[`${prefix}newest`]);
	assert.deepEqual(items[`${prefix}sam`].value, result);
	assert.equal(items.unrelated, "keep");
});

test("returns fresh results when cache reads or writes fail", async (t) => {
	const { calls, items } = setup(t, {}, { failRead: true, failWrite: true });

	assert.deepEqual(await lookupKeybaseCached("sam", "hackernews"), result);
	assert.equal(calls.length, 1);
	assert.equal(items[`${prefix}sam`], undefined);
});
