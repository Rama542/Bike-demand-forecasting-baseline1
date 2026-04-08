const jwt = require('jsonwebtoken');

// Middleware to verify Supabase JWT token
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    // If we're mocking/testing locally without proper Supabase Setup, we can bypass
    if (!jwtSecret || jwtSecret === 'mock-jwt-secret') {
        req.user = { id: 'mock-user-id', role: 'authenticated' };
        return next();
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded; // Contains sub (user_id), role, email, etc.
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = { requireAuth };
