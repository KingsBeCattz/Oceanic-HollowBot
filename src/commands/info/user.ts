import { profileImage } from 'discord-arts';
import type { Guild, Member, User } from 'oceanic.js';
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
		const member =
			(await ctx.util.findMember(
				(ctx.guild as Guild).id,
				((await ctx.get('user')) as User)?.id ?? ctx.args?.shift()
			)) ?? (ctx.member as Member);

		const timestamp = {
			created: Number((member.user.createdAt.valueOf() / 1000).toFixed()),
			joined: Number(
				((member.joinedAt ?? member.user.createdAt)?.valueOf() / 1000).toFixed()
			)
		};

		const data = (
			await (
				await fetch(`https://discord-arts.asure.dev/v1/user/${member.id}`)
			)
				.json()
				.catch((_) => ({}))
		).data;

		const photo = data.assets.avatarURL ?? data.assets.defaultAvatarURL;

		ctx.send({
			embeds: [
				{
					title:
						member.user.globalName ??
						`${member.user.username}#${member.user.discriminator}`,
					color: data.decoration.profileColors
						? Number.parseInt(data.decoration.profileColors[1].slice(1), 16)
						: ctx.util.random.number(16777215),
					image: {
						url: `attachment://${member.id}.card.png`
					},
					thumbnail: {
						url: `attachment://${member.id}.icon.png`
					},
					description: `- **Name**: ${member.user.globalName ?? member.user.username}\n - **Nick**: ${member.nick ?? "Don't have a nickname"}\n- **User**: ${member.user.tag} (<@${member.id}>)\n- **Creation date**: <t:${timestamp.created}:d> <t:${timestamp.created}:T>\n${timestamp.joined ? `- **Joined date**: <t:${timestamp.joined}:d> <t:${timestamp.joined}:T>` : ''}`,
					fields: [
						{
							name: 'Medals',
							value: `Don't have any medal!`
						},
						{
							name: 'Roles',
							value: member.roles.length
								? member.roles.map((r) => `<@&${r}>`).format()
								: 'It has no roles!'
						}
					]
				}
			],
			files: [
				{
					name: `${member.id}.card.png`,
					contents: await profileImage(member.id, {
						badgesFrame: true,
						presenceStatus: member.presence?.clientStatus.mobile
							? 'phone'
							: member.presence?.status
					})
				},
				{
					name: `${member.id}.icon.png`,
					contents: await ctx.util.canva.circle_cut(`${photo}?size=1024`)
				}
			]
		});
	}
);
