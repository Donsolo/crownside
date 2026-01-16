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

const isS3Configured = process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_REGION &&
    process.env.AWS_S3_BUCKET_NAME;

if (!isS3Configured && process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: AWS S3 Credentials missing in production. Uploads will fallback to ephemeral disk storage and fail.');
    console.log('Missing vars:', {
        key: !!process.env.AWS_ACCESS_KEY_ID,
        secret: !!process.env.AWS_SECRET_ACCESS_KEY,
        region: !!process.env.AWS_REGION,
        bucket: !!process.env.AWS_S3_BUCKET_NAME
    });
}

let storage;

if (isS3Configured) {
    console.log('Using AWS S3 Storage for uploads');
    const s3 = new S3Client(s3Config);

    storage = multerS3({
        s3: s3,
        bucket: process.env.AWS_S3_BUCKET_NAME,
        // acl: 'public-read', // REMOVED: Bucket does not support ACLs
        contentType: multerS3.AUTO_CONTENT_TYPE,
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            // public/timestamp-random-filename.ext
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            const fileName = uniqueSuffix + path.extname(file.originalname);
            cb(null, `public/${fileName}`);
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
    // Accept images and videos
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|webp|WEBP|mp4|MP4|mov|MOV|avi|AVI|webm|WEBM)$/)) {
        req.fileValidationError = 'Only image and video files are allowed!';
        return cb(new Error('Only image and video files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB Max
    }
});

module.exports = upload;
