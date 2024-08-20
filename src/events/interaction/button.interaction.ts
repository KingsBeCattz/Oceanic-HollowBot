import type { AnyTextableChannel } from 'oceanic.js';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isComponentInteraction() || !i.isButtonComponentInteraction()) return;

	const _id = i.data.customID.toLowerCase().split('.');
	let _private = _id.pop();
	if (!['private', 'public'].includes(_private ?? '')) {
		_id.push(_private ?? '');
		_private = 'private';
	}

	const data = {
		private: _id.pop() === 'private',
		id: _id.join('.'),
		reference: i.message.messageReference?.messageID
			? await (i.channel as AnyTextableChannel | undefined)?.getMessage(
					i.message.messageReference?.messageID
				)
			: undefined
	};

	if (data.private && i.user.id !== data.reference?.author.id) {
		i.defer(64);
		i.createFollowup({
			content: `U can't use this! <@${i.user.id}>`
		});
		return;
	}

	switch (data.id) {
		case 'delete.eval':
			i.message.delete();
			break;
		case 'create.ticket':
			i.createModal({
				title: `${i.guild?.name} Support`,
				customID: 'open.ticket',
				components: [
					{
						type: 1,
						components: [
							{
								type: 4,
								customID: 'ticket.reason',
								style: 2,
								label: 'Reason',
								maxLength: 1000,
								required: false
							}
						]
					}
				]
			});
			break;
		case 'delete.ticket': {
			i.defer();
			setTimeout(() => i.channel?.delete(), 5 * 60_000);
			i.createFollowup({
				content: `This channel will be deleted <t:${Number((Date.now() / 1000).toFixed()) + 5 * 60}:R>`
			});
		}
	}
});
