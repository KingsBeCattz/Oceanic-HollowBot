import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'pull',
		description: 'I download the code available on github',
		type: CommandTypes.Developer,
		nsfw: false
	},
	['developer'],
	[],
	[],
	async (ctx) => {
		const message = ctx.send({
			content: 'Updating...'
		});

		const output = await Bun.$`git pull`.text();

		(await message).edit({
			content: `\`\`\`sh\n${output}\n\`\`\``
		});
	}
);
