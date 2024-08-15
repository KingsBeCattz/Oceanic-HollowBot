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
					description: `**Version**: ${packagejson.version}\n**Runtime**: Bun@${Bun.version}\n**Language**: TypeScript\n**Library**: Oceanic.JS@${VERSION}\n**Developer**: <@${owner.user.id}>`,
					fields: [
						{
							name: 'Stats',
							value: `Servers: ${ctx.client.guilds.size.format()}\nUsers: ${ctx.client.guilds
								.map((g) => g.memberCount)
								.reduce((a, b) => a + b, 0)
								.format()}\nCommands: ${ctx.util.commands.size.format()}`,
							inline: true
						}
					],
					color: 0,
					thumbnail: {
						url: `https://cdn.discordapp.com/avatars/${bot.user.id}/${bot.user.avatar}.png`
					},
					image: {
						url: `https://cdn.discordapp.com/banners/${bot.user.id}/${bot.user.banner}.gif?size=2048`
					}
				}
			]
		});
	}
);
