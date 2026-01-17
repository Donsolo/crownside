import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v4.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

// Ensure dir exists
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Full set of sizes for PWA and Apple Touch
const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72, 64, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source image: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        console.log(`Original dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 1. STRICT AUTOCROP
        // Remove ALL transparency. Tolerance 0.0002.
        console.log('Autocropping (Strict)...');
        image.autocrop({ tolerance: 0.0002 });
        console.log(`Cropped dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // 2. SQUARE CROP (Center)
        // If rectangular, crop to the central square of the SHORTEST dimension?
        // Wait, if it's wide (logo + text), cropping to shortest (height) might cut text.
        // User said: "Crop/scale... Keep aspect ratio, no distortion".
        // And "The icon is small because... PNG has large transparent padding".
        // If I crop to 1:1, I lose content if it's not 1:1.
        // BUT user said "Create a new master file... Scale UP so visible artwork occupies 92-96%".
        // This implies fitting the logo INTO a square canvas.
        // IF the logo is wide 2:1, fitting it 100% width leaves 50% height empty (letterbox). This is small.
        // IF the logo is wide, maybe user wants us to crop TO the symbol?
        // User said: "Center Square Crop... discarding side whitespace".
        // So yes, we crop to the center square.

        const w = image.bitmap.width;
        const h = image.bitmap.height;

        if (w !== h) {
            const minDim = Math.min(w, h);
            const startX = (w - minDim) / 2;
            const startY = (h - minDim) / 2;

            console.log(`Non-square (${w}x${h}). Cropping to center square: ${minDim}x${minDim} at ${startX},${startY}`);
            image.crop({ x: Math.round(startX), y: Math.round(startY), w: Math.round(minDim), h: Math.round(minDim) });
            console.log(`New dimensions: ${image.bitmap.width}x${image.bitmap.height}`);
        }

        // Helper to Create Full Bleed Icon
        const createExtremeIcon = async (size) => {
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            // SCALE STRATEGY: 98% FILL
            // The user wants 92-96%. Let's go 96% to be safe but "full".
            // 2% padding on each side.
            const targetFill = 0.96;
            const targetSize = Math.round(size * targetFill);

            // Our image is now Square.
            // Scale it to targetSize.
            const resized = image.clone().resize({ w: targetSize, h: targetSize });

            // Center it (remaining 4% is split 2% top/left, 2% bottom/right)
            const offset = Math.round((size - targetSize) / 2);

            canvas.composite(resized, offset, offset);
            return canvas;
        };

        // 3. Generate Master 1024 (as requested "icon-master-1024.png")
        console.log('Generating icon-master-1024.png...');
        const master = await createExtremeIcon(1024);
        await master.write(path.join(PUBLIC_DIR, 'icon-master-1024.png'));
        console.log('Saved icon-master-1024.png');

        // 4. Generate all derivatives
        console.log('Generating derivatives...');
        for (const size of SIZES) {
            // Skip 1024 as we just made it
            if (size === 1024) continue;

            const icon = await createExtremeIcon(size);
            const filename = `icon-${size}.png`;
            await icon.write(path.join(ICONS_DIR, filename));
            console.log(`Saved ${filename}`);

            // Specific Apple Touch Icon
            if (size === 180) {
                await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
                console.log('Saved apple-touch-icon.png');
            }

            // Favicons
            if (size === 32) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
                console.log('Saved favicon-32x32.png');

                // Hack for .ico
                const buffer = await icon.getBuffer('image/png');
                fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
                console.log('Saved favicon.ico');
            }
            if (size === 16) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
                console.log('Saved favicon-16x16.png');
            }
        }

        console.log('Done!');

    } catch (err) {
        console.log('Error:', err.message);
        console.log(err.stack);
    }
})();
