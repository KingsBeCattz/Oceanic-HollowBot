import { util, client, db } from 'src';

import { Context } from 'src/builders/context.builder';
import { Event } from 'src/builders/event.builder';

import * as log from '../auxiliar/logger';

export default [
	new Event('messageCreate', async (message) => {
		if (message.author.bot) return;

		const prefix =
			((await db.get('guilds', `${message.guildID}.prefix`)) as string) ||
			process.env.PREFIX;

		const prefixes: string[] = [
			prefix,
			`<@!${client.user?.id}>`,
			`<@${client.user?.id}>`
		];

		if (!prefixes.some((p) => message.content.toLowerCase().startsWith(p)))
			return;

		const args = message.content.slice(prefix?.length).trim().split(/ +/);
		const command = util.command(args.shift());

		if (!command) return;

		try {
			const ctx = new Context(client, message, util, command, db, args);

			if (await command.check(ctx)) return;

			command.code(ctx);
		} catch (e) {
			log.error(String(e), `Command: ${command.data.name}`);
		}
	}),
	new Event('interactionCreate', async (interaction) => {
		if (!interaction.isCommandInteraction()) return;
		const command = util.command(interaction.data.name);
		if (!command) return;

		try {
			const ctx = new Context(client, interaction, util, command, db);

			if (await command.check(ctx)) return;

			command.code(ctx);
		} catch (e) {
			log.error(String(e), `Command: ${command.data.name}`);
		}
	})
];
