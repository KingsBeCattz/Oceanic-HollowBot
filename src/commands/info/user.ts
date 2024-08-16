import { profileImage } from 'discord-arts';
import type { Guild, Member } from 'oceanic.js';
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
		const member = ctx.get(
			'user',
			await ctx.util.findMember((ctx.guild as Guild).id, ctx.args?.shift() ?? ctx.user.id)
        ) as Member;
        
        const timestamp = {
            created: Number((member.user.createdAt.valueOf() / 1000).toFixed()),
            joined: Number(((member.joinedAt ?? member.user.createdAt)?.valueOf() /1000).toFixed())
        }

		const data = (await (
			await fetch(`https://discord-arts.asure.dev/v1/user/${member.user.id}`)
		)
			.json()
			.catch((_) => ({}))).data;

		const photo = data.assets.avatarURL ?? data.assets.defaultAvatarURL;

		ctx.send({
			embeds: [
				{
					title: member.user.globalName ?? `${member.user.username}#${member.user.discriminator}`,
					color: data.decoration.profileColors ? parseInt(data.decoration.profileColors[1].slice(1), 16) : ctx.util.random(16777215),
					image: {
						url: `attachment://${member.user.id}.card.png`
					},
					thumbnail: {
						url: `attachment://${member.user.id}.icon.png`
                    },
                    description: `- **Name**: ${member.user.globalName}\n - **Nick**: ${member.nick ?? 'Don\'t have a nickname'}\n- **User**: ${member.user.tag}\n- **Creation date**: <t:${timestamp.created}:d> <t:${timestamp.created}:T>\n${timestamp.joined ? `- **Joined date**: <t:${timestamp.joined}:d> <t:${timestamp.joined}:T>` : ''}`,
                    fields: [
                        {
                            name: 'Medals',
                            value: `Don't have any medal!`
                        },
                        {
                            name: 'Roles',
                            value: member.roles.format()
                        }
                    ]
				}
			],
			files: [
				{
					name: `${member.user.id}.card.png`,
					contents: await profileImage(member.user.id)
				},
				{
					name: `${member.user.id}.icon.png`,
					contents: await ctx.util.canva.circle_cut(`${photo}?size=1024`)
				}
			]
		});
	}
);
