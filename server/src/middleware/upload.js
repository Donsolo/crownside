const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const { S3Client } = require('@aws-sdk/client-s3');
const multerS3 = require('multer-s3');

// Configure AWS S3
const s3Config = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};

const isS3Configured = s3Config.credentials.accessKeyId &&
    s3Config.credentials.secretAccessKey &&
    s3Config.region &&
    process.env.AWS_S3_BUCKET_NAME;

let storage;

if (isS3Configured) {
    console.log('Using AWS S3 Storage for uploads');
    const s3 = new S3Client(s3Config);

    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        acl: 'public-read', // Ensure files are publicly accessible
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // folder/timestamp-random-filename.ext
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = uniqueSuffix + path.extname(file.originalname);
            cb(null, `crownside-uploads/${fileName}`);
        }
    });
} else {
    console.warn('WARNING: AWS S3 credentials missing. Falling back to local disk storage (not persistent in prod container).');
    storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            // timestamp-random-filename.ext
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + path.extname(file.originalname));
        }
    });
}

// File Filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 8 * 1024 * 1024, // 8MB Max
    }
});

module.exports = upload;
