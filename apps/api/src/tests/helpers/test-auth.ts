// Auth test helpers

import { FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from '../../services/prisma.service';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export async function createTestUser(app: FastifyInstance) {
  const email = `test-${Date.now()}@example.com`;
  
  const user = await prisma.user.create({
    data: {
      email,
      password: 'hashed-password-not-used-in-tests',
      name: 'Test User',
    },
  });

  return user;
}

export async function getAuthToken(userId: string): Promise<string> {
  const token = jwt.sign(
    { userId, email: 'test@example.com' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return token;
}

export async function deleteTestUser(userId: string) {
  await prisma.user.delete({
    where: { id: userId },
  });
}

