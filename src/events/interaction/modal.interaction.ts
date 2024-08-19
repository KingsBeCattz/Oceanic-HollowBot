import { db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isModalSubmitInteraction()) return;
	for (const textinput of i.data.components.raw.flatMap((c) => c.components)) {
		db.set(
			'guilds',
			`${i.message?.guildID}.ticket.${textinput.customID}`,
			textinput.value
		);
	}

	db.get('guilds', `${i.message?.guildID}.ticket`).then(console.log);
});
