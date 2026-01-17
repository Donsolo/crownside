import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'apple-touch-icon.png');
const OUT_DIR = path.join(PUBLIC_DIR, 'icons');

const SIZES = [
    512, 384, 192, 180, 167, 152, 144, 96, 72, 48, 32, 16
];

// CrownSide Metro Detroit Palette
const BG_COLOR = 0x1a1a1aff; // #1a1a1a (Dark) + Alpha FF

(async () => {
    try {
        console.log(`Reading source image: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        // 1. Auto-crop to remove transparent edges (if any)
        console.log('Auto-cropping...');
        image.autocrop();

        // 2. Create Master 512x512 Canvas
        // User wants: Icon fills ~85-90% of canvas.
        // Canvas Size: 512
        // Target Logo Size: 512 * 0.85 = 435 (approx 436)
        const CANVAS_SIZE = 512;
        const LOGO_SIZE = Math.round(CANVAS_SIZE * 0.85);
        const OFFSET = (CANVAS_SIZE - LOGO_SIZE) / 2;

        console.log(`Creating master canvas (${CANVAS_SIZE}x${CANVAS_SIZE}) with logo size (${LOGO_SIZE}x${LOGO_SIZE})...`);

        // Create solid background canvas
        // Jimp constructor usage: new Jimp({ width, height, color })
        // Verify Jimp import structure (v1 vs v0)
        // If 'Jimp' is named export: new Jimp(...)
        const canvas = new Jimp({
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            color: BG_COLOR
        });

        // Resize cropped logo to fit
        image.contain({ w: LOGO_SIZE, h: LOGO_SIZE });

        // Composite logo onto center of canvas
        canvas.composite(image, OFFSET, OFFSET);

        // 3. Generate Icons
        console.log('Generating icons...');
        for (const size of SIZES) {
            const icon = canvas.clone();
            if (size !== CANVAS_SIZE) {
                icon.resize({ w: size, h: size });
            }

            const filename = `icon-${size}.png`;
            const outPath = path.join(OUT_DIR, filename);
            await icon.write(outPath);
            console.log(`Saved ${filename}`);
        }

        // Generate Favicons specifically named
        const fav32 = canvas.clone().resize({ w: 32, h: 32 });
        await fav32.write(path.join(PUBLIC_DIR, 'favicon-32x32.png'));
        console.log('Saved favicon-32x32.png');

        const fav16 = canvas.clone().resize({ w: 16, h: 16 });
        await fav16.write(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
        console.log('Saved favicon-16x16.png');

        console.log('Done!');

    } catch (err) {
        console.error('Error generating icons:', err);
    }
})();
