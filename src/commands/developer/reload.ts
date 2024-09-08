import { Message } from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command({
	data: {
		name: 'reload',
		description: 'Reloads commands',
		type: CommandTypes.Developer,
		nsfw: false
	},
	permissions: ['developer'],
	code: async (ctx) => {
		if (!(ctx.data instanceof Message)) await ctx.data.defer();
		const time = Date.now();

		await ctx.util.commands.load('/src/commands/');

		const commands_delay = Date.now() - time;

		await ctx.util.upload_slashes();

		const slashes_delay = Date.now() - time - commands_delay;

		const slashes = await ctx.client.application.getGlobalCommands();

		ctx.send({
			content: `# All commands reloaded\n[**${commands_delay}ms**] Commands: ${ctx.util.commands.size}\n[**${slashes_delay}ms**] Slashes: ${slashes.length}`
		});
	}
});
