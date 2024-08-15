import {
	createWriteStream,
	existsSync,
	lstatSync,
	mkdir,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync
} from 'node:fs';
import { join } from 'node:path';
import archiver from 'archiver';
import { write } from 'bun';
import { get, set, unset } from 'lodash';
import { TypedEmitter } from 'oceanic.js';
import { Open } from 'unzipper';
import * as log from './logger';

interface Events {
	start: [db: Database];
	backup: [path: string, type: 'create' | 'use' | 'delete'];
	get: [table: string, key?: string];
	set: [table: string, key: string, value: JSONValue];
}

export class Database extends TypedEmitter<Events> {
	started: boolean;

	constructor(
		public path: string,
		public tables: string[],
		public backupInterval?: number
	) {
		super();
		this.started = false;

		if (!tables.includes('main')) tables.unshift('main');
	}

	public start() {
		if (this.started)
			return log.warn(
				'The database cannot be restarted, it is already started.',
				'Database.start()'
			);

		const path = join(process.cwd(), this.path);
		this.started = true;

		if (!this.started) this.started = true;

		if (!existsSync(path))
			mkdir(this.path, () =>
				log.info(`Path created: "${path}"`, 'Database.start()')
			);

		const tables_path = join(path, 'tables');

		if (!existsSync(tables_path))
			mkdir(tables_path, () =>
				log.info(`Path created: "${tables_path}"`, 'Database.start()')
			);

		const backups_path = join(path, 'tables');

		if (!existsSync(backups_path))
			mkdir(backups_path, () =>
				log.info(`Path created: "${backups_path}"`, 'Database.start()')
			);

		for (const table of this.tables) {
			const table_path = join(tables_path, `${table}.json`);

			if (!existsSync(table_path)) write(table_path, '{}');
		}

		this.emit('start', this);

		if (this.backupInterval)
			setInterval(() => this.backup(), this.backupInterval);
	}

	public async backup() {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}

		const db = join(process.cwd(), this.path);

		const tables = join(db, 'tables');

		const backup_name = `${Date.now()}.zip`;

		const backup = join(db, 'backups', backup_name);

		const archive = archiver('zip', {
			zlib: { level: 9 }
		});

