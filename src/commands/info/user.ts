import { profileImage } from 'discord-arts';
import type { Member, User } from 'oceanic.js';
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

        const member = await ctx.guild?.getMember(user.id) as Member
        
        const timestamp = {
            created: Number((Number((BigInt(user.id) >> 22n) + 1420070400000n) / 1000).toFixed()),
            joined: member.joinedAt?.valueOf()
        }

		const data = (await (
			await fetch(`https://discord-arts.asure.dev/v1/user/${user.id}`)
		)
			.json()
			.catch((_) => ({}))).data;

		const photo = data.assets.avatarURL ?? data.assets.defaultAvatarURL;

		ctx.send({
			embeds: [
				{
					title: user.globalName ?? `${user.username}#${user.discriminator}`,
					color: data.decoration.profileColors ? parseInt(data.decoration.profileColors[1].slice(1), 16) : ctx.util.random(16777215),
					image: {
						url: `attachment://${user.id}.card.png`
					},
					thumbnail: {
						url: `attachment://${user.id}.icon.png`
                    },
                    description: `- **Name**: ${user.globalName}
                    - **Nick**: ${member.nick ?? 'Do not have a nickname'}
                    - **User**: ${user.tag}
                    - **Creation date**: <t:${timestamp.created}:d> <t:${timestamp.created}:T>
                    ${timestamp.joined ? `- **Joined date**: <t:${timestamp.joined}:d> <t:${timestamp.joined}:T>` : ''}`
				}
			],
			files: [
				{
					name: `${user.id}.card.png`,
					contents: await profileImage(user.id)
				},
				{
					name: `${user.id}.icon.png`,
					contents: await ctx.util.canva.circle_cut(`${photo}?size=1024`)
				}
			]
		});
	}
);
