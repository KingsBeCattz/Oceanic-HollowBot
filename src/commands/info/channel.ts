import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'channel',
		description: 'Get all about a channel!',
		nsfw: false,
		type: CommandTypes.Information
	},
	[],
	[],
	[
		{
			type: 7,
			name: 'channel',
			description: 'User to get',
			required: false
		}
	],
	async (ctx) => {}
);
