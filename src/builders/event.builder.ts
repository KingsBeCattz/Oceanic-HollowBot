import type { ClientEvents } from 'oceanic.js';

export class Event<Event extends keyof ClientEvents> {
	name: Event;
	listener: (...args: ClientEvents[Event]) => MaybePromise<void>;
	once: boolean;

	constructor(
		name: Event,
		listener: (...args: ClientEvents[Event]) => MaybePromise<void>,
		once = false
	) {
		this.name = name;
		this.listener = listener;
		this.once = once;
	}
}
