import { util, client, db } from 'src';
import * as log from 'src/auxiliar/logger';
import { Event } from 'src/builders/event.builder';

export default new Event('ready', async () => {
	await util.upload_slashes();

	const reloademojis = async () => {
		db.set(
			'client',
			'emojis',
			(await util.appemojis()) as unknown as JSONObject[]
		);
	};

	await reloademojis();

	setInterval(reloademojis, 30 * 60000);

	log.info(`Logged as ${client.user.tag}`, 'CONNECTION');
});
