import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { get, set } from 'lodash';
import type {
	Client,
	CommandInteraction,
	CreateMessageOptions,
	Guild,
	InteractionContent,
	User
} from 'oceanic.js';
import { Message } from 'oceanic.js';
import type { Database } from 'src/auxiliar/database';
import type { Util } from 'src/auxiliar/util';
import type { Command } from './command.builder';

export class Context {
	guild: Guild | null;

	constructor(
		public client: Client,
		public data: Message | CommandInteraction,
		public util: Util,
		public command: Command,
		public db: Database,
		public args?: string[]
	) {
		this.guild = data.guild;
	}

	get channel() {
		return this.client.getChannel(this.data.channelID);
	}

	get user() {
		return this.data instanceof Message
			? (this.client.users.get(this.data.author.id) as User)
			: this.data.user;
	}

	get member() {
		return this.data.member ?? null;
	}

	get timestamp() {
		return Number((BigInt(this.data.id) >> 22n) + 1420070400000n);
	}

	get prefix(): string {
		return (
			get(
				JSON.parse(
					readFileSync(
						join(process.cwd(), this.db.path, 'tables', 'guilds.json')
					).toString()
				),
				`${this.guild?.id}.prefix`
			) || process.env.PREFIX
		);
	}

	public async send(
		data: CreateMessageOptions | InteractionContent,
		reply = false
	) {
		if (reply)
			set(
				data,
				'messageReference',
				reply
					? {
							channelID: this.channel?.id,
							guildID: this.guild?.id,
							messageID: this.data.id
						}
					: {}
			);

		if (this.data instanceof Message) {
			return await this.client.rest.channels.createMessage(
				this.data.channelID,
				data
			);
		}

		this.data.defer(data.flags);

		return (await this.data.createFollowup(data)).message;
	}

	public get<T>(name: string, defaultValue?: T): T | undefined {
		if (this.data instanceof Message) return defaultValue;

		const options = this.data.data.options;

		const option = options
			.getOptions()
			.find((op) => op.name === name.toLowerCase());

		if (!option) return defaultValue;

		switch (option.type) {
			case 6:
				return (options.getUser(option.name, false) ?? defaultValue) as
					| T
					| undefined;
			case 7:
				return (options.getChannel(option.name, false) ?? defaultValue) as
					| T
					| undefined;
			case 8:
				return (options.getRole(option.name, false) ?? defaultValue) as
					| T
					| undefined;
			case 11:
				return (options.getAttachment(option.name, false) ?? defaultValue) as
					| T
					| undefined;
			default:
				return (option.value ?? defaultValue) as T | undefined;
		}
	}

	public subcommand(defaultV: string) {
		if (this.data instanceof Message) return defaultV;

		return this.data.data.options.getSubCommand(false)?.pop();
	}

	public async profile(id: string): Promise<DSTNProfile> {
		return (await fetch(`https://dcdn.dstn.to/profile/${id}`)).json();
	}
}
