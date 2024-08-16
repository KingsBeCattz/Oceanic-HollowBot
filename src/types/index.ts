declare global {
	type MaybePromise<T> = Promise<T> | T;

	type MaybeArray<T> = T[] | T;

	type JSONValue = string | number | boolean | JSONValue[] | JSONObject;

	type JSONObject = { [k: string]: JSONValue };

	type DSTNProfile = {
		user: {
			id: string;
			username: string;
			global_name: string | null;
			avatar: string | null;
			avatar_decoration_data: {
				asset: string;
				sku_id: string;
				expires_at: string | null;
			} | null;
			discriminator: string;
			public_flags: number;
			clan: null;
			flags: number;
			banner: string | null;
			banner_color: string | null;
			accent_color: number | null;
			bio: string;
		};
		user_profile: {
			bio: string;
			accent_color?: number | null;
			pronouns?: string;
			profile_effect?: {
				id: string;
				expires_at: number | null;
			} | null;
			banner: string | null;
			theme_colors?: [number, number];
			popout_animation_particle_type: null;
			emoji: null;
		};
		legacy_username: string | null;
		connected_accounts: {
			type: string;
			id: string;
			name: string;
			verified: boolean;
		}[];
		premium_since: string | null;
		premium_type: number | null;
		premium_guild_since: string | null;
	};

	interface String {
		capitalize(): string;
	}

	interface Number {
		format(): string;
	}

	interface BigInt {
		format(): string;
	}

	interface Array<T> {
		format(separators?: { comma: string; and: string }): string;
	}
}

export type {};
