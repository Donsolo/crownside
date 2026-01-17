import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Helper to ensure dir exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

const SIZES = [
    512, 384, 192, 180, 167, 152, 144, 96, 72, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source image: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        console.log(`Original dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 1. Autocrop
        console.log('Autocropping with tolerance 0.05...');
        image.autocrop({ tolerance: 0.05 });
        console.log(`Cropped dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 2. FORCE SQUARE CROP (If Rectangular)
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        if (w !== h) {
            const minDim = Math.min(w, h);
            const startX = (w - minDim) / 2;
            const startY = (h - minDim) / 2;

            console.log(`Image is not square (${w}x${h}). Cropping to center square: ${minDim}x${minDim} at ${startX},${startY}`);

            // Ensure integers
            const cx = Math.round(startX);
            const cy = Math.round(startY);
            const cw = Math.round(minDim);
            const ch = Math.round(minDim);

            image.crop({ x: cx, y: cy, w: cw, h: ch });
            console.log(`New dimensions after square crop: ${image.bitmap.width}x${image.bitmap.height}`);
        }

        // Helper to scale image to square canvas
        const createCenteredIcon = async (size) => {
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            // Calculate scale to fit
            const currentW = image.bitmap.width;
            const currentH = image.bitmap.height;

            // Use 95% fill factor (nearly full bleed)
            const targetFill = 0.95;
            const targetSize = Math.round(size * targetFill);

            // Scale factor
            const scale = Math.min(targetSize / currentW, targetSize / currentH);

            const newW = Math.round(currentW * scale);
            const newH = Math.round(currentH * scale);

            // Resize cloned image
            const resized = image.clone().resize({ w: newW, h: newH });

            // Center on canvas
            const x = Math.round((size - newW) / 2);
            const y = Math.round((size - newH) / 2);

            canvas.composite(resized, x, y);
            return canvas;
        };

        // 3. Generate Icons
        console.log('Generating icons...');
        for (const size of SIZES) {
            const icon = await createCenteredIcon(size);
            const filename = `icon-${size}.png`;
            const outPath = path.join(ICONS_DIR, filename);
            await icon.write(outPath);
            console.log(`Saved ${filename}`);
        }

        // 4. Generate Root Favicons
        console.log('Generating root favicons...');

        const saveRootIcon = async (size, name) => {
            const icon = await createCenteredIcon(size);
            await icon.write(path.join(PUBLIC_DIR, name));
            console.log(`Saved ${name}`);
        };

        await saveRootIcon(32, 'favicon-32x32.png');
        await saveRootIcon(16, 'favicon-16x16.png');
        await saveRootIcon(180, 'apple-touch-icon.png');

        // Generate favicon.ico
        const icoCanvas = await createCenteredIcon(32);
        const buffer = await icoCanvas.getBuffer('image/png');
        fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
        console.log('Saved favicon.ico (PNG format)');

        // 5. Generate Social Images
        await saveRootIcon(512, 'social-icon.png');

        console.log('Done!');

    } catch (err) {
        console.log('Error generating icons (message):', err.message);
        console.log('Error stack:', err.stack);
    }
})();
