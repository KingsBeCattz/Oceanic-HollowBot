export enum AnsiStyle {
	Reset = '\x1b[0m',

	Bold = '1',
	Dim = '2',
	Italic = '3',
	Underline = '4',
	Blink = '5',
	Inverse = '7',
	Hidden = '8',
	Strikethrough = '9'
}

export enum AnsiColor {
	// Text Colors
	Black = '30',
	Red = '31',
	Green = '32',
	Yellow = '33',
	Blue = '34',
	Magenta = '35',
	Cyan = '36',
	White = '37',

	// Bright Text Colors
	BrightBlack = '90',
	BrightRed = '91',
	BrightGreen = '92',
	BrightYellow = '93',
	BrightBlue = '94',
	BrightMagenta = '95',
	BrightCyan = '96',
	BrightWhite = '97',

	// Background Colors
	BgBlack = '40',
	BgRed = '41',
	BgGreen = '42',
	BgYellow = '43',
	BgBlue = '44',
	BgMagenta = '45',
	BgCyan = '46',
	BgWhite = '47',

	// Bright Background Colors
	BgBrightBlack = '100',
	BgBrightRed = '101',
	BgBrightGreen = '102',
	BgBrightYellow = '103',
	BgBrightBlue = '104',
	BgBrightMagenta = '105',
	BgBrightCyan = '106',
	BgBrightWhite = '107'
}

const time = () => {
	const date = new Date();

	return color(
		`${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
		AnsiStyle.Dim
	);
};

const prefix = color(
	' HollowBot ',
	AnsiStyle.Bold,
	AnsiColor.BgBlue,
	AnsiStyle.Dim
);

export function pad(text: string, length: number, chars = ' '): string {
	if (text.length >= length) return text;
	const start = Math.floor(length / 2) - text.length;
	const end = length - start - text.length;
	return chars.repeat(start) + text + chars.repeat(end);
}

export function createAnsiCode(...styles: string[]): string {
	return `\x1b[${styles.join(';')}m`;
}

export function color(text: string, ...styles: string[]): string {
	return `${createAnsiCode(...styles)}${text}${AnsiStyle.Reset}`;
}

export function format(text: string): string {
	return `\n\t${text.replace(/(\n+)(\s*)/g, '$1\t$2')}\n`;
}

export function info(message: string, from: string) {
	console.log(
		prefix,
		from
			? color(` ${from.toUpperCase()} `, AnsiColor.BgGreen, AnsiStyle.Bold)
			: '',
		color(' INFORMATION ', AnsiColor.BgBrightGreen, AnsiStyle.Bold),
		time(),
		color(format(message), AnsiStyle.Dim)
	);
}

export function debug(message: string, from: string) {
	console.log(
		prefix,
		from
			? color(` ${from.toUpperCase()} `, AnsiColor.BgMagenta, AnsiStyle.Bold)
			: '',
		color(' DEBUG ', AnsiColor.BgBrightMagenta, AnsiStyle.Bold),
		time(),
		color(format(message), AnsiStyle.Dim)
	);
}

export function warn(message: string, from: string) {
	console.log(
		prefix,
		from
			? color(` ${from.toUpperCase()} `, AnsiColor.BgYellow, AnsiStyle.Bold)
			: '',
		color(' WARN ', AnsiColor.BgBrightYellow, AnsiStyle.Bold),
		time(),
		color(format(message), AnsiStyle.Dim)
	);
}

export function error(message: string, from: string) {
	console.log(
		prefix,
		from ? color(` ${from.toUpperCase()} `, AnsiColor.BgRed, AnsiStyle.Bold) : '',
		color(' ERROR ', AnsiColor.BgBrightRed, AnsiStyle.Bold),
		time(),
		color(format(message), AnsiColor.Red, AnsiStyle.Dim)
	);
}
