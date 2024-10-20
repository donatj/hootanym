export class Dialog {
	private dialog: HTMLDialogElement;
	private textarea: HTMLTextAreaElement;

	constructor(attach: Element) {
		this.dialog = document.createElement('dialog');
		document.body.appendChild(this.dialog);

		this.textarea = document.createElement('textarea');
		this.textarea.style.minWidth = '40vw';
		this.textarea.style.minHeight = '5em';
		this.dialog.appendChild(this.textarea);

		const button = document.createElement('button');
		button.textContent = 'Save';
		this.dialog.appendChild(button);
		button.style.display = 'block';
		button.style.margin = 'auto';
		button.style.marginTop = '10px';

		button.addEventListener('click', () => {
			this.dialog.close();
		});

		attach.appendChild(this.dialog);

		this.dialog.addEventListener('close', () => {
			this.close(this.textarea.value);
		});
	}

	private close = (_: string): void => {
		throw new Error('Unhandled close event');
	};

	public show(text: string, close: (value: string) => void) {
		this.textarea.value = text;
		this.close = close;
		this.dialog.showModal();
	}

}
