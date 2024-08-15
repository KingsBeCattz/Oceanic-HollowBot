import { inspect } from 'node:util';
import { Transpiler } from 'bun';
import type { ButtonComponent, TextButton } from 'oceanic.js/dist/lib/types';
import { create } from 'sourcebin';
import { Command, CommandTypes } from 'src/builders/command.builder';
import * as log from '../../auxiliar/logger';

const transpiler = new Transpiler({
	loader: 'ts'
});

export default new Command(
	{
		name: 'eval',
		description: 'Evaluate a TS/JS code',
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
			name: 'code',
			description: 'Code to evaluate',
			required: true
		}
	],
	async (ctx) => {
		const time = Date.now();
		let eval_ = '';
		let type:
			| 'string'
			| 'number'
			| 'bigint'
			| 'boolean'
			| 'symbol'
			| 'undefined'
			| 'object'
			| 'function'
			| 'array'
			| 'unknown'
			| 'error' = 'unknown';

		try {
			// biome-ignore lint/security/noGlobalEval: The use is protected by conditionals
			eval_ = await eval(
				await transpiler.transform(ctx.get('code', ctx.args?.join(' ')) as string)
			);

			type = Array.isArray(eval_) ? 'array' : typeof eval_;
		} catch (e) {
			log.error(String(e), 'EVAL.COMMAND');

			eval_ = String(e);
			type = 'error';
		}

		if (type === 'function') eval_ = eval_.toString();
		else
			eval_ = inspect(eval_, {
				depth: 0,
				showHidden: true
			});

		let output = `\`\`\`ts\n${eval_}\n\`\`\``
			.replaceAll(process.env.TOKEN, '[TOKEN]')
			.replaceAll('    ', '  ');

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
			},
			{
				type: 2,
				style: type === 'error' ? 4 : 2,
				customID: 'type',
				label: type.capitalize(),
				emoji: {
					id: '1129498662272245800'
				},
				disabled: true
			}
		];

		if (output.length > 2000) {
			const bin = await create({
				files: [
					{
						content: `/**\n * Type: ${type.capitalize()}\n * Time: ${(components[0] as TextButton).label}\n*/\n\n${eval_}`,
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

		await ctx.send(
			{
				content: output,
				components: [
					{
						type: 1,
						components
					}
				]
			},
			true
		);
	}
);
