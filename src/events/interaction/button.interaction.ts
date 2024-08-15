import type { AnyTextableChannel } from 'oceanic.js';
import { Event } from 'src/builders/event.builder';

export default new Event('interactionCreate', async (i) => {
	if (!i.isComponentInteraction() || !i.isButtonComponentInteraction()) return;

	const data = {
		private: i.data.customID.toLowerCase().split('.')[1] === 'private',
		id: i.data.customID.toLowerCase().split('.')[0],
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
		case 'delete':
			i.message.delete();
			break;
	}
});
