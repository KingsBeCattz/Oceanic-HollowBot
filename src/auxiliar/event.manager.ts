import { existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Client, type ClientEvents, Collection } from 'oceanic.js';
import type { Event } from 'src/builders/event.builder';
import * as log from './logger';

export class EventManager extends Collection<
	string,
	Event<keyof ClientEvents>
> {
	constructor(public client: Client) {
		super();
	}

	private async _load(path: string) {
		const globalpath = join(process.cwd(), path);
		if (!existsSync(globalpath)) mkdirSync(globalpath);
		for (const route of readdirSync(globalpath)) {
			const module = join(globalpath, route);

			if (lstatSync(module).isDirectory()) {
				this._load(join(path, route));
				continue;
			}

			delete require.cache[require(module)];
			const event: MaybeArray<Event<keyof ClientEvents>> = require(module).default;

			if (Array.isArray(event))
				for (const ev of event) {
					if (!ev || !ev.name) continue;
					this.set(ev.name, ev);
					this.client[ev.once ? 'once' : 'on'](ev.name, ev.listener);
				}
			else {
				if (!event || !event.name) continue;
				this.set(event.name, event);
				this.client[event.once ? 'once' : 'on'](event.name, event.listener);
			}
		}
	}

	async load(path: string) {
		try {
			await this._load(path);

			if (!this.size) {
				log.warn(
					'The event folder was read but there are no events',
					'EventManager.Load'
				);
				return;
			}

			const events: string[] = [];

			for (const event of this.values()) {
				events.push(`${event.name}${event.once ? ' (Once)' : ''}`);
			}

			log.info(`Events loaded:\n\t${events.join('\n\t')}`, 'EventManager.Load');
		} catch (e) {
			log.error(String(e), 'EventManager.Load');
		}
	}
}
