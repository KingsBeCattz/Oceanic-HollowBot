import { profileImage } from 'discord-arts';
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
		const data = await ctx.profile(ctx.get('user', ctx.user).id);

		let photo: {
			url: string;
			format: 'png' | 'gif';
		};

		if (data.user.avatar) {
			const f = data.user.avatar.startsWith('a_') ? 'gif' : 'png';

			photo = {
				url: `https://cdn.discordapp.com/avatars/${data.user.id}/${data.user.avatar}.${f}`,
				format: f
			};
		} else
			photo = {
				url: `https://cdn.discordapp.com/embed/avatars/${ctx.util.defaultAvatar(data.user)}.png`,
				format: 'png'
			};

		ctx.send({
			embeds: [
				{
					title:
						data.user.global_name ??
						`${data.user.username}#${data.user.discriminator}`,
					color: ctx.util.random(16777215),
					image: {
						url: `attachment://${data.user.id}.card.png`
					},
					thumbnail: {
						url: `attachment://${data.user.id}.icon.${photo.format}`
					}
				}
			],
			files: [
				{
					name: `${data.user.id}.card.png`,
					contents: await profileImage(data.user.id)
				},
				{
					name: `${data.user.id}.icon.${photo.format}`,
					contents: await ctx.util.canva.circle_cut(photo.url)
				}
			]
		});
	}
);
