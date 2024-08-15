import { CommandInteraction } from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'me',
		description: 'Say something about yourself, anonymously or publicly',
		type: CommandTypes.Fun,
		nsfw: false
	},
	[],
	[
		{
			type: 5,
			name: 'anonym',
			description: 'Will the message be anonymous?',
			required: true
		},
		{
			type: 3,
			name: 'message',
			description: 'Message to say',
			required: true
		}
	],
	async (ctx) => {
		let _anonym = String(ctx.get('anonym', ctx.args?.shift()));

		if (!_anonym) {
			ctx.send({
				content: 'You must give an message!'
			});

			return;
		}

		if (!['true', 'false'].includes(_anonym)) {
			ctx.args?.unshift(_anonym);

			_anonym = 'true';
		}

		const anonym = _anonym === 'true';

		const message = ctx.get(
			'message',
			ctx.args?.join(' ') || 'Se le olvido el mensaje!'
		);

		if (ctx.data instanceof CommandInteraction)
			ctx.send({
				content: 'I just sent your message!',
				flags: 64
			});

		ctx.client.rest.channels.createMessage(ctx.channel?.id ?? ctx.user.id, {
			content: `${message}\n- *${anonym ? 'A user' : ctx.user.globalName}*`
		});
	}
);
