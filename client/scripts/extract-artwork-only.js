import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v5.png');
const DEST_IMAGE = path.join(PUBLIC_DIR, 'crownside-icon-artwork-only.png');

(async () => {
    try {
        console.log(`Reading source: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        const THRESHOLD_R = 120;
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        console.log(`Processing...`);

        // 1. Threshold & Erase Border Inline
        const BORDER = 20;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const r = image.bitmap.data[idx];
                const a = image.bitmap.data[idx + 3];

                // Border Erase condition
                if (x < BORDER || x >= w - BORDER || y < BORDER || y >= h - BORDER) {
                    image.bitmap.data[idx + 3] = 0;
                    continue;
                }

                // Threshold condition
                if (a > 0 && r < THRESHOLD_R) {
                    image.bitmap.data[idx + 3] = 0;
                }
            }
        }

        // 2. MANUAL BOUNDS SCAN
        let minX = w, minY = h, maxX = 0, maxY = 0;
        let found = false;

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const a = image.bitmap.data[idx + 3];
                if (a > 0) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                    found = true;
                }
            }
        }

        if (!found) {
            console.log("Entire image is transparent!");
        } else {
            console.log(`Manual Bounds Found: x=${minX}, y=${minY}, maxX=${maxX}, maxY=${maxY}`);
            const cropW = maxX - minX + 1;
            const cropH = maxY - minY + 1;
            console.log(`Crop Dimensions: ${cropW}x${cropH}`);

            image.crop({ x: minX, y: minY, w: cropW, h: cropH });
            console.log(`Cropped successfully.`);
        }

        await image.write(DEST_IMAGE);
        console.log(`Saved artwork to: ${DEST_IMAGE}`);

    } catch (err) {
        console.error('Error:', err);
    }
})();
