import { Message } from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command({
	data: {
		name: 'pull',
		description: 'I download the code available on github',
		type: CommandTypes.Developer,
		nsfw: false
	},
	permissions: ['developer'],
	code: async (ctx) => {
		if (!(ctx.data instanceof Message)) await ctx.data.defer();
		const message = ctx.send({
			content: 'Updating...'
		});

		const output = await Bun.$`git pull`.text();

		(await message).edit({
			content: `\`\`\`sh\n${output}\n\`\`\``
		});
	}
});
