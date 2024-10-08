import type { APIEmbedField } from 'discord-api-types/v10';
import { Message } from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';
import { InteractionCollector } from 'src/collectors/InteractionCollector';

export default new Command({
	data: {
		name: 'help',
		description: 'Do you need some help about me?',
		nsfw: false,
		type: CommandTypes.Generic
	},
	options: [
		{
			type: 3,
			name: 'command',
			description: 'Command to investigate',
			required: false
		}
	],
	code: async (ctx) => {
		const command = ctx.util.command(ctx.get('command', ctx.args?.shift()));

		if (!(ctx.data instanceof Message)) await ctx.data.defer();

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

			if (command.permissions.length !== 0) {
				fields.push({
					name: '⠇Bot Permissions',
					value: command.permissions
						.map((p) => `${p.capitalize()} ${ctx.util.bot_permissions_emojis(p)}`)
						.join('\n'),
					inline: true
				});
			}

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
											.flatMap((so) => `${o.name.capitalize()} ${so.name.capitalize()}`)
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
														`${o.name.capitalize()} ${so.name.capitalize()} ${soo.name.capitalize()} (${ctx.util.get_option_type(soo.type)})`
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
												`${o.name.capitalize()} ${so.name.capitalize()} (${ctx.util.get_option_type(so.type)})`
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
								.flatMap(
									(o) => `${o.name.capitalize()} (${ctx.util.get_option_type(o.type)})`
								)
								.join('\n')
						});
				}
			}
			return ctx.send({
				embeds: [
					{
						title: `⠇Command: ${command.data.name.capitalize()}`,
						color: ctx.util.random.number(16777215),
						description: `${command.data.nsfw ? '<:Lewd:1129672128120246292> ' : ''}${command.data.description}`,
						thumbnail: {
							url: `https://cdn.discordapp.com/emojis/${ctx.util.command_type(command.data.type).id}.png`
						},
						fields
					}
				]
			});
		}

		const embed = {
			title: 'Welcome',
			color: ctx.util.random.number(16777215),
			description: `Welcome to the help menu, below in the drop down menu are categories and their commands\n\nIf you have a question about a specific command use \`${ctx.prefix}help [command]\`, like \`${ctx.prefix}help ${ctx.util.random.on_array(ctx.util.commands.map((c) => c.data.name))[0]}\`.`
		};

		const menu_options = Object.keys(CommandTypes)
			.filter((op) => op !== 'Generic')
			.map((op) => ({
				label: op,
				value: op,
				emoji: ctx.util.command_type(op)
			}));

		menu_options.unshift({
			label: 'Home',
			value: 'Home',
			emoji: {
				name: 'Home',
				id: '1241840687687794811'
			}
		});

		const now = Date.now() + 5 * 60000;

		const message = await ctx.send({
			content: `-# This menu closes <t:${(now / 1000).toFixed()}:R>`,
			embeds: [embed],
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 4,
							label: 'Close Menu',
							emoji: {
								id: '1129492489020121169'
							},
							customID: 'help.delete'
						},
						{
							type: 2,
							style: 5,
							url: Bun.env.SUPPORT,
							label: 'Help?',
							emoji: {
								id: '1129907740265943112'
							}
						},
						{
							type: 2,
							style: 5,
							url: 'https://discord.gg/ee8WUaBnAY',
							label: 'Icons!',
							emoji: {
								id: '1129906859705372692'
							}
						},
						{
							type: 2,
							style: 5,
							url: 'https://github.com/KingsBeCattz/Oceanic-HollowBot',
							label: 'Github',
							emoji: {
								id: '1274235451607224320'
							}
						}
					]
				},
				{
					type: 1,
					components: [
						{
							type: 3,
							customID: 'select.menu',
							options: menu_options
						}
					]
				}
			]
		});

		const collector = new InteractionCollector(message, ctx.client, 5 * 60000);

		collector.on('collect', async (i) => {
			if (i.user.id !== ctx.user.id) {
				await i.defer(64);
				return i.createFollowup({
					content: `U can't use this! <@${i.user.id}>`
				});
			}

			if (i.isButtonComponentInteraction()) {
				i.deferUpdate();
				return await collector.clear();
			}

			i.deferUpdate();

			if (i.data.values.raw[0] === 'Home')
				return i.editFollowup(i.message.id, {
					embeds: [embed]
				});

			const commands = ctx.util.commands
				.filter((c) => c.data.type === i.data.values.raw[0])
				.flatMap((c) => {
					if (c.options[0]?.type === 2) {
						return c.options
							.filter((scg) => scg.type === 2)
							.flatMap((scg) =>
								scg.options?.flatMap((sc) => ({
									name: `${c.data.name.capitalize()} ${scg.name.capitalize()} ${sc.name.capitalize()}`,
									value: `${c.data.nsfw ? '<:Lewd:1129672128120246292> ' : ''}${sc.description}`,
									inline: true
								}))
							);
					}

					if (c.options[0]?.type === 1) {
						return c.options
							.filter((sc) => sc.type === 1)
							.flatMap((sc) => ({
								name: `${c.data.name.capitalize()} ${sc.name.capitalize()}`,
								value: `${c.data.nsfw ? '<:Lewd:1129672128120246292> ' : ''}${sc.description}`,
								inline: true
							}));
					}

					return {
						name: c.data.name.capitalize(),
						value: `${c.data.nsfw ? '<:Lewd:1129672128120246292> ' : ''}${c.data.description}`,
						inline: true
					};
				});

			i.editFollowup(i.message.id, {
				embeds: [
					{
						title: `Category: ${i.data.values.raw[0]}`,
						color: message.embeds[0].color,
						fields:
							commands.length === 0 || commands.some((c) => c === undefined)
								? undefined
								: (
									commands as {
										name: string;
										value: string;
										inline: boolean;
									}[]
								).sort((a, b) =>
									a.name.toLowerCase().localeCompare(b.name.toLowerCase())
								),
						description:
							commands.length === 0 ? 'No commands here, come back later!' : undefined,
						thumbnail: {
							url: `https://cdn.discordapp.com/emojis/${ctx.util.command_type(i.data.values.raw[0]).id}.png`
						}
					}
				]
			});
		});

		collector.on('end', async () => {
			const { components } = message;

			message.edit({
				components: ctx.util.disable_components(components),
				content: ''
			});
		});
	}
});
