import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command({
	data: {
		name: 'reboot',
		description: 'Restart the whole bot process',
		type: CommandTypes.Developer,
		nsfw: false
	},
	permissions: ['developer'],
	code: async (ctx) => {
		await ctx.send({
			content:
				'Restarting...\n-# When I start back I will send notice on this same channel.'
		});

		ctx.db.set('client', 'notify.reboot', ctx.channel?.id ?? ctx.user.id);

		const child = Bun.spawn({
			cmd: process.argv,
			detached: true,
			stdout: 'pipe',
			stderr: 'pipe'
		});

		child.unref();

		process.exit(0);
	}
});
