const jwt = require('jsonwebtoken');

// Middleware to check authentication using JWT token from Authorization header or cookie
const isAuthenticated = async (req, res, next) => {
    try {
        // Check if JWT_SECRET is configured
        if (!process.env.JWT_SECRET) {
            console.error('❌ JWT_SECRET is not configured in environment variables');
            return res.status(500).json({ 
                success: false, 
                message: 'Server configuration error. Please contact administrator.', 
                error: 'ConfigurationError' 
            });
        }

        let token = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated. Please provide a valid token.', 
                error: 'AuthError' 
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token has expired. Please login again.', 
                error: 'TokenExpired' 
            });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid token. Please login again.', 
                error: 'InvalidToken' 
            });
        }
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed', 
            error: 'AuthError' 
        });
    }
};

// role check helper (keeps existing export name isAdmin for compatibility)
const isAdmin = (role) => {
    return (req, res, next) => {
        if (req.user && req.user.role && req.user.role.toLowerCase() === role.toLowerCase()) {
            return next();
        }
        return res.status(403).json({ success: false, message: 'Access denied', error: 'Forbidden' });
    };
};

module.exports = { isAuthenticated, isAdmin };
