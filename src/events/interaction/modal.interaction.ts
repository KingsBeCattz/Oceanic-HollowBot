import { db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isModalSubmitInteraction()) return;
	for (const textinput of i.data.components.raw.flatMap((c) => c.components)) {
		await db.set(
			'guilds',
			`${i.message?.guildID}.ticket.${textinput.customID}`,
			textinput.value
		);
	}

	const ticket_data =
		((await db.get('guilds', `${i.message?.guildID}.ticket`)) as {
			channel?: string;
		}) ?? {};

	await i.deferUpdate();
	await i.editOriginal({
		content: `Process completed, check <#${ticket_data.channel}>.`,
		components: []
	});
});
