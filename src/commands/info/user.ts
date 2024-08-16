import { profileImage } from 'discord-arts';
import type { User } from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'user',
		alias: ['userinfo'],
		description: 'Get all about a user!',
		nsfw: false,
		type: CommandTypes.Information
	},
	[],
	[],
	[
		{
			type: 6,
			name: 'user',
			description: 'User to get',
			required: false
		}
	],
	async (ctx) => {
		const user = ctx.get(
			'user',
			await ctx.util.findUser(ctx.args?.shift() ?? ctx.user.id)
		) as User;
		const data = await (
			await fetch(`https://discord-arts.asure.dev/v1/user/${user.id}`)
		)
			.json()
			.catch((_) => ({}));

		const photo = data.data.assets.avatarURL ?? data.data.assets.defaultAvatarURL;

		ctx.send({
			embeds: [
				{
					title: user.globalName ?? `${user.username}#${user.discriminator}`,
					color: ctx.util.random(16777215),
					image: {
						url: `attachment://${user.id}.card.png`
					},
					thumbnail: {
						url: `attachment://${user.id}.icon.png`
					}
				}
			],
			files: [
				{
					name: `${user.id}.card.png`,
					contents: await profileImage(user.id)
				},
				{
					name: `${user.id}.icon.png`,
					contents: await ctx.util.canva.circle_cut(photo)
				}
			]
		});
	}
);
