import { WebhookClient } from 'discord.js';
import { Client } from 'oceanic.js';
import { Database } from './auxiliar/database';
import * as log from './auxiliar/logger';
import { Util } from './auxiliar/util';

String.prototype.capitalize = function (): string {
	if (this.length === 0) return this as string;
	return this.charAt(0).toUpperCase() + this.slice(1);
};

Number.prototype.format = function (): string {
	return String(this).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const client = new Client({
	auth: `Bot ${process.env.TOKEN}`,
	gateway: {
		intents: ['ALL']
	}
});

const webhook = new WebhookClient({
	url: 'https://discord.com/api/webhooks/1273715273857372262/5oG4fP65nqa0pyOuoo6v0rIJ4PTGblSO67GNmaAG0yDNVg229A-aE8uww5C2uTLjC5CL'
});

export const util = new Util(client);

export const db = new Database('./src/database', ['main', 'users', 'guilds']);

util.events.load('/src/events/');
util.commands.load('/src/commands/');

db.start();

db.on('backup', (path, type) => {
	if (type !== 'create') return;

	webhook.send({
		files: [
			{
				attachment: path
			}
		]
	});
});

process.on('unhandledRejection', (err) => log.error(String(err), 'REJECTION'));

client.connect();
