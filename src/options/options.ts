import { iconDataStream, icons } from "../content/icons";
import { isKnownProofType } from "../content/keybase";
import { descrPrefix, emojiPrefix, HNUser, isAValidPrefix } from "../content/users";

class NeverError extends Error {
	constructor(public readonly value: never, comment: string = "") {
		super(comment);
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const exportUserButton = document.getElementById('exportUserData') as HTMLButtonElement;

	const importUserData = document.getElementById('importUserData') as HTMLInputElement;
	const importUserDataButton = document.getElementById('importUserDataButton') as HTMLButtonElement;
	const importUserDataOutput = document.getElementById('importUserDataOutput') as HTMLOutputElement;

	const footer = document.querySelector('footer') as HTMLElement;

	for (const icon in icons) {
		const img = document.createElement('img');
		img.src = iconDataStream(icon as keyof typeof icons);
		footer.appendChild(img);
	}

	exportUserButton.addEventListener('click', () => {
		console.log('Exporting user data');
		chrome.storage.sync.get(null, function (items) {
			console.log(items);

			const isodate = new Date().toISOString();

			download(JSON.stringify(items, null, 4), 'application/json', `hootanym-export-${isodate}.json`);
		});
	});

	importUserDataOutput.textContent = '<error log>\n';

	importUserDataButton.disabled = true;
	importUserData.addEventListener('change', () => {
		importUserDataOutput.textContent = '<error log>\n';
		importUserDataButton.disabled = false;
	})

	importUserDataButton.addEventListener('click', () => {
		const file = importUserData.files?.[0];
		if (!file) {
			alert('No file selected');
			return;
		}

		const reader = new FileReader();
		reader.onload = function () {
			const data = reader.result as string;

			let json;
			try {
				json = JSON.parse(data);
			} catch (e) {
				importUserDataOutput.textContent += 'Parsed data is not an object\n';
				return;
			}

			if (!(typeof json === "object" && json !== null)) {
				importUserDataOutput.textContent += "Parsed data is not an object\n";
				return;
			}

			Object.keys(json).forEach((key) => {
				const value = json[key];
				if (typeof value !== "string") {
					importUserDataOutput.textContent += `Value for ${key} is not a string\n`;
					return;
				}

				const parts = key.split(":");
				console.log(parts);
				if (parts.length !== 3) {
					importUserDataOutput.textContent += `Key ${key} is invalid\n`;
					return;
				}

				const prefix = parts[0] ?? '';
				if (!isAValidPrefix(prefix)) {
					importUserDataOutput.textContent += `Prefix ${prefix} is unhandled\n`;
					return;
				}

				const service = parts[1] ?? '';
				if (!isKnownProofType(service)) {
					importUserDataOutput.textContent += `Service ${service} is unknown\n`;
					return;
				}

				const user = parts[2] ?? '';
				const hnuser = new HNUser(user, service);

				switch (prefix) {
					case descrPrefix:
						hnuser.storeDescr(value);
						break;
					case emojiPrefix:
						hnuser.storeEmoji(value);
						break;
					default:
						throw new NeverError(prefix);
				}
			});
		};

		reader.readAsText(file);
	});
});


function download(content: string, mimeType: string, filename: string): void {
	const a = document.createElement('a') // Create "a" element
	const blob = new Blob([content], { type: mimeType }) // Create a blob (file-like object)
	const url = URL.createObjectURL(blob) // Create an object URL from blob
	a.setAttribute('href', url) // Set "a" element link
	a.setAttribute('download', filename) // Set download filename
	a.click() // Start downloading
}
