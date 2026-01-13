require('dotenv').config();
const url = process.env.DATABASE_URL;
if (!url) {
    console.log("DATABASE_URL is undefined or empty");
} else {
    console.log("DATABASE_URL length:", url.length);
    if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
        console.log("ERROR: DATABASE_URL does not start with postgresql:// or postgres://");
    }
}
if (!process.env.JWT_SECRET) {
    console.log("ERROR: JWT_SECRET is missing!");
} else {
    console.log("JWT_SECRET is present.");
}
