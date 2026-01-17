import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v4.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// Version 5 filenames to force cache bust
const PREFIX = 'icon-fill';

const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72, 64, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);
        const { width, height, data } = image.bitmap;

        // 1. MANUAL BOUNDING BOX SCAN
        // Find min/max x/y of non-transparent pixels
        let minX = width, minY = height, maxX = 0, maxY = 0;
        let found = false;

        image.scan(0, 0, width, height, (x, y, idx) => {
            const alpha = data[idx + 3];
            if (alpha > 0) { // Non-transparent pixel
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        });

        if (!found) {
            throw new Error("Image is completely transparent!");
        }

        // Add 1px buffer to max to capture the pixel itself
        const cropW = maxX - minX + 1;
        const cropH = maxY - minY + 1;

        console.log(`Found Bounds: x=${minX}, y=${minY}, w=${cropW}, h=${cropH}`);

        // 2. CROP
        image.crop({ x: minX, y: minY, w: cropW, h: cropH });
        console.log(`Cropped to content: ${image.bitmap.width}x${image.bitmap.height}`);

        // 3. GENERATE MASTER (1024x1024 with 96% Fill)
        const createFillIcon = async (size) => {
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            // Fill target: 96% of canvas
            const targetSize = Math.round(size * 0.96);

            // Calculate scale to fit LONGEST side into targetSize
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

        // Master File
        console.log('Generating icon-master-fill-1024.png...');
        const master = await createFillIcon(1024);
        await master.write(path.join(PUBLIC_DIR, 'icon-master-fill-1024.png'));

        // 4. GENERATE DERIVATIVES
        console.log('Generating derivatives...');
        for (const size of SIZES) {
            if (size === 1024) continue;

            const icon = await createFillIcon(size);
            const filename = `${PREFIX}-${size}.png`;
            await icon.write(path.join(ICONS_DIR, filename));
            console.log(`Saved ${filename}`);

            // Root Favicons/AppleTouch (overwriting standard names for index.html simplicity? 
            // Or using versioned names as user requested cache bust?
            // User said "Change icon filenames OR bump version".
            // I will use versioned filenames for PWA icons in icons/ dir.
            // For root files, I'll overwrite but likely rename logic in index.html.

            if (size === 180) {
                await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon-fill.png'));
            }
            if (size === 32) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-32x32-fill.png'));
                // Update favicon.ico too
                const buffer = await icon.getBuffer('image/png');
                fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
            }
            if (size === 16) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-16x16-fill.png'));
            }
        }

        // Social
        const social = await createFillIcon(512);
        await social.write(path.join(PUBLIC_DIR, 'social-icon-fill.png'));

        console.log('Done!');

    } catch (err) {
        console.log('Error:', err.message);
        console.log(err.stack);
    }
})();
