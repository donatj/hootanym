import { Dialog } from "./dialog";
import { iconDataStream, isKnownProofType } from "./icons";
import { lookupKeybaseCached } from "./keybase";

class HNUser {
	constructor(public readonly user: string) { }

	public key(): string {
		return `hnuser:${this.user}`;
	}

	public store(descr: string) {
		descr = descr.trim();

		if (descr == '') {
			return chrome.storage.sync.remove(this.key());
		}

		return chrome.storage.sync.set({ [this.key()]: descr.trim() });
	}

	public async get(): Promise<string> {
		const value = await chrome.storage.sync.get(this.key());
		return value[this.key()] || '';
	}
}

const dialog  = new Dialog(document.body);
const hnusers = document.querySelectorAll('a.hnuser') as any as NodeListOf<HTMLAnchorElement>;

async function render(elm : HTMLElement) {
	const user = getHNUser(elm);
	const div = document.createElement('div');

	div.classList.add('hnwhois-user');
	elm.parentNode?.insertBefore(div, elm.nextSibling);

	const notes = document.createElement('a');
	notes.classList.add('hnwhois-user-link');
	notes.textContent = '⋯';

	const descr = await user.get();
	if (descr.trim() != '') {
		notes.classList.add('hnwhois-user-link-seen');
		notes.textContent = '👁️';
		notes.title = descr;
		elm.title = descr;
	}

	notes.addEventListener('click', async () => {
		dialog.show(await user.get(), (str) => {
			user.store(str);
			div.parentElement?.removeChild(div);
			render(elm);
		});
	});

	div.appendChild(notes);

	lookupKeybaseCached(user.user, 'hackernews').then((keybase) => {
		for (const k of keybase.them) {
			const link = document.createElement('a');
			link.href = `https://keybase.io/${k.basics.username}`;
			const img = document.createElement('img');
			img.src = iconDataStream('keybase');
			link.appendChild(img);

			div.insertBefore(link, notes);

			for (const proof of k.proofs_summary.all) {
				const link = document.createElement('a');
				link.href = proof.service_url;
				const img = document.createElement('img');

				if (isKnownProofType(proof.proof_type)) {
					img.src = iconDataStream(proof.proof_type);
				} else {
					img.src = iconDataStream('unknown');
				}

				link.appendChild(img);

				div.insertBefore(link, notes);
			}
		}
	});
};

hnusers.forEach(render);

function getHNUser(elm: Element): HNUser {
	const link = elm.getAttribute('href') || '';
	if (link != '') {
		const url = new URL(link, window.location.href);
		const user = url.searchParams.get('id');
		if (user) {
			return new HNUser(user);
		}
	}

	throw new Error('Could not parse HN user');
}
