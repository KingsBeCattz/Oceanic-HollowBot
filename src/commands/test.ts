import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command({
	data: {
		name: 'test',
		description: 'test',
		type: CommandTypes.Developer,
		nsfw: true
	},
	permissions: ['developer'],
	code: async (_) => await new Promise((_, reject) => reject(new Error('Something went wrong')))
});
