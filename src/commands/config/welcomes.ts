import type { Message } from 'oceanic.js';
import { ComponentTypes } from 'oceanic.js/dist/lib/Constants';
import type { CreateMessageOptions } from 'oceanic.js/dist/lib/types/channels';
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
								id: '1275540608395640862'
							}
						},
						{
							type: 2,
							style: 2,
							customID: 'farewells',
							label: 'Farewells',
							emoji: {
								id: '1275540650380492820'
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
			]
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
					]
				});
			},
			show_embed_edit(message: Message, type: Config) {
				message.edit({
					content: `Do you want to edit the ${type.slice(0, type.length - 1)} embed?`,
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
					]
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
					]
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
			}
		});

		collector.on('end', async () => {
			await collector.message.edit({
				components: ctx.util.disable_components(collector.message.components)
			});
		});
	}
);
