import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_IMAGE = path.join(__dirname, '../public/master-icon-v4.png');

(async () => {
    const image = await Jimp.read(SRC_IMAGE);
    const w = image.bitmap.width;
    const h = image.bitmap.height;
    const midY = Math.floor(h / 2);

    console.log(`Scanning row ${midY} (Width: ${w})`);

    // Sample every 50 pixels
    for (let x = 0; x < w; x += 50) {
        const idx = image.getPixelIndex(x, midY);
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const a = image.bitmap.data[idx + 3];
        console.log(`x=${x}: RGBA(${r},${g},${b},${a})`);
    }
})();
