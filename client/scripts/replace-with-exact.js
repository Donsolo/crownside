import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, '../public');
const SRC_IMAGE = path.join(PUBLIC_DIR, 'master-icon-v6.jpg');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');

if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

// Version 8 filenames (Exact)
const PREFIX = 'icon-exact';

const SIZES = [
    1024, 512, 384, 192, 180, 167, 152, 144, 128, 96, 72, 64, 48, 32, 16
];

(async () => {
    try {
        console.log(`Reading source: ${SRC_IMAGE}`);
        const image = await Jimp.read(SRC_IMAGE);

        console.log(`Source Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        // Strategy: RESIZE EXACT (Fill)
        // We will resize the image to cover the target dimensions. 
        // If the source is not square, we'll crop to center (cover).

        const createIcon = (size) => {
            // resize not fit - we want to FILL the square. "cover" behavior.
            return image.clone().cover({ w: size, h: size });
        };

        for (const size of SIZES) {
            const filename = `${PREFIX}-${size}.png`;
            // Note: Saving as PNG even if source is JPG, to support alpha if we added it (we didn't) 
            // and standard web consistency.
            const icon = createIcon(size);
            await icon.write(path.join(ICONS_DIR, filename));
            console.log(`Saved ${filename}`);

            // Root Assets
            if (size === 180) await icon.write(path.join(PUBLIC_DIR, 'apple-touch-icon-exact.png'));

            if (size === 32) {
                await icon.write(path.join(PUBLIC_DIR, 'favicon-32x32-exact.png'));
                const buffer = await icon.getBuffer('image/png');
                fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon.ico'), buffer);
            }
            if (size === 16) await icon.write(path.join(PUBLIC_DIR, 'favicon-16x16-exact.png'));

            if (size === 1024) await icon.write(path.join(PUBLIC_DIR, 'crownside-icon-master-exact.png'));
        }

        // Social
        const social = createIcon(512);
        await social.write(path.join(PUBLIC_DIR, 'social-icon-exact.png'));

        console.log('Done!');

    } catch (err) {
        console.error('Error:', err);
    }
})();
