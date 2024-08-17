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
	async () => {
		new Promise((_, reject) => reject(new Error('Something went wrong')));
	}
);
