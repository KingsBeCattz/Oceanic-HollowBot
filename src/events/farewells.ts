import { Guild } from 'oceanic.js';
import { db } from 'src';
import { Event } from 'src/builders/event.builder';

export default new Event('guildMemberRemove', async (_user, _guild) => {
	let user = _user;
	if ('user' in user) user = user.user;
	let guild = _guild as Guild;
	if (!(_guild instanceof Guild))
		guild = user.client.guilds.get(_guild.id) as Guild;
	const data = (await db.get('guilds', `${guild.id}.farewells`)) as {
		channel?: string;
		embed?: {
			title?: string;
			description?: string;
			image?: string;
			color?: string;
		};
	};

	if (!data.channel) return;

	const def = (await db.get('client', 'farewells.embed')) as {
		title: string;
		description: string;
		image: string;
	};

	const replacements = {
		username: user.globalName ?? user.username,
		usertag: user.tag,
		userid: user.id,
		guild: guild?.name,
		membercount: guild?.memberCount,
		ownerid: guild?.ownerID ?? null,
		date: `<t:${(Date.now() / 1000).toFixed()}>`
	};

	user.client.rest.channels.createMessage(data.channel, {
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
					: 4728706,
				image: {
					url: /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i.test(
						data.embed?.image ?? ''
					)
						? (data.embed?.image as string)
						: def.image
				},
				thumbnail: {
					url: user.client.util.formatImage(
						user.avatar
							? `/avatars/${user.id}/${user.avatar}`
							: `/embed/avatars/${Number(user.discriminator) === 0 ? (Number(user.id) >> 22) % 6 : Number(user.discriminator) % 5}`
					)
				}
			}
		]
	});
});
