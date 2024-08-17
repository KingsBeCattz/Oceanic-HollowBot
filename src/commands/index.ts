import type { APIEmbedField } from 'discord-api-types/v10';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'help',
		description: 'Do you need some help about me?',
		nsfw: false,
		type: CommandTypes.Generic
	},
	[],
	[],
	[
		{
			type: 3,
			name: 'command',
			description: 'Command to investigate',
			required: false
		}
	],
	async (ctx) => {
		const command = ctx.util.command(ctx.get('command', ctx.args?.shift()));

		if (command) {
			const fields: APIEmbedField[] = [
				{
					name: '⠇Type',
					value: command.data.type,
					inline: true
				}
			];

			if (command.data.alias && Boolean(command.data.alias.length))
				fields.unshift({
					name: '⠇Alias',
					value: (command.data.alias as string[]).format(),
					inline: true
				});

			if (command.options && Boolean(command.options.length)) {
				switch (command.options[0].type) {
					case 2:
						{
							fields.push({
								name: '⠇Sub Command Groups',
								value: command.options
									.filter((o) => o.type === 2)
									.map((o) => o.name)
									.join('\n')
							});

							fields.push({
								name: '⠇Sub Commands',
								value: command.options
									.filter((o) => o.type === 2)
									.flatMap((o) =>
										o.options
											?.filter((o) => o.type === 1)
											.flatMap((so) => `${o.name} > ${so.name}`)
									)
									.join('\n')
							});

							fields.push({
								name: '⠇Options',
								value: command.options
									.filter((o) => o.type === 2)
									.flatMap((o) =>
										o.options
											?.filter((o) => o.type === 1)
											.flatMap((so) =>
												so.options?.flatMap((soo) => `${o.name} > ${so.name} > ${soo.name}`)
											)
									)
									.join('\n')
							});
						}
						break;
					case 1:
						{
							fields.push({
								name: '⠇Sub Commands',
								value: command.options
									.filter((o) => o.type === 1)
									.map((o) => o.name)
									.join('\n')
							});

							fields.push({
								name: '⠇Options',
								value: command.options
									.filter((o) => o.type === 1)
									.flatMap((o) => o.options?.flatMap((so) => `${o.name} > ${so.name}`))
									.join('\n')
							});
						}
						break;
					default:
						fields.push({
							name: '⠇Options',
							value: command.options.flatMap((o) => o.name).join('\n')
						});
				}
			}
			ctx.send({
				embeds: [
					{
						title: `⠇Command: ${command.data.name}`,
						color: ctx.util.random.number(16777215),
						description: `${command.data.description} ${command.data.nsfw ? '<:Lewd:1129672128120246292>' : ''}`,
						thumbnail: {
							url: `https://cdn.discordapp.com/emojis/${ctx.util.cte(command.data.type).id}.png`
						},
						fields
					}
				]
			});
		}
	}
);
