import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isModalSubmitInteraction()) return;
	console.log(i.data.components.raw.map((c) => c.components));
});
