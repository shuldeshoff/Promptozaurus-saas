import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { config } from 'dotenv';

config();

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

// Security
await server.register(helmet);

// CORS
await server.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
});

// Routes
server.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

server.get('/', async () => {
  return {
    message: 'Promptozaurus API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
    },
  };
});

// Start server
const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await server.listen({ port, host: '0.0.0.0' });
    console.log(`✅ Server listening on http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

