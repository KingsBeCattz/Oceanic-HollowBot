import {
	ComponentTypes,
	type CreateMessageOptions,
	type Message
} from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';
import { InteractionCollector } from 'src/collectors/InteractionCollector';

type Config = 'welcomes' | 'farewells' | 'bans';

export default new Command(
	{
		name: 'welcomes',
		description: 'Setup the welcomes system (Requires Manage Guild permission)',
		nsfw: false,
		type: CommandTypes.Configuration
	},
	[],
	[],
	[],
	async (ctx) => {
		const initial: CreateMessageOptions = {
			content: 'What do you want to configure?',
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 2,
							customID: 'welcomes',
							label: 'Welcomes',
							emoji: {
								id: '1129498663606030416'
							}
						},
						{
							type: 2,
							style: 2,
							customID: 'farewells',
							label: 'Farewells',
							emoji: {
								id: '1129498660670029894'
							}
						},
						{
							type: 2,
							style: 2,
							customID: 'bans',
							label: 'Bans',
							emoji: {
								id: '1275540688918020157'
							}
						},
						{
							type: 2,
							style: 4,
							label: 'Close',
							customID: 'close',
							emoji: {
								id: '1274894945655717943'
							}
						}
					]
				}
			],
			embeds: []
		};

		const collector = new InteractionCollector(
			await ctx.send(initial),
			ctx.client,
			5 * 60000
		);

		const process = {
			show_set(message: Message, type: Config) {
				return message.edit({
					content: `Editing: ${type.capitalize()}, select the channel to use`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 8,
									customID: `set.${type}`,
									channelTypes: [0]
								}
							]
						},
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									label: 'Go back',
									customID: 'back',
									emoji: {
										id: '1275191799065088133'
									}
								},
								{
									type: 2,
									customID: `set.${type}.here`,
									style: 2,
									label: 'This channel',
									emoji: {
										id: '1137984506595397662'
									}
								},
								{
									type: 2,
									style: 4,
									label: 'Close',
									customID: 'close',
									emoji: {
										id: '1274894945655717943'
									}
								}
							]
						}
					],
					embeds: []
				});
			},
			show_embed_edit(message: Message, type: Config) {
				message.edit({
					content: `Do you want to edit the ${type.slice(0, type.length - 1)} embed?\nBefore editing, note the words that will be replaced, this {keyword} - replacement\n- \`{username}\` - ${ctx.user.globalName ?? ctx.user.username}\n- \`{usertag}\` - ${ctx.user.tag}\n- \`{userid}\` - ${ctx.user.id}\n- \`{guild}\` - ${ctx.guild?.name}\n- \`{membercount}\` - ${ctx.guild?.name}\n- \`{ownerid}\` - ${ctx.guild?.ownerID}- \`{date}\` - <t:${(Date.now() / 1000).toFixed()}>`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									customID: `embed.${type}.yes`,
									label: 'Yes',
									emoji: {
										id: '1275575743790714890'
									}
								},
								{
									type: 2,
									style: 2,
									customID: `embed.${type}.no`,
									label: 'No',
									emoji: {
										id: '1274894945655717943'
									}
								}
							]
						}
					],
					embeds: []
				});
			},
			show_end_set(message: Message, type: Config) {
				return message.edit({
					content: 'The configuration has been done successfully!',
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									label: 'Go back',
									customID: 'back',
									emoji: {
										id: '1275191799065088133'
									}
								},
								{
									type: 2,
									style: 2,
									label: 'Preview',
									customID: `preview.${type}`,
									emoji: {
										id: '1129498662272245800'
									}
								},
								{
									type: 2,
									style: 4,
									label: 'Close',
									customID: 'close',
									emoji: {
										id: '1274894945655717943'
									}
								}
							]
						}
					],
					embeds: []
				});
			}
		};

		collector.on('collect', async (i) => {
			if (i.data.componentType === ComponentTypes.CHANNEL_SELECT) {
				const type = i.data.customID.split('.')[1] as Config;
				await ctx.db.set(
					'guilds',
					`${i.guildID}.${type}.channel`,
					i.data.values.getChannels(false)[0].id ?? i.channelID
				);
				await i.deferUpdate();
				await process.show_embed_edit(collector.message, type);
			}

			if (!i.isButtonComponentInteraction()) return;

			switch (true) {
				case i.data.customID === 'cancel':
					{
						await i.deferUpdate();

						await collector.clear(1);
					}
					break;
				case i.data.customID === 'back':
					{
						await i.deferUpdate();

						await collector.message.edit(initial);
					}
					break;
				case ['welcomes', 'farewells', 'bans'].includes(i.data.customID):
					{
						await i.deferUpdate();

						await process.show_set(collector.message, i.data.customID as Config);
					}
					break;
				case i.data.customID.endsWith('.here'):
					{
						const type = i.data.customID.split('.')[1] as Config;

						await ctx.db.set('guilds', `${i.guildID}.${type}.channel`, i.channelID);
						await i.deferUpdate();
						await process.show_embed_edit(collector.message, type);
					}
					break;
				case i.data.customID.endsWith('no'):
					{
						const type = i.data.customID.split('.')[1] as Config;

						await i.deferUpdate();
						await process.show_end_set(collector.message, type);
					}
					break;
				case i.data.customID.endsWith('yes'):
					{
						const type = i.data.customID.split('.')[1] as Config;

						await i.createModal({
							customID: `embed.${type}`,
							title: `Editing ${type.slice(0, type.length - 1).capitalize()} embed`,
							components: [
								{
									type: 1,
									components: [
										{
											type: 4,
											customID: 'embed.title',
											style: 1,
											label: 'Title',
											maxLength: 256,
											minLength: 1,
											required: false
										}
									]
								},
								{
									type: 1,
									components: [
										{
											type: 4,
											customID: 'embed.description',
											style: 2,
											label: 'Description',
											maxLength: 4000,
											minLength: 1,
											required: false
										}
									]
								},
								{
									type: 1,
									components: [
										{
											type: 4,
											customID: 'embed.image',
											style: 1,
											label: 'Image',
											required: false
										}
									]
								},
								{
									type: 1,
									components: [
										{
											type: 4,
											customID: 'embed.color',
											style: 1,
											label: 'Color (Hex)',
											required: false,
											minLength: 6,
											maxLength: 7
										}
									]
								}
							]
						});
					}
					break;
				case i.data.customID.startsWith('preview'): {
					const type = i.data.customID.split('.')[1] as Config;

					const replacements = {
						username: i.user.globalName ?? i.user.username,
						usertag: i.user.tag,
						userid: i.user.id,
						guild: i.guild?.name,
						membercount: i.guild?.memberCount,
						ownerid: i.guild?.ownerID,
						date: `<t:${(Date.now() / 1000).toFixed()}>`
					};

					const def_values = (await ctx.db.get('client', `${type}.embed`)) as {
						title: string;
						description: string;
					};

					const values = ((await ctx.db.get(
						'guilds',
						`${i.guildID}.${type}.embed`
					)) ?? {}) as {
						title?: string;
						description?: string;
						image?: string;
						color?: string;
					};

					const _color = values.color?.replace(/(#)/g, '');

					const color: number = /^([A-Fa-f0-9]{6})$/.test(_color ?? '')
						? Number.parseInt(_color as string, 16)
						: ctx.util.random.number(16777215);

					await i.deferUpdate();
					collector.message.edit({
						components: [
							{
								type: 1,
								components: [
									{
										type: 2,
										style: 2,
										label: 'Go back',
										customID: 'back',
										emoji: {
											id: '1275191799065088133'
										}
									}
								]
							}
						],
						embeds: [
							{
								title: (values.title ?? def_values.title).replace(
									/{(\w+)}/g,
									(_, key) => replacements[key] ?? `{${key}}`
								),
								description: (values.description ?? def_values.description).replace(
									/{(\w+)}/g,
									(_, key) => replacements[key] ?? `{${key}}`
								),
								color,
								image: values.image
									? {
											url: values.image
										}
									: undefined,
								thumbnail: {
									url: i.client.util.formatImage(
										i.user.avatar
											? `/avatars/${i.user.id}/${i.user.avatar}`
											: `/embed/avatars/${Number(i.user.discriminator) === 0 ? (Number(i.user.id) >> 22) % 6 : Number(i.user.discriminator) % 5}`
									)
								}
							}
						],
						content: `-# **This is a preview of __${type}__ embed**`
					});
				}
			}
		});

		collector.on('end', async () => {
			await collector.message.edit({
				components: ctx.util.disable_components(collector.message.components)
			});
		});
	}
);
