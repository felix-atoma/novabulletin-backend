module.exports = {
  secret: process.env.JWT_SECRET || 'novabulletin-secret-key',
  expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  cookieExpiresIn: process.env.JWT_COOKIE_EXPIRES_IN || 90
};