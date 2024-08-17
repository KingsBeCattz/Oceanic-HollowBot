import { util, client, db } from 'src';
import Activities from 'src/auxiliar/bot.activities';
import * as log from 'src/auxiliar/logger';
import { Event } from 'src/builders/event.builder';

export default new Event('ready', async () => {
	await util.upload_slashes();

	/**
	const reloademojis = async () => {
		db.set(
			'client',
			'emojis',
			(await util.appemojis()) as unknown as JSONObject[]
		);
	};
	await reloademojis();

	setInterval(reloademojis, 30 * 60000);
	 */

	if (await db.exists('client', 'notify.reboot')) {
		client.rest.channels.createMessage(
			(await db.get('client', 'notify.reboot')) as string,
			{ content: 'Reboot completed!' }
		);
		await db.delete('client', 'notify.reboot');
	}

	setInterval(
		() => client.editStatus('online', util.random.onArray(Activities)),
		5 * 60000
	);

	log.info(`Logged as ${client.user.tag}`, 'CONNECTION');
});
