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
		name: 'ticket',
		description: 'Setup the ticket system (Requires Manage Guild permission)',
		nsfw: false,
		type: CommandTypes.Configuration
	},
	[],
	[],
	[],
	async (ctx) => {
		if (!ctx.member?.permissions.has(32n))
			return ctx.send({
				content:
					'You need the `Manage guild` permission.\n-# If you have the `Administrator` permission you should be able to, if you have the permission and you cannot use this command login to the support server to report the problem.',
				flags: 64
			});

		const time = Number((Date.now() / 1000).toFixed()) + 5 * 60;

		let ticket_data =
			((await ctx.db.get(
				'guilds',
				`${ctx.data?.guildID}.ticket`
			)) as TicketData) ?? {};

		const process = {
			start_options: {
				content: `Where you want the button to open tickets to be sent to.\n-# This interaction will close <t:${time}:R>`,
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
							(ticket_data.channel
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
			},
			async set_roles(message: Message) {
				const roles = (ctx.guild as Guild).roles
					.filter(async (r) => !r.permissions.has(8n))
					.filter(async (r) => !(ticket_data.roles ?? []).includes(r.id))
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
								(ticket_data.category
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
									label: 'Skip',
									customID: 'skip.embed',
									emoji: {
										id: '1275191659969384489'
									}
								},
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
					content: `Process completed, check <#${ticket_data.channel ?? ctx.data.channelID}>.`,
					components: []
				});
			},
			async sendEmbed(id: string) {
				return await ctx.client.rest.channels.createMessage(id, {
					embeds: [
						{
							color: 4100702,
							title:
								ticket_data.embed?.title ?? 'Welcome to the ticket creation process',
							description:
								ticket_data.embed?.description ??
								'Before creating a ticket make sure that you do not violate any server rule; do not create a ticket for no reason or tag staff unnecessarily, as this may lead to a penalty.',
							thumbnail: {
								url: 'https://cdn.discordapp.com/emojis/1129907740265943112.png'
							}
						}
					],
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									label: ticket_data.embed?.button ?? 'Create ticket',
									customID: 'create.ticket',
									emoji: {
										id: '1244527037008576612'
									},
									style: 3
								}
							]
						}
					]
				});
			}
		};
		const message = await (ticket_data.channel
			? ctx.send({
					content: `The ticket system is already configured, do you want to resend the button or reconfigure it?\n-# This interaction will close <t:${time}:R>`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 2,
									label: 'Resend',
									customID: 'resend',
									emoji: { id: '1275306176615284777' }
								},
								{
									type: 2,
									style: 2,
									label: 'Reconfigure',
									customID: 'reconfigure',
									emoji: { id: '1129677836421189662' }
								}
							]
						}
					]
				})
			: ctx.send(process.start_options));

		const current_roles = ticket_data.roles ?? [];

		const collector = new InteractionCollector(message, ctx.client, 5 * 60000);

		collector.on('collect', async (i) => {
			switch (true) {
				case i.data.customID === 'resend':
					{
						await i.deferUpdate();
						await message.edit({
							content: `Message forwarded, check <#${ticket_data.channel ?? i.channelID}>.`,
							components: []
						});

						await process.sendEmbed(ticket_data.channel ?? i.channelID);
					}
					break;
				case i.data.customID === 'reconfigure':
					{
						await i.deferUpdate();
						message.edit(process.start_options);
					}
					break;

				case i.data.customID === 'cancel':
					{
						await i.deferUpdate();
						collector.clear(1);
					}
					break;
				case i.data.customID.startsWith('skip'):
					{
						await i.deferUpdate();
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
								collector.clear(2);
								await process.end(message);
								await process.sendEmbed(ticket_data.channel ?? i.channelID);
								break;
						}
					}
					break;
				case i.data.customID.startsWith('channel.set'):
					{
						ticket_data = (
							(await ctx.db.set(
								'guilds',
								`${ctx.guild?.id}.ticket.channel`,
								'values' in i.data ? i.data.values.raw[0] : message.channelID
							)) as { [k: string]: TicketData }
						)[ctx.guild?.id ?? ''];

						i.deferUpdate();
						await process.set_category(message);
					}
					break;
				case i.data.customID.startsWith('category.set'):
					{
						ticket_data = (
							(await ctx.db.set(
								'guilds',
								`${ctx.guild?.id}.ticket.category`,
								'values' in i.data
									? i.data.values.raw[0]
									: (message.channel as AnyTextableGuildChannel).parentID ?? ''
							)) as { [k: string]: TicketData }
						)[ctx.guild?.id ?? ''];
						i.deferUpdate();
						await process.set_roles(message);
					}
					break;
				case i.data.customID === 'roles':
					{
						if (i.isSelectMenuComponentInteraction()) {
							ticket_data = (
								(await ctx.db.set('guilds', `${message.guildID}.ticket.roles`, [
									...i.data.values.raw.filter((rid) => !current_roles.includes(rid)),
									...current_roles.filter((rid) => !i.data.values.raw.includes(rid))
								])) as { [k: string]: TicketData }
							)[ctx.guild?.id ?? ''];
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
			if (code === 2) return;
			const { content, components } = message;

			message.edit({
				content: `${content.split('\n')[0]}${['\n-# This process was closed by the author', '\n-# Time is running out', ''][code ?? 0]}`,
				components: ctx.util.disable_components(components)
			});
		});
	}
);
