import type {
	ApplicationCommandOptions,
	CreateChatInputApplicationCommandOptions
} from 'oceanic.js/dist/lib/types/applications';
import type { Context } from './context.builder';

export type Condition = (ctx: Context) => MaybePromise<boolean>;

export enum CommandTypes {
	Developer = 'Developer',
	Fun = 'Fun',
	Configuration = 'Configuration',
	Information = 'Information'
}

export class Command {
	constructor(
		public data: {
			name: string;
			alias?: string[];
			description: string;
			type: CommandTypes;
			nsfw: boolean;
		},
		public permissions: string[],
		public conditions: Condition[],
		public options: ApplicationCommandOptions[],
		public code: (ctx: Context) => MaybePromise<unknown>
	) {}

	public async check(ctx: Context) {
		return await Promise.all(this.conditions.map(async (c) => await c(ctx))).then(
			(a) => a.some((v) => !v)
		);
	}

	public async perms(ctx: Context) {
		const permissions = (((await ctx.db.get(
			'users',
			`${ctx.user.id}.permissions`
		)) as unknown) || []) as string[];

		return this.permissions.map((p) => permissions.includes(p));
	}

	public transform(): CreateChatInputApplicationCommandOptions {
		return {
			contexts: [0],
			description: this.data.description,
			name: this.data.name,
			options: this.options,
			type: 1,
			nsfw: this.data.nsfw
		};
	}
}
