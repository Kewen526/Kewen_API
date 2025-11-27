import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  databaseUrl: string;
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  security: {
    bcryptRounds: number;
    apiKeyLength: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: string;
    dir: string;
  };
  upload: {
    maxFileSize: number;
    uploadDir: string;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
  webhook: {
    timeout: number;
    retryTimes: number;
  };
  metrics: {
    enabled: boolean;
    interval: number;
  };
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: process.env.DATABASE_URL || '',
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10'),
    apiKeyLength: parseInt(process.env.API_KEY_LENGTH || '32'),
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: process.env.LOG_DIR || 'logs',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '3600'),
    enabled: process.env.CACHE_ENABLED === 'true',
  },
  webhook: {
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '10000'),
    retryTimes: parseInt(process.env.WEBHOOK_RETRY_TIMES || '3'),
  },
  metrics: {
    enabled: process.env.ENABLE_METRICS === 'true',
    interval: parseInt(process.env.METRICS_INTERVAL || '60000'),
  },
};

export default config;
