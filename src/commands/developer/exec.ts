import { $ } from 'bun';
import type { ButtonComponent, TextButton } from 'oceanic.js/dist/lib/types';
import { create } from 'sourcebin';
import { Command, CommandTypes } from 'src/builders/command.builder';
import * as log from '../../auxiliar/logger';

export default new Command(
	{
		name: 'exec',
		description: 'Execute a shell script',
		type: CommandTypes.Developer,
		nsfw: false
	},
	[
		async (ctx) =>
			(
				(await ctx.db.get('users', `${ctx.user.id}.permissions`)) as string[]
			)?.includes('developer') ?? false
	],
	[
		{
			type: 3,
			name: 'script',
			description: 'Script to execute',
			required: true
		}
	],
	async (ctx) => {
		const message = await ctx.send({
			content: 'Executing...'
		});

		const script = ctx.get('script', ctx.args?.join(' '));

		console.log(script);

		const time = Date.now();
		let response: string;

		try {
			// biome-ignore lint/security/noGlobalEval: Usage is protected with conditionals
			response = await eval(`await require("bun").$\`${script}\`.text()`);
		} catch (e) {
			console.error(e);
			log.error(String(e), 'EXEC.COMMAND');

			response = String(e);
		}

		let output = `\`\`\`sh\n${response}\n\`\`\``;

		let components: ButtonComponent[] = [
			{
				type: 2,
				style: 2,
				customID: 'time',
				label: `${Date.now() - time}ms`,
				emoji: {
					id: '1129498664822374530'
				},
				disabled: true
			}
		];

		if (output.length > 2000) {
			const bin = await create({
				files: [
					{
						content: `/**\n * Time: ${(components[0] as TextButton).label}\n*/\n\n${response}`,
						language: 'typescript'
					}
				]
			});

			output = `\`\`\`\n${bin.shortUrl}\n\`\`\``;
			components = [
				{
					type: 2,
					style: 5,
					url: bin.shortUrl,
					label: 'Source.Bin',
					emoji: {
						id: '1129493685839597618'
					}
				}
			];
		}

		components.unshift({
			type: 2,
			style: 4,
			customID: 'delete.private',
			label: 'Delete',
			emoji: {
				id: '1129492489020121169'
			},
			disabled: false
		});

		message.edit({
			content: output,
			components: [
				{
					type: 1,
					components
				}
			]
		});
	}
);