		try {
			archive.pipe(createWriteStream(backup) as unknown as NodeJS.WritableStream);

			for (const table of readdirSync(tables))
				archive.file(join(tables, table), { name: table });

			await archive.finalize();

			this.emit('backup', join(this.path, 'backups', backup_name), 'create');

			log.info(
				`Backup created! Path: ${join(this.path, 'backups', backup_name)}`,
				'DATABASE.BACKUP()'
			);
			return true;
		} catch (e) {
			log.error(String(e), 'DATABASE.BACKUP()');
			return false;
		}
	}

	public async goback(id: string) {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}
		const backup = join(process.cwd(), this.path, 'backups', `${id}.zip`);

		if (lstatSync(backup).isDirectory()) {
			log.error(
				'The id provided is not a valid endorsement',
				'DATABASE.DELBACKUP()'
			);
			return false;
		}

		const files = (await Open.file(backup)).files;

		const tables = files.map((f) => f.path);

		try {
			for (const file of files) {
				file
					.stream()
					.pipe(
						createWriteStream(
							join(process.cwd(), this.path, 'tables', file.path)
						) as unknown as NodeJS.WritableStream
					);
			}

			this.emit('backup', join(this.path, 'backups', `${id}.zip`), 'use');

			log.info(
				`The backup "${id}" was used.\n\tTables:\n\t| ${tables.join('\n\t| ')}`,
				'DATABASE.GOBACK()'
			);
			return true;
		} catch (e) {
			log.error(String(e), 'DATABASE.GOBACK()');
			return false;
		}
	}

	public async delbackup(id: string) {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}
		const backup = join(process.cwd(), this.path, 'backups', `${id}.zip`);
		if (!existsSync(backup) || lstatSync(backup).isDirectory()) {
			log.error(
				'The id provided is not a valid endorsement',
				'DATABASE.DELBACKUP()'
			);
			return false;
		}

		try {
			this.emit('backup', join(this.path, 'backups', `${id}.zip`), 'delete');
			rmSync(backup);
			return true;
		} catch (e) {
			log.error(String(e), 'DATABASE.DELBACKUP()');
			return false;
		}
	}

	public async getbackup(id: string) {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}

		const backup = join(process.cwd(), this.path, 'backups', `${id}.zip`);

		if (lstatSync(backup).isDirectory()) {
			log.error(
				'The id provided is not a valid endorsement',
				'DATABASE.DELBACKUP()'
			);
			return false;
		}

		const files: { table: string; content: JSONObject }[] = [];

		for (const file of (await Open.file(backup)).files)
			files.push({
				table: file.path.replace('.json', ''),
				content: JSON.parse((await file.buffer()).toString()) as JSONObject
			});

		return files;
	}

	private insert(table: (typeof this.tables)[number], json: JSONObject) {
		const path = join(process.cwd(), this.path, 'tables', `${table}.json`);

		if (!existsSync(join(process.cwd(), this.path, 'tables')))
			mkdirSync(join(process.cwd(), this.path, 'tables'));
		writeFileSync(path, JSON.stringify(json, null, 2));
	}

	private type(value: JSONValue) {
		if (Array.isArray(value)) return 'array';
		return typeof value;
	}

	public async get(
		table: (typeof this.tables)[number]
	): Promise<JSONObject | null>;
	public async get(
		table: (typeof this.tables)[number],
		key: string
	): Promise<JSONValue | null>;
	public async get(
		table: (typeof this.tables)[number],
		key?: string
	): Promise<JSONObject | JSONValue | null> {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}
		if (!table) {
			log.error('You must give a table', 'DATABASE.GET()');

			return null;
		}

		const path = join(process.cwd(), this.path, 'tables', `${table}.json`);

		if (!existsSync(path) || lstatSync(path).isDirectory()) {
			log.error('The given table is invalid', 'DATABASE.GET()');

			return null;
		}

		const data: JSONObject = JSON.parse(readFileSync(path).toString());

		if (!key) {
			this.emit('get', table);
			return data;
		}

		this.emit('get', table, key);
		return get(data, key) ?? null;
	}

	public async set(
		table: (typeof this.tables)[number],
		key: string,
		value: JSONValue
	) {
		if (!this.started) {
			log.warn(
				'You must initialize the database! Use the .start() method',
				'Database.CREATE_BACKUP()'
			);
			return false;
		}
		if (!table || typeof table !== 'string') {
			log.error('You must give a table', 'DATABASE.SET()');
			return null;
		}
		if (!key || typeof key !== 'string') {
			log.error('You must give a key', 'DATABASE.SET()');
			return null;
		}
		if (
			!value ||
			!['string', 'number', 'boolean', 'object', 'array'].includes(
				this.type(value)
			)
		) {
			log.error('You must give a value', 'DATABASE.SET()');
			return null;
		}

		const data: JSONObject = JSON.parse(
			readFileSync(
				join(process.cwd(), this.path, 'tables', `${table}.json`)
			).toString()
		);

		this.insert(table, set(data, key, value));
		return data;
	}

	public async exists(table: (typeof this.tables)[number]): Promise<boolean>;
	public async exists(
		table: (typeof this.tables)[number],
		key: string
	): Promise<boolean>;
	public async exists(
		table: (typeof this.tables)[number],
		key?: string
	): Promise<boolean> {
		try {
			if (!this.started) {
				log.warn(
					'You must initialize the database! Use the .start() method',
					'Database.CREATE_BACKUP()'
				);
				return false;
			}
			const data: JSONObject = JSON.parse(
				readFileSync(
					join(process.cwd(), this.path, 'tables', `${table}.json`)
				).toString()
			);

			if (!key) return Boolean(data);
			return Boolean(get(data, key));
		} catch (e) {
			log.error(String(e), 'DATABASE.EXISTS()');
			return false;
		}
	}

	public async delete(table: (typeof this.tables)[number]): Promise<boolean>;
	public async delete(
		table: (typeof this.tables)[number],
		key: string
	): Promise<boolean>;
	public async delete(
		table: (typeof this.tables)[number],
		key?: string
	): Promise<boolean> {
		try {
			if (!key) {
				this.insert(table, {});
				return true;
			}

			const data = (await this.get(table)) || {};
			unset(data, key);

			this.insert(table, data);
			return true;
		} catch (e) {
			log.error(String(e), 'DATABASE.DELETE()');
			return false;
		}
	}
}
