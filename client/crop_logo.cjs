const { Jimp } = require('jimp');
const path = require('path');

const LOGO_PATH = path.join(__dirname, 'src/assets/logo.png');
const OUT_PATH = path.join(__dirname, 'src/assets/logo.png');

async function cropLogo() {
    try {
        console.log(`Reading logo from: ${LOGO_PATH}`);
        const image = await Jimp.read(LOGO_PATH);

        console.log(`Original dimensions: ${image.width}x${image.height}`);

        // Autocrop the image
        image.autocrop();

        console.log(`New dimensions: ${image.width}x${image.height}`);

        await image.write(OUT_PATH);
        console.log(`Cropped logo saved to: ${OUT_PATH}`);

    } catch (error) {
        console.error('Error processing image:', error);
        process.exit(1);
    }
}

cropLogo();
