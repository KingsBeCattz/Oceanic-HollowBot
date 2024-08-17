import {
	type AnyInteractionChannel,
	type ComponentInteraction,
	type ComponentTypes,
	type Interaction,
	type Message,
	type SelectMenuTypes,
	TypedEmitter,
	type Uncached
} from 'oceanic.js';

export interface InteractionCollectorEvents {
	collect: [
		interaction: ComponentInteraction<
			ComponentTypes.BUTTON | SelectMenuTypes,
			AnyInteractionChannel | Uncached
		>
	];
	end: [];
}

export class InteractionCollector extends TypedEmitter<InteractionCollectorEvents> {
	private listener: (i: Interaction) => unknown;
	private timeout: Timer;

	constructor(
		public message: Message,
		public time: number
	) {
		super();

		this.listener = (i) => {
			if (!i.isComponentInteraction() || i.message.id !== message.id) return;
			this.emit('collect', i);
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
