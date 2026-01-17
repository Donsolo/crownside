import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v3.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Helper to ensure dir exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// iOS App Store requires 1024x1024. Standard PWA uses 512, 192.
const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 96, 72, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source image: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        console.log(`Original dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 1. STRICT AUTOCROP (Remove ALL transparent border pixels)
        // Use very low tolerance to catch any subtle alpha noise
        console.log('Autocropping with tolerance 0.0002...');
        image.autocrop({ tolerance: 0.0002 });
        console.log(`Cropped dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 2. FORCE SQUARE CROP (If Rectangular)
        // Center crop to square.
        const w = image.bitmap.width;
        const h = image.bitmap.height;

        if (w !== h) {
            const minDim = Math.min(w, h);
            const startX = (w - minDim) / 2;
            const startY = (h - minDim) / 2;

            console.log(`Image is not square (${w}x${h}). Cropping to center square: ${minDim}x${minDim} at ${startX},${startY}`);

            // Ensure crop uses object syntax for new Jimp
            image.crop({ x: Math.round(startX), y: Math.round(startY), w: Math.round(minDim), h: Math.round(minDim) });
            console.log(`New dimensions after square crop: ${image.bitmap.width}x${image.bitmap.height}`);
        }

        // Helper to scale image to square canvas
        const createFullBleedIcon = async (size) => {
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            // FULL BLEED STRATEGY:
            // We scale the image to fit the size exactly (since it's already square).
            // We DO NOT add any margin.
            // Target size is 100% of the canvas.

            // Resize image to exact size
            const resized = image.clone().resize({ w: size, h: size });

            // Composite at 0,0
            canvas.composite(resized, 0, 0);
            return canvas;
        };

        // 3. Generate Icons
        console.log('Generating icons...');
        for (const size of SIZES) {
            const icon = await createFullBleedIcon(size);

            // Special naming for 1024 (iOS App Store)
            if (size === 1024) {
                await icon.write(path.join(PUBLIC_DIR, 'icon-1024.png'));
                console.log('Saved icon-1024.png (App Store)');
                continue;
            }

            const filename = `icon-${size}.png`;
            const outPath = path.join(ICONS_DIR, filename);
            await icon.write(outPath);
            console.log(`Saved ${filename}`);
        }

        // 4. Generate Root Favicons
        console.log('Generating root favicons...');

        const saveRootIcon = async (size, name) => {
            const icon = await createFullBleedIcon(size);
            await icon.write(path.join(PUBLIC_DIR, name));
            console.log(`Saved ${name}`);
        };

        await saveRootIcon(32, 'favicon-32x32.png');
        await saveRootIcon(16, 'favicon-16x16.png');
        await saveRootIcon(180, 'apple-touch-icon.png');

        // Generate favicon.ico (fake ico using png buffer)
        // For favicon.ico, we use the FULL BLEED 32x32 version.
        const icoCanvas = await createFullBleedIcon(32);
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
