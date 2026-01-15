const getFileUrl = (req, file) => {
    // AWS S3 uses 'location', Cloudinary/others might use 'path' as URL
    if (file.location) return file.location;
    if (file.path && file.path.startsWith('http')) return file.path;

    // Fallback for disk storage (Local Development)
    // Use APP_URL if set, otherwise fallback request origin
    let baseUrl = process.env.APP_URL || process.env.API_URL;

    if (!baseUrl) {
        baseUrl = `${req.protocol}://${req.get('host')}`;
    }

    // Ensure no trailing slash
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    return `${baseUrl}/uploads/${file.filename}`;
};

module.exports = { getFileUrl };
