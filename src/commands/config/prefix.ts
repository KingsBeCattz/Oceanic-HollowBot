import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'prefix',
		description: 'Set or get the prefix',
		type: CommandTypes.Configuration,
		nsfw: false
	},
	[],
	[
		{
			type: 1,
			name: 'get',
			description: 'Get the prefix'
		},
		{
			type: 1,
			name: 'set',
			description: 'Set the prefix (Requires Manage Guild permission)',
			options: [
				{
					type: 3,
					name: 'prefix',
					description: 'Prefix to set as the guild prefix',
					required: true
				}
			]
		},
		{
			type: 1,
			name: 'reset',
			description: 'Reset the prefix (Requires Manage Guild permission)'
		}
	],
	async (ctx) => {
		const action = ctx.subcommand(ctx.args?.shift() || 'get')?.toLowerCase();

		const reset = () => {
			ctx.db.delete('guilds', `${ctx.guild?.id}.prefix`);

			ctx.send({
				content: `My prefix is reset! It is now \`${process.env.PREFIX}\`\n-# By the way, if you tag me, I also respond!`
			});
		};

		switch (action) {
			case 'set': {
				const prefix = ctx.get('prefix', ctx.args?.shift())?.toLowerCase();
				if (!prefix)
					return ctx.send({
						content: 'You have to give a new prefix, for example `!` or `>`.'
					});

				switch (true) {
					case prefix === ctx.prefix:
						ctx.send({
							content: 'My prefix is already that one!'
						});
						return;
					case prefix === process.env.PREFIX:
						reset();
						return;
				}

				ctx.db.set('guilds', `${ctx.guild?.id}.prefix`, prefix);
				ctx.send({
					content: `My prefix is now \`${prefix}\`\n-# By the way, if you tag me, I also respond!`
				});
				break;
			}

			case 'reset':
				reset();
				break;

			default:
				ctx.send({
					content:
						process.env.PREFIX !== ctx.prefix
							? `My prefix is \`${ctx.prefix}\`, but globaly is \`${Bun.env.PREFIX}\`\n-# By the way, if you tag me, I also respond!`
							: `My prefix is \`${Bun.env.PREFIX}\`\n-# By the way, if you tag me, I also respond!`
				});
		}
	}
);
