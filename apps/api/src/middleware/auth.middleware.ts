import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtPayload } from '../services/jwt.service.js';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: JwtPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or missing token' });
  }
}

export async function optionalAuth(request: FastifyRequest, _reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch (err) {
    // Optional auth - continue even if token is invalid
    // request.user will be undefined
  }
}

