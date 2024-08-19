import type { Guild, TextChannel } from 'oceanic.js';
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
		let collector = new InteractionCollector(
			await ctx.send({
				content: `Select where you want to create submit button to open tickets\n-# This interaction will close <t:${Number((Date.now() / 1000).toFixed()) + 5 * 60}:R>`,
				components: [
					{
						type: 1,
						components: [
							{
								type: 8,
								customID: 'channel.select',
								channelTypes: [0]
							}
						]
					}
				]
			}),
			ctx.client,
			5 * 60000
		);

		let ch: TextChannel;

		collector.on('collect', async (i) => {
			if (!i.isSelectMenuComponentInteraction()) return;
			if (i.user.id !== ctx.user.id) {
				i.defer(64);
				i.createFollowup({
					content: 'This is not for you!'
				});
			}

			if (i.data.customID === 'channel.select') {
				ch = ctx.guild?.channels.get(
					i.data.values.getChannels(false)[0].id
				) as TextChannel;
				collector.clear(1);
			}
		});

		collector.on('end', async (code) => {
			if (code === 1) {
				collector = new InteractionCollector(
					await ctx.send({
						content: `Select which roles can see open tickets\n-# This interaction will close <t:${Number((Date.now() / 1000).toFixed()) + 5 * 60}:R>`,
						components: [
							{
								type: 1,
								components: [
									{
										type: 6,
										customID: 'role.select',
										maxValues:
											(ctx.guild as Guild).roles.size < 25
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
										style: 4,
										customID: 'cancel',
										label: 'Cancel',
										emoji: {
											id: '1274894945655717943'
										}
									},
									{
										type: 2,
										style: 2,
										customID: 'skip',
										label: 'Skip',
										emoji: {
											id: '1131479196590411807'
										}
									}
								]
							}
						]
					}),
					ctx.client,
					5 * 60000
				);

				return;
			}

			collector.message.edit({
				components: ctx.util.disable_components(collector.message.components)
			});
		});
	}
);
