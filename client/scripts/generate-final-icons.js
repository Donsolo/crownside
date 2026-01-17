import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
// Source is the clean extracted artwork (no bg)
const SRC_IMAGE = path.join(PUBLIC_DIR, 'crownside-icon-artwork-only.png');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// Version 7 filenames (Final)
const PREFIX = 'icon-final';

const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72, 64, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source artwork: ${SRC_IMAGE}`);
        const artwork = await Jimp.read(SRC_IMAGE);

        // 1. CREATE MASTER FILL (1024x1024, 97% Fill)
        // User Requirement: "Scale UP until it fills ~95–97% of the canvas... Artwork should almost touch edges"
        const createMaster = async () => {
            const size = 1024;
            const canvas = new Jimp({ width: size, height: size, color: 0x00000000 });

            const targetFill = 0.97;
            const targetSize = Math.round(size * targetFill);

            // Scale artwork to fit targetSize
            const currentW = artwork.bitmap.width;
            const currentH = artwork.bitmap.height;
            const scale = Math.min(targetSize / currentW, targetSize / currentH);

            const newW = Math.round(currentW * scale);
            const newH = Math.round(currentH * scale);

            const resized = artwork.clone().resize({ w: newW, h: newH });

            // Center
            const x = Math.round((size - newW) / 2);
            const y = Math.round((size - newH) / 2);

            canvas.composite(resized, x, y);
            return canvas;
        };

        console.log('Generating crownside-icon-master-fill-1024.png...');
        const master = await createMaster();
        await master.write(path.join(PUBLIC_DIR, 'crownside-icon-master-fill-1024.png'));

        // 2. GENERATE DERIVATIVES FROM MASTER
        console.log('Generating derivatives...');

        // Helper to resize master
        // We clone master (1024) and resize down.
        const createIcon = (size) => {
            return master.clone().resize({ w: size, h: size });
        };

        for (const size of SIZES) {
            if (size === 1024) continue; // Already saved master

            const icon = createIcon(size);
            const filename = `${PREFIX}-${size}.png`;
            await icon.write(path.join(ICONS_DIR, filename));
            console.log(`Saved ${filename}`);

            // Root Assets
            if (size === 180) await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon.png')); // Overwrite standard name? User said "Update references". I'll stick to standard or new? User said "favicon.ico... apple-touch-icon.png".
            // Actually, for cache busting, it's better to update HTML.
            // But ios looks for apple-touch-icon.png by default often.
            // I'll save as `apple-touch-icon-final.png` and update HTML.
            if (size === 180) await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon-final.png'));

            if (size === 32) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-32x32-final.png'));
                const buffer = await icon.getBuffer('image/png');
                fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
            }
            if (size === 16) await icon.write(path.join(PUBLIC_DIR, 'favicon-16x16-final.png'));
        }

        // Social
        const social = createIcon(512); // Social usually 512 or 1024
        await social.write(path.join(PUBLIC_DIR, 'social-icon-final.png'));

        console.log('Done!');

    } catch (err) {
        console.error('Error:', err);
    }
})();
