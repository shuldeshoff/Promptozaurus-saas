import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import { projectRoutes } from '../routes/project.routes';
import { prisma } from '../lib/prisma';

// Integration tests will run with proper test database
const shouldSkip = false;
const describeOrSkip = shouldSkip ? describe.skip : describe;

describeOrSkip('Project Routes Integration Tests', () => {
  const app = Fastify();
  let testUser: any;
  let authToken: string;

  // Setup test user and authentication
  beforeAll(async () => {
    // Register JWT plugin
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'test-jwt-secret',
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        googleId: 'test-google-id-123',
      },
    });

    // Generate auth token
    authToken = app.jwt.sign({ userId: testUser.id });

    // Register routes
    await app.register(projectRoutes);
    await app.ready();
  });

  afterAll(async () => {
    // Cleanup: delete all test data
    await prisma.project.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
    await app.close();
  });

  beforeEach(async () => {
    // Clean projects before each test
    await prisma.project.deleteMany({ where: { userId: testUser.id } });
  });

  describe('GET /api/projects', () => {
    it('should return 200 and list of projects', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body).toHaveProperty('data');
      expect(Array.isArray(body.data)).toBe(true);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Test Project',
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);
      expect(body.data).toHaveProperty('name', 'Test Project');
      expect(body.data).toHaveProperty('id');
    });

    it('should enforce 10 project limit', async () => {
      // Create 10 projects directly in DB
      for (let i = 0; i < 10; i++) {
        await prisma.project.create({
          data: {
            name: `Project ${i}`,
            userId: testUser.id,
            data: { contextBlocks: [], promptBlocks: [] },
          },
        });
      }

      // Try to create 11th project
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Project 11' },
      });

      expect(response.statusCode).toBe(403);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error', 'Project limit reached');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a project by id', async () => {
      // First create a project
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Get Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Then get it
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('id', project.id);
      expect(body.data).toHaveProperty('name', 'Get Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects/nonexistent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update a project', async () => {
      // Create a project
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Update Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Update it
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Updated Project Name' },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('name', 'Updated Project Name');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/projects/nonexistent-id',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Test' },
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project', async () => {
      // Create a project
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Delete Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Delete it
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);

      // Verify it's deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(getResponse.statusCode).toBe(404);
    });
  });

  describe('POST /api/projects/:id/duplicate', () => {
    it('should duplicate a project', async () => {
      // Create a project
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Duplicate Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Duplicate it
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${project.id}/duplicate`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.name).toContain('(Copy)');
      expect(body.data.id).not.toBe(project.id);
    });
  });

  describe('POST /api/projects/import', () => {
    it('should import a project', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects/import',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: {
          name: 'Imported Project',
          data: {
            contextBlocks: [],
            promptBlocks: [],
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('name', 'Imported Project');
    });
  });

  describe('GET /api/projects/:id/export', () => {
    it('should export a project', async () => {
      // Create a project
      const createResponse = await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: 'Export Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Export it
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}/export`,
        headers: {
          authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('name', 'Export Test Project');
      expect(body.data).toHaveProperty('exportedAt');
      expect(body.data).toHaveProperty('version', '1.0');
    });
  });
});
