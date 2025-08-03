import jwt from 'jsonwebtoken';

// In-memory token blacklist (in production, use Redis or database)
const tokenBlacklist = new Set();

// Generate JWT tokens
export const generateTokens = (userId) => {
  const payload = { 
    userId,
    type: 'access',
    iat: Math.floor(Date.now() / 1000)
  };

  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '24h',
      issuer: 'taskboard-api',
      audience: 'taskboard-client'
    }
  );

  const refreshToken = jwt.sign(
    { 
      userId, 
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '7d',
      issuer: 'taskboard-api',
      audience: 'taskboard-client'
    }
  );

  return { accessToken, refreshToken };
};

// Verify JWT token with enhanced security
export const verifyToken = (token, type = 'access') => {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'taskboard-api',
      audience: 'taskboard-client'
    });

    // Verify token type
    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    throw error;
  }
};

// Blacklist a token (for logout)
export const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // Auto-cleanup expired tokens every hour
  setTimeout(() => {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        tokenBlacklist.delete(token);
      }
    }
  }, 60 * 60 * 1000); // 1 hour
};

// Get token blacklist size (for monitoring)
export const getBlacklistSize = () => tokenBlacklist.size;
