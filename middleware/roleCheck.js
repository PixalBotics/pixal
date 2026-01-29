// roleCheck middleware: ensures user has one of allowed roles
module.exports = function allowRoles(...allowed) {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authenticated',
        error: 'AuthError' 
      });
    }
    
    if (!user.role) {
      return res.status(403).json({ 
        success: false, 
        message: 'User role not found',
        error: 'Forbidden' 
      });
    }

    // Normalize and check role
    const userRole = user.role.toLowerCase();
    const allowedRoles = allowed.map(r => r.toLowerCase());
    
    if (allowedRoles.includes(userRole)) {
      return next();
    }
    
    return res.status(403).json({ 
      success: false, 
      message: `Access denied. Required roles: ${allowed.join(' or ')}. Your role: ${user.role}`,
      error: 'Forbidden' 
    });
  };
};
