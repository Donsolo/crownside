const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log("AuthorizeRole: No User");
            return res.sendStatus(403);
        }
        if (!roles.includes(req.user.role)) {
            console.log(`AuthorizeRole: User Role ${req.user.role} NOT in required: ${roles}`);
            return res.sendStatus(403);
        }
        next();
    };
};

const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (!err) req.user = user;
        next();
    });
};

module.exports = { authenticateToken, authorizeRole, optionalAuth };
