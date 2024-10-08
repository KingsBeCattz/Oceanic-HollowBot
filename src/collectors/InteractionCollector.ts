import {
	type AnyInteractionChannel,
	type Client,
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
		interaction:
			| ComponentInteraction<
					ComponentTypes.BUTTON,
					Uncached | AnyInteractionChannel
			  >
			| ComponentInteraction<SelectMenuTypes, Uncached | AnyInteractionChannel>
	];
	end: [code: number];
}

export class InteractionCollector extends TypedEmitter<InteractionCollectorEvents> {
	private listener: (i: Interaction) => unknown;
	private timeout: Timer;

	constructor(
		public message: Message,
		public client: Client,
		public time: number
	) {
		super();

		this.listener = (i) => {
			if (!i.isComponentInteraction() || i.message.id !== message.id) return;
			this.emit ? this.emit('collect', i) : undefined;
		};

		client.addListener('interactionCreate', this.listener);

		this.timeout = setTimeout(() => this.clear(), time);
	}

	async clear(code = 0) {
		clearTimeout(this.timeout);
		this.client?.removeListener('interactionCreate', this.listener);
		this.emit ? this.emit('end', code) : undefined;
	}
}
