import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import { config } from 'dotenv';
import { redisService } from './services/redis.service.js';
import { authRoutes } from './routes/auth.routes.js';
import { userRoutes } from './routes/user.routes.js';
import { projectRoutes } from './routes/project.routes.js';
import { promptRoutes } from './routes/prompt.routes.js';
import { contextRoutes } from './routes/context.routes.js';
import { templateRoutes } from './routes/template.routes.js';
import { apiKeyRoutes } from './routes/apiKey.routes.js';
import { aiRoutes } from './routes/ai.routes.js';

config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Security
await server.register(helmet, {
  contentSecurityPolicy: false, // Disable for development
});

// CORS
await server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

// Cookie support
await server.register(cookie);

// JWT
await server.register(jwt, {
  secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this',
  cookie: {
    cookieName: 'token',
    signed: false,
  },
});

// Routes
server.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    redis: redisService.isReady() ? 'connected' : 'disconnected',
  };
});

server.get('/', async () => {
  return {
    message: 'Promptozaurus API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      api: '/api',
    },
  };
});

// Register routes
await server.register(authRoutes);
await server.register(userRoutes);
await server.register(projectRoutes);
await server.register(promptRoutes);
await server.register(contextRoutes);
await server.register(templateRoutes);
await server.register(apiKeyRoutes);
await server.register(aiRoutes);

// Start server
const start = async () => {
  try {
    // Connect to Redis
    await redisService.connect();

    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`✅ Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await redisService.disconnect();
  await server.close();
  process.exit(0);
});

start();

