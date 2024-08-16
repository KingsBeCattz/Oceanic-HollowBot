import { createCanvas, loadImage } from '@napi-rs/canvas';

export class CanvaUtil {
	public async circle_cut(src: string) {
		const image = await loadImage(src);

		const canvas = createCanvas(image.width, image.height);
		const ctx = canvas.getContext('2d');

		ctx.clearRect(0, 0, image.width, image.height);

		ctx.beginPath();
		ctx.arc(image.width / 2, image.height / 2, image.width / 2, 0, Math.PI * 2);
		ctx.closePath();
		ctx.clip();

		ctx.drawImage(image, 0, 0, image.width, image.height);

		return canvas.toBuffer('image/png');
	}
}
