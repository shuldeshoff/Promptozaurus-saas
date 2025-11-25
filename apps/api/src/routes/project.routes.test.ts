import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { projectRoutes } from '../routes/project.routes';
import { authenticate } from '../middleware/auth.middleware';

describe('Project Routes Integration Tests', () => {
  const app = Fastify();
  const mockUserId = 'test-user-123';

  // Mock authentication middleware
  beforeAll(async () => {
    // Replace authenticate middleware with mock
    app.decorateRequest('user', null);
    app.addHook('preHandler', async (request) => {
      request.user = { userId: mockUserId };
    });

    await app.register(projectRoutes);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/projects', () => {
    it('should return 200 and list of projects', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/projects',
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
      // Create 10 projects
      for (let i = 0; i < 10; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/projects',
          payload: { name: `Project ${i}` },
        });
      }

      // Try to create 11th project
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
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
        payload: { name: 'Get Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Then get it
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
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
        payload: { name: 'Update Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Update it
      const response = await app.inject({
        method: 'PATCH',
        url: `/api/projects/${project.id}`,
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
        payload: { name: 'Delete Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Delete it
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/projects/${project.id}`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('success', true);

      // Verify it's deleted
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}`,
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
        payload: { name: 'Duplicate Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Duplicate it
      const response = await app.inject({
        method: 'POST',
        url: `/api/projects/${project.id}/duplicate`,
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
        payload: { name: 'Export Test Project' },
      });

      const { data: project } = JSON.parse(createResponse.body);

      // Export it
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${project.id}/export`,
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveProperty('name', 'Export Test Project');
      expect(body.data).toHaveProperty('exportedAt');
      expect(body.data).toHaveProperty('version', '1.0');
    });
  });
});

