import { db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('guildMemberAdd', async (member) => {
	const data = (await db.get('guilds', `${member.guild.id}.welcomes`)) as {
		channel?: string;
		embed?: {
			title?: string;
			description?: string;
			image?: string;
			color?: string;
		};
	};

	if (!data.channel) return;

	const def = (await db.get('client', 'welcomes.embed')) as {
		title: string;
		description: string;
		image: string;
	};

	const replacements = {
		username: member.user.globalName ?? member.user.username,
		usertag: member.user.tag,
		userid: member.user.id,
		guild: member.guild?.name,
		membercount: member.guild?.memberCount,
		ownerid: member.guild?.ownerID ?? null,
		date: `<t:${(Date.now() / 1000).toFixed()}>`
	};

	member.client.rest.channels.createMessage(data.channel, {
		embeds: [
			{
				title: (data.embed?.title ?? def.title).replace(
					/{(\w+)}/g,
					(_, key) => replacements[key] ?? `{${key}}`
				),
				description: (data.embed?.description ?? def.description).replace(
					/{(\w+)}/g,
					(_, key) => replacements[key] ?? `{${key}}`
				),
				color: /^([A-Fa-f0-9]{6})$/.test(data.embed?.color ?? '')
					? Number.parseInt(data.embed?.color as string, 16)
					: 8649506,
				image: {
					url: /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(
						data.embed?.image ?? ''
					)
						? (data.embed?.image as string)
						: def.image
				},
				thumbnail: {
					url: member.client.util.formatImage(
						member.user.avatar
							? `/avatars/${member.user.id}/${member.user.avatar}`
							: `/embed/avatars/${Number(member.user.discriminator) === 0 ? (Number(member.user.id) >> 22) % 6 : Number(member.user.discriminator) % 5}`
					)
				}
			}
		]
	});
});
