import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v4.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// Version 6 filenames (Raw Fill)
const PREFIX = 'icon-raw';

const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72, 64, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        // GLOBAL THRESHOLD REMOVAL
        // Based on scan, Background is Dark Brown (R~80-90)
        // Gold Logo is Bright (R~197)
        // We will remove any pixel with Red < 120.

        const THRESHOLD_R = 120;

        console.log(`Thresholding: Removing pixels with Red < ${THRESHOLD_R}...`);

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            const r = this.bitmap.data[idx];
            // const g = this.bitmap.data[idx+1];
            // const b = this.bitmap.data[idx+2];
            const a = this.bitmap.data[idx + 3];

            if (a > 0) {
                if (r < THRESHOLD_R) {
                    // Set alpha to 0
                    this.bitmap.data[idx + 3] = 0;
                }
            }
        });

        console.log('Background removed via threshold.');

        // 2. AUTOCROP (Now that dark bg is gone, find gold bounds)
        console.log('Autocropping gold content...');
        image.autocrop({ tolerance: 0.0002 });
        console.log(`Gold Content Bounds: ${image.bitmap.width}x${image.bitmap.height}`);

        // 3. GENERATE MASTER (1024x1024 with 97% Fill)
        const createRawFillIcon = async (size) => {
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            // Target: 97% fill
            const targetFill = 0.97;
            const targetSize = Math.round(size * targetFill);

            // Calculate scale
            const currentW = image.bitmap.width;
            const currentH = image.bitmap.height;
            const scale = Math.min(targetSize / currentW, targetSize / currentH);

            const newW = Math.round(currentW * scale);
            const newH = Math.round(currentH * scale);

            const resized = image.clone().resize({ w: newW, h: newH });

            // Center
            const x = Math.round((size - newW) / 2);
            const y = Math.round((size - newH) / 2);

            canvas.composite(resized, x, y);
            return canvas;
        };

        // Master
        console.log('Generating icon-master-raw-fill-1024.png...');
        // Note: Some gold pixels might be dark (shadows). 
        // If we lose them, the logo might look jagged.
        // But the user DEMANDS removal of the background.
        // This is a trade-off. We hope the "Gold" is mostly metallic/bright.

        const master = await createRawFillIcon(1024);
        await master.write(path.join(PUBLIC_DIR, 'icon-master-raw-fill-1024.png'));

        // 4. DERIVATIVES
        console.log('Generating derivatives...');
        for (const size of SIZES) {
            if (size === 1024) continue;

            const icon = await createRawFillIcon(size);
            const filename = `${PREFIX}-${size}.png`;
            await icon.write(path.join(ICONS_DIR, filename));
            console.log(`Saved ${filename}`);

            // Overwrite Root Assets
            if (size === 180) await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon-raw.png'));
            if (size === 32) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-32x32-raw.png'));
                const buffer = await icon.getBuffer('image/png');
                fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
            }
            if (size === 16) await icon.write(path.join(PUBLIC_DIR, 'favicon-16x16-raw.png'));
        }

        // Social
        const social = await createRawFillIcon(512);
        await social.write(path.join(PUBLIC_DIR, 'social-icon-raw.png'));

        console.log('Done!');

    } catch (err) {
        console.log('Error:', err.message);
        console.log(err.stack);
    }
})();
