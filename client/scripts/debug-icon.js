import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_IMAGE = path.join(__dirname, '../public/master-icon.png');

(async () => {
    const image = await Jimp.read(SRC_IMAGE);
    const w = image.bitmap.width;
    const h = image.bitmap.height;

    console.log(`Dimensions: ${w}x${h}`);

    // Check corners
    const corners = [
        { x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: 0, y: h - 1 }, { x: w - 1, y: h - 1 }
    ];

    corners.forEach((p, i) => {
        const idx = image.getPixelIndex(p.x, p.y);
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        const a = image.bitmap.data[idx + 3];
        console.log(`Corner ${i} (${p.x},${p.y}): RGBA(${r},${g},${b},${a})`);
    });
})();
