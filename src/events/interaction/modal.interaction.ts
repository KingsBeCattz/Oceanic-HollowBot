import { type CategoryChannel, ChannelTypes } from 'oceanic.js';
import { util, db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isModalSubmitInteraction()) return;
	const textinputs = i.data.components.raw.flatMap((c) => c.components);

	switch (true) {
		case i.data.customID === 'edit.submit':
			{
				for (const textinput of textinputs) {
					if (!textinput.value) {
						await db.delete('guilds', `${i.guildID}.ticket.${textinput.customID}`);
						continue;
					}
					await db.set(
						'guilds',
						`${i.guildID}.ticket.${textinput.customID}`,
						textinput.value
					);
				}

				const ticket_data =
					((await db.get('guilds', `${i.guildID}.ticket`)) as {
						channel?: string;
						embed?: { title?: string; description?: string; button?: string };
					}) ?? {};

				await i.deferUpdate();
				await i.editOriginal({
					content: `Process completed, check <#${ticket_data.channel}>.`,
					components: []
				});

				i.client.rest.channels.createMessage(ticket_data.channel ?? i.channelID, {
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
			break;
		case i.data.customID === 'open.ticket':
			{
				const allow_roles = ((await db.get(
					'guilds',
					`${i.guildID}.ticket.roles`
				)) ?? []) as string[];

				const category = i.guild?.channels
					.filter((ch) => ch.type === ChannelTypes.GUILD_CATEGORY)
					.find(
						async (ch) =>
							ch.id ===
							(await db.get<string>('guilds', `${i.guildID}.ticket.category`))
					) as CategoryChannel;

				const tickets_created = category.channels.filter((ch) =>
					ch.name.startsWith(i.user.username)
				).length;

				const title = `${i.user.username}\'s ticket${tickets_created ? ` (${tickets_created + 1})` : ''}`;

				const ticket = await i.client.rest.guilds.createChannel(
					i.guildID ?? '',
					0,
					{
						name: title,
						permissionOverwrites: allow_roles
							.map((id) => ({
								id,
								allow: 3072n,
								type: 0,
								deny: 0n
							}))
							.concat(
								{
									type: 0,
									id: i.guildID ?? '',
									deny: 1024n,
									allow: 0n
								},
								{
									type: 0,
									id: i.user.id,
									allow: 3072n,
									deny: 0n
								}
							),
						parentID: category.id
					}
				);

				await i.defer(64);
				await i.createFollowup({
					content: `Your ticket was created at <#${ticket.id}>.`
				});

				ticket.createMessage({
					embeds: [
						{
							title,
							description:
								textinputs[0].value === ''
									? 'No reason given for the ticket'
									: textinputs[0].value,
							color: util.random.number(16777215),
							thumbnail: {
								url: i.client.util.formatImage(
									i.user.avatar
										? `/avatars/${i.user.id}/${i.user.avatar}`
										: `/embed/avatars/${Number(i.user.discriminator) === 0 ? (Number(i.user.id) >> 22) % 6 : Number(i.user.discriminator) % 5}`
								)
							},
							timestamp: new Date().toISOString()
						}
					],
					components: [
						{
							type: 1,
							components: [
								{
									type: 2,
									style: 4,
									customID: 'delete.ticket',
									label: 'Delete Ticket',
									emoji: {
										id: '1129492489020121169'
									}
								}
							]
						}
					]
				});
			}
			break;

		case /^embed.*(welcomes|farewells|bans)$/.test(i.data.customID):
			{
				const type = i.data.customID.split('.')[1] as
					| 'welcomes'
					| 'farewells'
					| 'bans';

				for (const textinput of textinputs) {
					if (!textinput.value) {
						await db.delete('guilds', `${i.guildID}.${type}.${textinput.customID}`);
						continue;
					}
					await db.set(
						'guilds',
						`${i.guildID}.${type}.${textinput.customID}`,
						textinput.value
					);
				}

				await i.deferUpdate();
				i.editOriginal({
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
			break;
	}
});
