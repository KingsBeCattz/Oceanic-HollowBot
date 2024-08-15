import { existsSync, lstatSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Collection } from 'oceanic.js';
import type { Command } from 'src/builders/command.builder';
import * as log from './logger';

export class CommandManager extends Collection<string, Command> {
	private async _load(path: string) {
		const globalpath = join(process.cwd(), path);
		if (!existsSync(globalpath)) mkdirSync(globalpath);
		for (const route of readdirSync(globalpath)) {
			const module = join(globalpath, route);

			if (lstatSync(module).isDirectory()) {
				this._load(join(path, route));
				continue;
			}

			delete require.cache[require(module).default];
			const command: MaybeArray<Command> = require(module).default;

			if (Array.isArray(command))
				for (const cmd of command) {
					if (!cmd || !cmd.data.name) continue;
					this.set(cmd.data.name, cmd);
				}
			else {
				if (!command || !command.data.name) continue;
				this.set(command.data.name, command);
			}
		}
	}

	async load(path: string) {
		try {
			await this._load(path);

			if (!this.size) {
				log.warn(
					'The command folder was read but there are no commands',
					'CommandManager.Load'
				);
				return;
			}

			const commands: string[] = [];

			for (const command of this.values()) {
				commands.push(`${command.data.name}`);
			}

			log.info(
				`Commands loaded:\n\t${commands.join('\n\t')}`,
				'CommandManager.Load'
			);
		} catch (e) {
			log.error(String(e), 'CommandManager.Load');
		}
	}
}
