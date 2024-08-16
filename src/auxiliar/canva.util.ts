import { type Image, createCanvas, loadImage } from '@napi-rs/canvas';
import gif from 'gif-frames';
import GIFEncoder from 'gifencoder';

export class CanvaUtil {
	public async circle_cut(src: string) {
		const cutter = async (image: Image) => {
			const canvas = createCanvas(image.width, image.height);
			const ctx = canvas.getContext('2d');

			ctx.clearRect(0, 0, image.width, image.height);

			ctx.beginPath();
			ctx.arc(image.width / 2, image.height / 2, image.width / 2, 0, Math.PI * 2);
			ctx.closePath();
			ctx.clip();

			ctx.drawImage(image, 0, 0, image.width, image.height);

			return ctx;
		};

		const img = await loadImage(src);

		if (src.endsWith('.gif')) {
			const frames = await gif({
				url: img.src,
				frames: 'all',
				outputType: 'canvas'
			});
			const encoder = new GIFEncoder(img.width, img.height);
			encoder.start();
			encoder.setRepeat(0);
			encoder.setDelay(500);

			for (const frame of frames) {
				encoder.addFrame(
					(await cutter(frame.getImage())) as unknown as CanvasRenderingContext2D
				);
			}

			encoder.finish();
			return encoder.out.getData();
		}

		return (await cutter(img)).canvas.toBuffer('image/png');
	}
}
