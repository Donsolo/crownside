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
    { r: 0, g: 0, b: 0 } // Black (sometimes black is used as transparent background in bad conversions)
];

// Tolerance for color matching
const TOLERANCE = 30;

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

        // --- HALO REMOVAL PASS ---
        // Scan for pixels that are "light" (near white) and bordering transparent pixels
        // This removes the anti-aliased fringe from the checkerboard
        console.log('Starting halo removal pass...');
        const HALO_TOLERANCE = 100; // Gold has Blue ~89, so 100 is safe. White/Gray is > 100.

        // We will scan the whole image. If a pixel is NOT transparent but is "light", check neighbors.
        // If a geometric neighbor is transparent, kill this pixel.
        // Doing this iteratively can erode the white edge.

        let haloPixelsRemoved = 0;
        const currentBitmap = image.bitmap.data; // raw buffer

        // Helper to check transparency
        const isTransparent = (idx) => currentBitmap[idx + 3] === 0;

        // Iterate X times to erode the edge
        for (let i = 0; i < 2; i++) {
            const pixelsToClear = [];

            image.scan(0, 0, width, height, (x, y, idx) => {
                const r = currentBitmap[idx];
                const g = currentBitmap[idx + 1];
                const b = currentBitmap[idx + 2];
                const a = currentBitmap[idx + 3];

                if (a !== 0) {
                    // It's visible. Is it "light"?
                    // Simple brightness check or just check if it's kinda gray/white
                    if (r > HALO_TOLERANCE && g > HALO_TOLERANCE && b > HALO_TOLERANCE) {
                        // It's light. Is it next to transparent?
                        let borderingTransparent = false;
                        const neighbors = [
                            { x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 }
                        ];

                        for (const n of neighbors) {
                            if (n.x >= 0 && n.x < width && n.y >= 0 && n.y < height) {
                                const nIdx = image.getPixelIndex(n.x, n.y);
                                if (image.bitmap.data[nIdx + 3] === 0) {
                                    borderingTransparent = true;
                                    break;
                                }
                            }
                        }

                        if (borderingTransparent) {
                            pixelsToClear.push({ x, y });
                        }
                    }
                }
            });

            for (const p of pixelsToClear) {
                image.setPixelColor(0x00000000, p.x, p.y);
                haloPixelsRemoved++;
            }
        }

        console.log(`Halo removal complete. Cleared ${haloPixelsRemoved} fringe pixels.`);


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
