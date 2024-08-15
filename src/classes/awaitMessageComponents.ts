import {
	type ComponentInteraction,
	type Interaction,
	type Message,
	TypedEmitter
} from 'oceanic.js';

export interface awaitMessageComponentsEvents {
	collect: [interaction: ComponentInteraction];
	end: [];
}

export class awaitMessageComponents extends TypedEmitter<awaitMessageComponentsEvents> {
	private listener: (i: Interaction) => unknown;
	private timeout: Timer;

	constructor(
		public message: Message,
		public time: number
	) {
		super();

		this.listener = (i) => {
			if (!i.isComponentInteraction() || i.message.id !== message.id) return;
		};

		message.client.on('interactionCreate', this.listener);

		this.timeout = setTimeout(() => {
			this.message.client.removeListener('interactionCreate', this.listener);
			this.emit('end');
		}, time);
	}

	async clear() {
		clearTimeout(this.timeout);
	}
}
