/**
 * Environment configuration with defaults for the Product Purchase System
 */
function loadEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

function loadEnvNumber(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

function loadEnvFloat(key: string, defaultValue: number): number {
  const val = process.env[key];
  if (val === undefined || val === '') return defaultValue;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? defaultValue : parsed;
}

export const env = {
  get PORT(): number {
    return loadEnvNumber('PORT', 3001);
  },
  get DATABASE_URL(): string {
    return loadEnv('DATABASE_URL', 'file:./dev.db');
  },
  get LICENSING_API_URL(): string {
    return loadEnv('LICENSING_API_URL', 'http://localhost:8000/api/v1');
  },
  get LICENSING_API_KEY(): string {
    return loadEnv('LICENSING_API_KEY', '');
  },
  get JWT_SECRET(): string {
    return loadEnv('JWT_SECRET', 'change-me');
  },
  get STRIPE_SECRET_KEY(): string {
    return loadEnv('STRIPE_SECRET_KEY', '');
  },
  get PAYPAL_CLIENT_ID(): string {
    return loadEnv('PAYPAL_CLIENT_ID', '');
  },
  get SMTP_HOST(): string {
    return loadEnv('SMTP_HOST', '');
  },
  get SMTP_PORT(): number {
    return loadEnvNumber('SMTP_PORT', 587);
  },
  get SMTP_USER(): string {
    return loadEnv('SMTP_USER', '');
  },
  get SMTP_PASS(): string {
    return loadEnv('SMTP_PASS', '');
  },
  get SMTP_FROM(): string {
    return loadEnv('SMTP_FROM', 'noreply@wovenmodel.com');
  },
  get SMTP_REPLY_TO(): string {
    return loadEnv('SMTP_REPLY_TO', 'sales@wovenmodel.com');
  },
  get FRONTEND_URL(): string {
    return loadEnv('FRONTEND_URL', 'http://localhost:5173');
  },
  get CORS_ORIGINS(): string {
    return loadEnv('CORS_ORIGINS', 'http://localhost:5173');
  },
  get TAX_RATE(): number {
    return loadEnvFloat('TAX_RATE', 0.0);
  },
  get ADMIN_EMAIL(): string {
    return loadEnv('ADMIN_EMAIL', 'admin@wovenmodel.com');
  },
  get ADMIN_PASSWORD(): string {
    return loadEnv('ADMIN_PASSWORD', '');
  },
};

export default env;
