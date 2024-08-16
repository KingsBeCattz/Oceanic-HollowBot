import { readFileSync } from 'node:fs';
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
		const body = new FormData();
		body.append(
			'file',
			new Blob([readFileSync('src/database/backups/1723610394559.zip')]),
			'1723610394559.zip'
		);
		body.append(
			'payload_json',
			JSON.stringify({
				content: 'Este es un mensaje enviado mediante fetch.',
				embeds: [
					{
						title: 'Título del Embed',
						description: 'Descripción del Embed',
						color: 16711680
					}
				],
				files: [
					{
						id: 0,
						description: 'Backup!',
						filename: '1723610394559.zip'
					}
				]
			})
		);

		fetch(Bun.env.WEBHOOK, {
			method: 'POST',
			headers: {
				'Content-Type': 'multipart/form-data'
			},
			body
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
