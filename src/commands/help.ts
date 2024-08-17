import type { APIEmbedField } from 'discord-api-types/v10';
import { Command, CommandTypes } from 'src/builders/command.builder';
import { InteractionCollector } from 'src/collectors/InteractionCollector';

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
									.map((o) => o.name.capitalize())
									.join('\n'),
								inline: true
							});

							fields.push({
								name: '⠇Sub Commands',
								value: command.options
									.filter((o) => o.type === 2)
									.flatMap((o) =>
										o.options
											?.filter((o) => o.type === 1)
											.flatMap((so) => `${o.name.capitalize()} > ${so.name.capitalize()}`)
									)
									.join('\n'),
								inline: true
							});

							fields.push({
								name: '⠇Options',
								value: command.options
									.filter((o) => o.type === 2)
									.flatMap((o) =>
										o.options
											?.filter((o) => o.type === 1)
											.flatMap((so) =>
												so.options?.flatMap(
													(soo) =>
														`${o.name.capitalize()} > ${so.name.capitalize()} > ${soo.name.capitalize()} (${ctx.util.getOpT(soo.type)})`
												)
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
									.map((o) => o.name.capitalize())
									.join('\n'),
								inline: true
							});

							fields.push({
								name: '⠇Options',
								value: command.options
									.filter((o) => o.type === 1)
									.flatMap((o) =>
										o.options?.flatMap(
											(so) =>
												`${o.name.capitalize()} > ${so.name.capitalize()} (${ctx.util.getOpT(so.type)})`
										)
									)
									.join('\n')
							});
						}
						break;
					default:
						fields.push({
							name: '⠇Options',
							value: command.options
								.flatMap((o) => `${o.name.capitalize()} (${ctx.util.getOpT(o.type)})`)
								.join('\n')
						});
				}
			}
			ctx.send({
				embeds: [
					{
						title: `⠇Command: ${command.data.name.capitalize()}`,
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

		const collector = new InteractionCollector(
			await ctx.send({
				embeds: [
					{
						title: 'Welcome',
						color: ctx.util.random.number(16777215),
						description: `Welcome to the help menu, below in the drop down menu are categories and their commands, and if you have a question about a specific command use \`${ctx.prefix}help [command]\`, like \`${ctx.prefix}help ${ctx.util.random.onArray(ctx.util.commands.map((c) => c.data.name))[0]}\`.`
					}
				],
				components: [
					{
						type: 1,
						components: [
							{
								type: 2,
								style: 1,
								label: 'aa',
								customID: 'eee'
							}
						]
					}
				]
			}),
			10000
		);

		collector.on('collect', async (i) => {
			i.defer(64);
			i.createFollowup({
				content: 'Hola!'
			});
			console.log(i);
		});

		collector.on('end', async () =>
			ctx.client.rest.channels.createMessage(collector.message.channelID, {
				content: 'Se acabo la interaccion!',
				messageReference: {
					channelID: collector.message.channelID,
					messageID: collector.message.id
				}
			})
		);
	}
);
