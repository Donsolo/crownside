import { Jimp } from 'jimp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_IMAGE = path.join(__dirname, '../src/assets/badge.png');

// Standard checkerboard colors often found in fake PNGs
// We'll treat these as "transparent" if they are connected to the edge
const BG_COLORS = [
    { r: 255, g: 255, b: 255 }, // White
    { r: 254, g: 254, b: 254 }, // White-ish
    { r: 238, g: 238, b: 238 }, // Light Gray (common checkerboard)
    { r: 204, g: 204, b: 204 }, // Darker Gray (common checkerboard)
    { r: 192, g: 192, b: 192 }, // Silver
    { r: 240, g: 240, b: 240 }, // Very light gray
];

// Tolerance for color matching
const TOLERANCE = 10;

function isBgColor(inputColor) {
    const r = (inputColor >> 24) & 0xFF;
    const g = (inputColor >> 16) & 0xFF;
    const b = (inputColor >> 8) & 0xFF;

    for (const c of BG_COLORS) {
        if (
            Math.abs(c.r - r) <= TOLERANCE &&
            Math.abs(c.g - g) <= TOLERANCE &&
            Math.abs(c.b - b) <= TOLERANCE
        ) {
            return true;
        }
    }
    return false;
}

(async () => {
    try {
        console.log(`Reading image: ${TARGET_IMAGE}`);
        const image = await Jimp.read(TARGET_IMAGE);

        const width = image.bitmap.width;
        const height = image.bitmap.height;

        console.log(`Original dimensions: ${width}x${height}`);

        // Flood Fill Algorithm to remove background starting from corners
        // We scan 0,0. If it's a BG color, we start flood fill setting to 0x00000000

        const stack = [];
        const visited = new Set();

        // Add corners to start if they are BG colors
        const corners = [
            { x: 0, y: 0 },
            { x: width - 1, y: 0 },
            { x: 0, y: height - 1 },
            { x: width - 1, y: height - 1 }
        ];

        for (const pt of corners) {
            const color = image.getPixelColor(pt.x, pt.y);
            if (isBgColor(color)) {
                stack.push(pt);
                visited.add(`${pt.x},${pt.y}`);
            }
        }

        console.log(`Starting flood fill background removal... Initial stack size: ${stack.length}`);

        let pixelsRemoved = 0;

        while (stack.length > 0) {
            const { x, y } = stack.pop();

            // Make transparent
            image.setPixelColor(0x00000000, x, y);
            pixelsRemoved++;

            // Check neighbors
            const neighbors = [
                { x: x + 1, y: y },
                { x: x - 1, y: y },
                { x: x, y: y + 1 },
                { x: x, y: y - 1 }
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                    const key = `${n.x},${n.y}`;
                    if (!visited.has(key)) {
                        const nColor = image.getPixelColor(n.x, n.y);
                        // If neighbor is also a background color, continue fill
                        if (isBgColor(nColor)) {
                            visited.add(key);
                            stack.push(n);
                        }
                    }
                }
            }
        }

        console.log(`Background removal complete. Cleared ${pixelsRemoved} pixels.`);

        // Now Autocrop to remove the transparent area padding
        console.log('Autocropping...');
        image.autocrop({ tolerance: 0.1 }); // Use small tolerance

        console.log(`New dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        await image.write(TARGET_IMAGE);
        console.log('Saved optimized image.');

    } catch (err) {
        console.error('Error optimizing badge:', err);
    }
})();
