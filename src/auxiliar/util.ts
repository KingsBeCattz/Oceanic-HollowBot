import type { APIEmoji } from 'discord-api-types/v10';
import type { Client } from 'oceanic.js';
import { CommandManager } from './command.manager';
import { EventManager } from './event.manager';
import * as log from './logger';

const badgets = {
	STAFF: 1n << 0n,
	PARTNER: 1n << 1n,
	HYPESQUAD: 1n << 2n,
	BUG_HUNTER_LEVEL_1: 1n << 3n,
	HYPESQUAD_ONLINE_HOUSE_1: 1n << 6n,
	HYPESQUAD_ONLINE_HOUSE_2: 1n << 7n,
	HYPESQUAD_ONLINE_HOUSE_3: 1n << 8n,
	PREMIUM_EARLY_SUPPORTER: 1n << 9n,
	TEAM_PSEUDO_USER: 1n << 10n,
	BUG_HUNTER_LEVEL_2: 1n << 14n,
	VERIFIED_BOT: 1n << 16n,
	VERIFIED_DEVELOPER: 1n << 17n,
	CERTIFIED_MODERATOR: 1n << 18n,
	BOT_HTTP_INTERACTIONS: 1n << 19n,
	ACTIVE_DEVELOPER: 1n << 22n
};

export class Util {
	commands: CommandManager;
	events: EventManager;

	constructor(public client: Client) {
		this.events = new EventManager(client);
		this.commands = new CommandManager();
	}

	public command(name?: string) {
		if (!name) return null;
		return (
			(this.commands.get(name.toLowerCase()) ??
				this.commands.find(
					(c) =>
						c.data.name === name.toLowerCase() ??
						c.data.alias?.some((a) => a === name.toLowerCase())
				)) ||
			null
		);
	}

	public async upload_slashes() {
		try {
			for (const slash of await this.client.application.getGlobalCommands()) {
				const command = this.command(slash.name);

				if (command) {
					const json = command.transform();
					const results: boolean[] = [];

					for (const K in json) {
						results.push(json[K] === slash[K]);
					}

					results.push(Bun.deepEquals(command.options, slash.options));

					if (results.some((r) => !r))
						this.client.application.editGlobalCommand(slash.id, command.transform());
					continue;
				}

				await slash.delete();
			}

			const slashes = await this.client.application.getGlobalCommands();
			for (const command of this.commands.values()) {
				if (
					!slashes.find(
						(s) => s.name.toLowerCase() === command.data.name.toLowerCase()
					)
				) {
					await this.client.application.createGlobalCommand(command.transform());
				}
			}

			log.info('All slashes loaded!', 'SLASH.LOADER');

			return true;
		} catch (e) {
			log.error(String(e), 'SLASH.LOADER');
			return false;
		}
	}

	public bitfield(bitfield: bigint): bigint[];
	public bitfield(bitfield: bigint[]): bigint;
	public bitfield(bitfield: MaybeArray<bigint>): MaybeArray<bigint> {
		if (Array.isArray(bitfield)) {
			return bitfield.reduce((a, b) => a | b);
		}

		const result: bigint[] = [];

		for (let i = 0n; i < 32n; i++) {
			const bitValue = 1n << i;
			if (bitfield & bitValue) {
				result.push(bitValue);
			}
		}

		return result;
	}

	public async appemojis() {
		return (
			(await this.client.rest.request({
				path: `/applications/${this.client.user.id}/emojis`,
				method: 'GET',
				auth: true
			})) as { items: APIEmoji[] }
		).items;
	}

	public format(type: 'number', value: number) {
		switch (type) {
			case 'number':
				return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		}
	}

	public badgets(flags: bigint): string[] {
		return Object.keys(badgets).filter((k) => (flags & badgets[k]) !== 0n);
	}
}
