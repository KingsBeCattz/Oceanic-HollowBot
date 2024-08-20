import type {
	AnyTextableGuildChannel,
	Guild,
	Message,
	MessageComponent
} from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';
import { InteractionCollector } from 'src/collectors/InteractionCollector';

export default new Command(
	{
		name: 'tticket',
		description: 'Setup the ticket system (Requires Manage Guild permission)',
		nsfw: false,
		type: CommandTypes.Configuration
	},
	[],
	[],
	[],
	async (ctx) => {
		const message = await ctx.send({
			content: `Where you want the button to open tickets to be sent to.\n-# This interaction will close <t:${Number((Date.now() / 1000).toFixed()) + 5 * 60}:R>`,
			components: [
				{
					type: 1,
					components: [
						{
							type: 8,
							customID: 'channel.set',
							channelTypes: [0]
						}
					]
				},
				{
					type: 1,
					components: (
						((await ctx.db.exists('guilds', `${ctx.guild?.id}.tickets.channel`))
							? [
									{
										type: 2,
										style: 2,
										label: 'Skip',
										customID: 'skip.channel',
										emoji: {
											id: '1275191659969384489'
										}
									}
								]
							: []) as MessageComponent[]
					).concat([
						{
							type: 2,
							style: 2,
							label: 'In this channel',
							customID: 'channel.set.here',
							emoji: {
								id: '1137984506595397662'
							},
							disabled: ctx.channel?.type !== 0
						},
						{
							type: 2,
							style: 4,
							label: 'Cancel',
							customID: 'cancel',
							emoji: {
								id: '1274894945655717943'
							}
						}
					])
				}
			]
		});

		const current_roles =
			((await ctx.db.get(
				'guilds',
				`${ctx.guild?.id}.ticket.roles`
			)) as string[]) ?? [];

		const collector = new InteractionCollector(message, ctx.client, 5 * 60000);

		const process = {
			async set_roles(message: Message) {
				const roles = (ctx.guild as Guild).roles
					.filter(async (r) => !r.permissions.has(8n))
					.filter(
						async (r) =>
							!(
								((await ctx.db.get(
									'guilds',
									`${ctx.data.guildID}.ticket.roles`
								)) as string[]) ?? []
							).includes(r.id)
					)
					.filter((r) => !r.managed)
					.filter((r) => r.id !== ctx.data.guildID)
					.slice(0, 24);
				return await message.edit({
					content: `Choose the roles that will see open tickets. **If you select a role that was already included, it will be deleted.**\n${message.content.split('\n')[1]}`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 3,
									customID: 'roles',
									maxValues: roles.length,
									minValues: 1,
									options: roles.map((r) => ({
										value: r.id,
										label: r.name,
										emoji: {
											id: current_roles.includes(r.id)
												? '1275290587712585828'
												: '1275290555848589343'
										}
									}))
								}
							]
						},
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									label: 'Skip',
									customID: 'skip.roles',
									emoji: {
										id: '1275191659969384489'
									}
								},
								{
									type: 2,
									style: 4,
									label: 'Cancel',
									customID: 'cancel',
									emoji: {
										id: '1274894945655717943'
									}
								}
							]
						}
					]
				});
			},
			async set_category(message: Message) {
				return await message.edit({
					content: `In which category do you want the tickets to be created?\n${message.content.split('\n')[1]}`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 8,
									customID: 'category.set',
									channelTypes: [4]
								}
							]
						},
						{
							type: 1,
							components: (
								((await ctx.db.exists('guilds', `${ctx.guild?.id}.tickets.category`))
									? [
											{
												type: 2,
												style: 2,
												label: 'Skip',
												customID: 'skip.category',
												emoji: {
													id: '1275191659969384489'
												}
											}
										]
									: []) as MessageComponent[]
							).concat([
								{
									type: 2,
									style: 2,
									label: 'In this category',
									customID: 'category.set.here',
									emoji: {
										id: '1137984506595397662'
									}
								},
								{
									type: 2,
									style: 4,
									label: 'Cancel',
									customID: 'cancel',
									emoji: {
										id: '1274894945655717943'
									}
								}
							])
						}
					]
				});
			},
			async edit_embed(message: Message) {
				return await message.edit({
					content: `Do you want to customize the embed? It will be displayed above the open ticket button.\n${message.content.split('\n')[1]}`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									label: 'Edit',
									customID: 'edit',
									emoji: {
										id: '1275192080582443152'
									}
								},
								{
									type: 2,
									style: 2,
									label: 'Skip',
									customID: 'skip.embed',
									emoji: {
										id: '1275191659969384489'
									}
								},
								{
									type: 2,
									style: 4,
									label: 'Cancel',
									customID: 'cancel',
									emoji: {
										id: '1274894945655717943'
									}
								}
							]
						}
					]
				});
			},
			async end(message: Message) {
				return await message.edit({
					content: `Process completed, check <#${await ctx.db.get('guilds', `${message.guildID}.ticket.channel`)}>.`,
					components: []
				});
			}
		};

		collector.on('collect', async (i) => {
			switch (true) {
				case i.data.customID === 'cancel':
					{
						await i.deferUpdate();
						collector.clear(1);
					}
					break;
				case i.data.customID.startsWith('skip'):
					{
						switch (true) {
							case i.data.customID.endsWith('channel'):
								await process.set_category(message);
								break;
							case i.data.customID.endsWith('category'):
								await process.set_roles(message);
								break;
							case i.data.customID.endsWith('roles'):
								await process.edit_embed(message);
								break;
							case i.data.customID.endsWith('embed'):
								await process.end(message);
								break;
						}
					}
					break;
				case i.data.customID.startsWith('channel.set'):
					{
						await ctx.db.set(
							'guilds',
							`${ctx.guild?.id}.ticket.channel`,
							i.isSelectMenuComponentInteraction()
								? i.data.values.getChannels(false)[0].id
								: message.channelID
						);

						i.deferUpdate();
						await process.set_category(message);
					}
					break;
				case i.data.customID.startsWith('category.set'):
					{
						const category = i.isSelectMenuComponentInteraction()
							? i.data.values.getChannels(false)[0].id
							: (message.channel as AnyTextableGuildChannel).parentID;

						if (category)
							await ctx.db.set('guilds', `${ctx.guild?.id}.ticket.category`, category);

						i.deferUpdate();
						await process.set_roles(message);
					}
					break;
				case i.data.customID === 'roles':
					{
						if (i.isSelectMenuComponentInteraction()) {
							await ctx.db.set(
								'guilds',
								`${message.guildID}.ticket.roles`,
								i.data.values.raw.filter((rid) => !current_roles.includes(rid))
							);
							await i.deferUpdate();
							await process.edit_embed(message);
						}
					}
					break;
				case i.data.customID === 'edit':
					{
						await i.createModal({
							customID: 'edit.submit',
							title: 'Editing embed to send',
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
											customID: 'embed.button',
											style: 1,
											label: 'Button text',
											maxLength: 80,
											minLength: 1,
											required: false
										}
									]
								}
							]
						});
					}
					break;
			}
		});

		collector.on('end', async (code) => {
			const { content, components } = message;

			message.edit({
				content: `${content.split('\n')[0]}\n-# ${code === 1 ? 'This process was closed by the author' : 'Time is running out'}`,
				components: ctx.util.disable_components(components)
			});
		});
	}
);
