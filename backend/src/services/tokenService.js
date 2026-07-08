const jwt = require('jsonwebtoken');
const crypto = require('crypto');

function generateTokens(user) {
  const payload = { userId: user.id, email: user.email, role: user.role?.name || user.roleName };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });

  return { token, refreshToken };
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  generateResetToken,
  generateVerificationToken,
};
