import { inspect } from 'node:util';
import { Transpiler } from 'bun';
import { Message } from 'oceanic.js';
import type { ButtonComponent, TextButton } from 'oceanic.js/dist/lib/types';
import { create } from 'sourcebin';
import { Command, CommandTypes } from 'src/builders/command.builder';
import * as log from '../../auxiliar/logger';

const transpiler = new Transpiler({
	loader: 'ts'
});

export default new Command({
	data: {
		name: 'eval',
		description: 'Evaluate a TS/JS code',
		type: CommandTypes.Developer,
		nsfw: false
	},
	permissions: ['developer'],
	options: [
		{
			type: 3,
			name: 'code',
			description: 'Code to evaluate',
			required: true
		}
	],
	code: async (ctx) => {
		if (!(ctx.data instanceof Message)) await ctx.data.defer();
		const message = await ctx.send({
			content: "# EVALUATING..."
		}, true);

		const time = Date.now();
		let eval_: string;
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

		const code = ctx.get('code', ctx.args?.join(' '))?.split(' ') || [];
		const flag = code.shift();

		if (
			flag &&
			(!flag?.startsWith('--') || !['--sync', '--async'].includes(flag))
		)
			code.unshift(flag);

		let output: string;

		try {
			// biome-ignore lint/security/noGlobalEval: The use is protected by bot permissions
			eval_ = await eval(
				(flag ?? '--sync') === '--async'
					? `(async () => {
				${await transpiler.transform(code.join(' '))}
				})()`
					: await transpiler.transform(code.join(' '))
			);

			type = Array.isArray(eval_) ? 'array' : typeof eval_;

			if (type === 'function') eval_ = eval_.toString();
			else
				eval_ = inspect(eval_, {
					depth: 0,
					showHidden: true
				});

			output = `\`\`\`ts\n${eval_}\n\`\`\``
				.replaceAll(process.env.TOKEN, '[TOKEN]')
				.replaceAll('    ', '  ');
		} catch (err) {
			const message =
				err instanceof Error ? err.stack ?? String(err) : String(err);

			log.error(message, 'EVAL.COMMAND');

			output = `\`\`\`sh\n${message}\n\`\`\``;
			eval_ = message;
			type = 'error';
		}

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
			customID: 'delete.eval.private',
			label: 'Delete',
			emoji: {
				id: '1129492489020121169'
			},
			disabled: false
		});

		message.edit(
			{
				content: output,
				components: [
					{
						type: 1,
						components
					}
				]
			}
		);
	}
});
