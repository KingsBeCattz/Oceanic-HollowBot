import {
	type AnyGuildChannel,
	type Embed,
	Message,
	type VoiceChannel
} from 'oceanic.js';
import { Command, CommandTypes } from 'src/builders/command.builder';

export default new Command({
	data: {
		name: 'channel',
		description: 'Get all about a channel!',
		nsfw: false,
		type: CommandTypes.Information
	},
	options: [
		{
			type: 7,
			name: 'channel',
			description: 'User to get',
			required: false
		}
	],
	code: async (ctx) => {
		const channel =
			(await ctx.util.findChannel(
				ctx.guild?.id ?? '',
				(ctx.data instanceof Message
					? ctx.args?.shift()
					: ctx.data.data.options.resolved?.channels.first()?.id) as string
			)) ?? (ctx.channel as AnyGuildChannel);

		const created = String(
			((BigInt(channel.id) >> 22n) + 1420070400000n) / 1000n
		);

		const regions = {
			auto: 'Automatic',
			brazil: 'Brazil',
			hongkong: 'Hong Kong',
			india: 'India',
			japan: 'Japan',
			rotterdam: 'Rotterdam',
			russia: 'Russia',
			singapore: 'Singapore',
			southafrica: 'South Africa',
			sydney: 'Sydney',
			'us-central': 'US Central',
			'us-south': 'US South',
			'us-east': 'US East',
			'us-west': 'US West'
		};

		const hasTopic =
			channel.type === 2 || channel.type === 13 || !('topic' in channel);

		const embed: Embed = {
			title: `${channel.type === 4 ? 'Category' : 'Channel'}: ${channel.name}`,
			description: hasTopic
				? undefined
				: !channel.topic
					? 'No topic'
					: channel.topic,
			color: ctx.util.random.number(16777215),
			thumbnail: {
				url: `https://cdn.discordapp.com/emojis/${ctx.util.get_channel_emoji(channel.type).id}.png`
			},
			fields: [
				{
					name: 'Type',
					value: ctx.util.get_channel_type(channel.type),
					inline: true
				},
				{
					name: 'ID',
					value: channel.id,
					inline: true
				},
				{
					name: 'Created At',
					value: `<t:${created}:d> <t:${created}:T>`,
					inline: true
				}
			]
		};

		if ('position' in channel)
			embed.fields?.push({
				name: 'Position',
				value: `#${channel.position}`,
				inline: true
			});

		if ('nsfw' in channel)
			embed.fields?.push({
				name: 'NSFW?',
				value: channel.nsfw ? 'Yes' : 'No',
				inline: true
			});

		if ('rateLimitPerUser' in channel)
			embed.fields?.push({
				name: 'Cooldown Per User',
				value: `${channel.rateLimitPerUser}s`,
				inline: true
			});

		if ('ownerID' in channel)
			embed.fields?.push({
				name: 'Owner',
				value: `<@${channel.ownerID}>`,
				inline: true
			});

		if ('threadMetadata' in channel)
			embed.fields?.push(
				{
					name: 'Archived?',
					value: channel.threadMetadata.archived
						? `Yes <t:${(channel.threadMetadata.archiveTimestamp.valueOf() / 1000).toFixed()}>`
						: 'No',
					inline: true
				},
				{
					name: 'Locked?',
					value: channel.threadMetadata.locked ? 'Yes' : 'No',
					inline: true
				}
			);

		if ('bitrate' in channel)
			embed.fields?.push({
				name: 'Bitrate',
				value: `${channel.bitrate / 1000}kbps`,
				inline: true
			});

		if ('userLimit' in channel)
			embed.fields?.push({
				name: 'User Limit',
				value: String(channel.userLimit),
				inline: true
			});

		if ('rtcRegion' in channel)
			embed.fields?.push({
				name: 'RTC Region',
				value: (channel.rtcRegion ?? 'auto').replace(
					/{(\w+)}/g,
					(_, key) => regions[key] ?? 'Unknown'
				),
				inline: true
			});

		if (channel.type === 2 || channel.type === 13)
			embed.fields?.push({
				name: 'Video Quality',
				value: ['Auto', '720p'][
					((channel as VoiceChannel).videoQualityMode ?? 1) - 1
				],
				inline: true
			});

		ctx.send({
			embeds: [embed],
			components: [
				{
					type: 1,
					components: [
						{
							type: 2,
							style: 5,
							label: 'Go to channel',
							emoji: ctx.util.get_channel_emoji(channel.type),
							url: `https://discord.com/channels/${channel.guildID}/${channel.id}`
						}
					]
				}
			]
		});
	}
});
