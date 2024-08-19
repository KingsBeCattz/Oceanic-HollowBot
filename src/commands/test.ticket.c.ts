import type { Guild, Message } from 'oceanic.js';
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
					components: [
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
							customID: 'cancel.1',
							emoji: {
								id: '1274894945655717943'
							}
						}
					]
				}
			]
		});

		const collector = new InteractionCollector(message, ctx.client, 5 * 60000);

		const process = {
			async set_roles(message: Message) {
				return await message.edit({
					content: `Choose the roles that will see open tickets.\n${message.content.split('\n')[1]}`,
					components: [
						{
							type: 1,
							components: [
								{
									type: 6,
									customID: 'roles.set',
									maxValues:
										(ctx.guild as Guild).roles.size > 25
											? 25
											: (ctx.guild as Guild).roles.size,
									minValues: 1
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
						i.deferUpdate();
						collector.clear(1);
					}
					break;
				case i.data.customID.startsWith('skip'):
					{
						if (i.data.customID.endsWith('roles')) await process.edit_embed(message);
						else await process.end(message);
					}
					break;
				case i.data.customID.startsWith('channel.set'):
					{
						if (!i.isSelectMenuComponentInteraction()) return;

						await ctx.db.set(
							'guilds',
							`${ctx.guild?.id}.ticket.channel`,
							i.data.customID.endsWith('here')
								? message.channelID
								: i.data.values.getChannels(false)[0].id
						);

						i.deferUpdate();
						await process.set_roles(message);
					}
					break;
				case i.data.customID === 'edit':
					{
						i.createModal({
							customID: 'edit.submit',
							title: 'Editing embed to send',
							components: []
						});
					}
					break;
				case i.data.customID === 'edit.submit':
					await process.end(message);
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
