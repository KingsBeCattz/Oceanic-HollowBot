import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'test',
		description: 'test',
		type: CommandTypes.Developer,
		nsfw: false
	},
	['developer'],
	[],
	[],
	async (ctx) => {
		fetch(Bun.env.WEBHOOK, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				content: 'Este es un mensaje enviado mediante fetch.',
				username: 'Nombre del Webhook',
				avatar_url: 'https://url_del_avatar.png',
				embeds: [
					{
						title: 'Título del Embed',
						description: 'Descripción del Embed',
						color: 16711680 // Color en formato decimal (0xFF0000 para rojo)
					}
				],
				components: [],
				allowed_mentions: { parse: [] }
			})
		})
			.then((r) => {
				r.json().then(console.log);
				ctx.send({
					content: 'Se envio!'
				});
			})
			.catch(() =>
				ctx.send({
					content: 'Fallo!'
				})
			);
	}
);
