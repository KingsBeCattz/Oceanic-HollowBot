import { profileImage } from 'discord-arts';
import { VERSION } from 'oceanic.js';
import packagejson from 'package.json';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command(
	{
		name: 'client',
		description: 'Get all about me',
		type: CommandTypes.Developer,
		nsfw: false
	},
	[],
	[],
	[],
	async (ctx) => {
		const bot = await ctx.profile(ctx.client.user.id);
		const owner = await ctx.profile('1125490330679115847');

		ctx.send({
			embeds: [
				{
					title: bot.user.username,
					fields: [
						{
							name: 'Stats',
							value: `**Servers**: ${ctx.client.guilds.size.format()}\n**Users**: ${ctx.client.guilds
								.map((g) => g.memberCount)
								.reduce((a, b) => a + b, 0)
								.format()}\n**Commands**: ${ctx.util.commands.size.format()}\n**Slashes**: ${(await ctx.client.application.getGlobalCommands()).length.format()}\n**Developer**: <@${owner.user.id}>`,
							inline: true
						},
						{
							name: 'Host',
							value: `**CPU model**:${ctx.util.cpu().model}\n**CPU usage**:${ctx.util.cpu().usage}%\n**Ping**: ${ctx.util.ping()}ms`,
							inline: true
						},
						{
							name: 'System',
							value: `**Version**: ${packagejson.version}\n**Runtime**: Bun@${Bun.version}\n**Language**: TypeScript\n**Library**: Oceanic.JS@${VERSION}`,
							inline: true
						}
					],
					color: 0,
					image: {
						url: `attachment://${ctx.client.user.id}.card.png`
					}
				}
			],
			files: [
				{
					name: `${ctx.client.user.id}.card.png`,
					contents: await profileImage(ctx.client.user.id, {
						badgesFrame: true,
						presenceStatus: ctx.guild?.clientMember.presence?.clientStatus.mobile
							? 'phone'
							: ctx.guild?.clientMember.presence?.status,
						customTag: 'An awesome bot!',
						customDate: 'Hello from Mexico!'
					})
				}
			]
		});
	}
);
