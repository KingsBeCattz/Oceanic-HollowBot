import { db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isModalSubmitInteraction()) return;
	for (const textinput of i.data.components.raw.flatMap((c) => c.components)) {
		if (!textinput.value) {
			await db.delete(
				'guilds',
				`${i.message?.guildID}.ticket.${textinput.customID}`
			);
			continue;
		}
		await db.set(
			'guilds',
			`${i.message?.guildID}.ticket.${textinput.customID}`,
			textinput.value
		);
	}

	const ticket_data =
		((await db.get('guilds', `${i.message?.guildID}.ticket`)) as {
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
				title: ticket_data.embed?.title ?? 'Welcome to the ticket creation process',
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
						style: 2
					}
				]
			}
		]
	});
});
