import { Dialog } from "./dialog";
import { iconDataStream, isKnownProofType } from "./icons";
import { HNUser } from "./users";

const dialog = new Dialog(document.body);
const hnusers = document.querySelectorAll('a.hnuser') as any as NodeListOf<HTMLAnchorElement>;

async function render(elm: HTMLElement) {
	const user = getHNUser(elm);
	const div = document.createElement('div');

	div.classList.add('hnwhois-user');
	elm.parentNode?.insertBefore(div, elm.nextSibling);

	const notes = document.createElement('a');
	notes.classList.add('hnwhois-user-link');
	notes.textContent = '⋯';

	const descr = await user.getDescr();
	if (descr.trim() != '') {
		notes.classList.add('hnwhois-user-link-seen');
		notes.textContent = '👁️';
		notes.title = descr;
		elm.title = descr;
	}

	notes.addEventListener('click', async () => {
		dialog.show(await user.getDescr(), (str) => {
			user.storeDescr(str);
			div.parentElement?.removeChild(div);
			render(elm);
		});
	});

	div.appendChild(notes);

	user.KeybaseLookup().then((keybase) => {
		for (const k of keybase.them) {
			div.insertBefore(serviceIcon(
				`https://news.ycombinator.com/user?id=${user.user}`,
				'hackernews'
			), notes);

			for (const proof of k.proofs_summary.all) {
				div.insertBefore(serviceIcon(
					proof.service_url,
					proof.proof_type
				), notes);
			}
		}
	});
};

function serviceIcon(url: string, service: string): HTMLAnchorElement {
	const link = document.createElement('a');
	link.href = url;

	const img = document.createElement('img');
	if (isKnownProofType(service)) {
		img.src = iconDataStream(service);
	} else {
		img.src = iconDataStream('unknown');
	}

	img.title = service + ' account';
	img.alt = img.title;

	link.appendChild(img);
	return link;
}

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
