// Test helpers

import { FastifyInstance } from 'fastify';
import { build } from '../../index';

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await build({
    logger: false,
  });

  await app.ready();
  return app;
}

