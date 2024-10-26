import { UserInfo } from "./users";

export const emojis = ['👁️', '⭐', '🧙', '🔥', '👑', '🚨', '🛡️', '🐧', '💀', '🤖'] as const;

export const defaultEmoji = emojis[0];

export class Dialog {
	private dialog = document.createElement('dialog');
	private textarea = document.createElement('textarea');
	private emoji = document.createElement('ul');

	constructor(attach: Element) {
		this.dialog.classList.add('hnwhois-dialog');
		document.body.appendChild(this.dialog);

		this.dialog.appendChild(this.textarea);

		emojis.forEach(emoji => {
			this.emoji.appendChild(this.createLi(emoji));
		});

		this.dialog.appendChild(this.emoji);

		const button = document.createElement('button');
		button.textContent = 'Save';
		this.dialog.appendChild(button);

		button.addEventListener('click', () => {
			this.dialog.close();
		});

		attach.appendChild(this.dialog);

		this.dialog.addEventListener('close', () => {
			this.close({
				descr: this.textarea.value,
				emoji: this.getSelectedEmoji(),
			});
		});
	}

	private getSelectedEmoji(): string {
		const input = this.emoji.querySelector('input:checked') as HTMLInputElement;
		return input.value || defaultEmoji;
	}

	private setSelectedEmoji(emoji: string): void {
		const input = this.emoji.querySelector(`input[value="${emoji}"]`) as HTMLInputElement;
		if (input) {
			input.checked = true;
		}
	}

	private createLi(v: string): HTMLLIElement {
		const li = document.createElement('li');

		const lb = document.createElement('label');
		const rd = document.createElement('input');
		rd.type = 'radio';
		rd.name = 'hnwhois-emoji';
		rd.value = v;

		lb.appendChild(rd);
		lb.appendChild(document.createTextNode(v));

		li.appendChild(lb);

		return li;
	}

	private close = (_: UserInfo): void => {
		throw new Error('Unhandled close event');
	};

	public show(value: UserInfo, close: (value: UserInfo) => void) {
		this.textarea.value = value.descr;
		this.setSelectedEmoji(value.emoji);
		this.close = close;
		this.dialog.showModal();
	}

}
