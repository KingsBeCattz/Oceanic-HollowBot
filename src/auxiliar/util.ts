import { cpus } from 'node:os';
import type { APIEmoji } from 'discord-api-types/v10';
import type {
	AnyGuildChannel,
	Client,
	Guild,
	MessageActionRow
} from 'oceanic.js';
import { CommandTypes } from 'src/builders/command.builder';
import { CanvaUtil } from './canva.util';
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
	canva: CanvaUtil;

	constructor(public client: Client) {
		this.events = new EventManager(client);
		this.commands = new CommandManager();
		this.canva = new CanvaUtil();
	}

	get random() {
		return {
			number(max: number, min = 0, decimals = 0): number {
				if (!max) return 0;
				if (
					max === 0 ||
					max === min ||
					typeof max !== 'number' ||
					typeof min !== 'number'
				)
					return 0;
				const random = Math.random() * (max - min) + min;
				return Number(random.toFixed(decimals));
			},
			onArray<T>(array: T[], length = 1): T[] {
				if (!Array.isArray(array)) return [];
				const len = typeof length !== 'number' ? 1 : length;
				const arr: T[] = [];
				if (array.length < len) return array;
				let j = 0;
				do {
					const random = Math.floor(Math.random() * array.length);
					if (arr.includes(array[random]) === true) continue;
					arr.push(array[random]);
					j++;
				} while (j < len);
				return arr;
			}
		};
	}

	public command(name?: string) {
		if (!name) return null;
		return (
			(this.commands.get(name.toLowerCase()) ??
				this.commands.find(
					(c) =>
						c.data.name === name.toLowerCase() ||
						(c.data.alias || []).some((a) => a === name.toLowerCase())
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
		} catch (err) {
			log.error(
				err instanceof Error ? err.stack ?? String(err) : String(err),
				'SLASH.LOADER'
			);
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

	public defaultAvatar(user: {
		global_name: string | null;
		id: string;
		discriminator: string;
	}) {
		if (user.global_name) return Number((BigInt(user.id) >> 22n) % 6n);
		return Number(user.discriminator) % 5;
	}

	public async findUser(arg: string) {
		const id = arg.replace(/[^0-9]/g, '');

		return (
			this.client.users.get(id) ??
			this.client.users.find(
				(u) =>
					u.username.toLowerCase().includes(arg.toLowerCase()) ||
					u.globalName?.toLowerCase().includes(arg.toLowerCase())
			) ??
			this.client.rest.users.get(id).catch((e) => {
				log.error(String(e), 'UTIL.FINDUSER()');
				return null;
			})
		);
	}

	public async findMember(guild: string, arg: string) {
		if (!guild || !arg) return null;
		const id = arg.replace(/[^0-9]/g, '');

		return (
			this.client.guilds.get(guild)?.members.get(id) ??
			(this.client.guilds.get(guild) as Guild).members.find(
				(m) =>
					m.user.username.toLowerCase().includes(arg.toLowerCase()) ||
					m.user.globalName?.toLowerCase().includes(arg.toLowerCase())
			) ??
			null
		);
	}

	public async findChannel(
		guild: string,
		arg: string
	): Promise<AnyGuildChannel | null> {
		if (!guild || !arg) return null;
		const id = arg.replace(/[^0-9]/g, '');

		return (
			this.client.guilds.get(guild)?.channels.get(id) ??
			(this.client.guilds.get(guild) as Guild).channels.find((c) =>
				c.name.toLowerCase().includes(arg.toLowerCase())
			) ??
			null
		);
	}

	public ping() {
		return Number(
			(
				this.client.shards.map((s) => s.latency).reduce((a, b) => a + b) /
				this.client.shards.size
			).toFixed(2)
		);
	}

	public cpu(decimals = 2) {
		const cpu = cpus();
		const avgs = cpu.map((cpu) => {
			const total = Object.values(cpu.times).reduce((a, b) => a + b);
			const nonIdle = total - cpu.times.idle;
			return nonIdle / total;
		});
		return {
			model: cpu[0].model,
			usage: (avgs.reduce((a, b) => a + b) / cpu.length).toFixed(decimals)
		};
	}

	public cte(category: string): APIEmoji {
		switch (category) {
			case CommandTypes.Configuration:
				return {
					name: 'Gear',
					id: '1129677836421189662'
				};
			case CommandTypes.Fun:
				return {
					name: 'MagicWand',
					id: '1129670857506173031'
				};
			case CommandTypes.Developer:
				return {
					name: 'Developer',
					id: '1129670867044020295'
				};
			case CommandTypes.Information:
				return {
					name: 'Information',
					id: '1129672324895998002'
				};
			case CommandTypes.Staff:
				return {
					name: 'Staff',
					id: '1274250320276488214'
				};
			default:
				return {
					name: 'Box',
					id: '1274250845235581031'
				};
		}
	}

	public getOpT(type: number) {
		switch (type) {
			case 1:
				return 'Sub Command';
			case 2:
				return 'Sub Command Group';
			case 3:
				return 'String';
			case 4:
				return 'Integer';
			case 5:
				return 'Boolean';
			case 6:
				return 'User';
			case 7:
				return 'Channel';
			case 8:
				return 'Role';
			case 9:
				return 'Mentionable';
			case 10:
				return 'Number';
			case 11:
				return 'Attachment';
			default:
				return 'Unknown';
		}
	}

	public disable_components(components: MessageActionRow[], noLinks = true) {
		for (const row of components) {
			if (!row.components) continue;
			for (const component of row.components) {
				if (component.type === 2 && noLinks && component.style === 5) continue;
				component.disabled = true;
			}
		}

		return components;
	}

	public bot_permissions_emojis(permission: string) {
		switch (permission.toLowerCase()) {
			case 'developer':
				return '<:Developer:1129670867044020295>';

			default:
				return '<:Box:1274250845235581031>';
		}
	}
}
