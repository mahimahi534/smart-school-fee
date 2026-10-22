import dotenv from 'dotenv';
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback_dev_secret_key_at_least_32_chars_long_2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'fallback_refresh_secret_key_2026',
    refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  adminSetupSecret: process.env.ADMIN_SETUP_SECRET || 'SmartSchoolAdminSetup2026!',
  isProduction: process.env.NODE_ENV === 'production',
};
