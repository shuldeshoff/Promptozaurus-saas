import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { createTestApp, createTestUser } from './helpers/test-app';

describe('Project Routes', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const auth = await createTestUser(app);
    authToken = auth.token;
    userId = auth.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/projects', () => {
    it('должен создать новый проект', async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Project' })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Project');
      expect(response.body.userId).toBe(userId);
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .post('/api/projects')
        .send({ name: 'Test Project' })
        .expect(401);
    });

    it('должен вернуть 400 при пустом названии', async () => {
      await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Создаем тестовые проекты
      await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project 1' });
      
      await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project 2' });
    });

    it('должен вернуть все проекты пользователя', async () => {
      const response = await request(app.server)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .get('/api/projects')
        .expect(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Project' });
      
      projectId = response.body.id;
    });

    it('должен вернуть конкретный проект', async () => {
      const response = await request(app.server)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(projectId);
      expect(response.body.name).toBe('Test Project');
    });

    it('должен вернуть 404 для несуществующего проекта', async () => {
      await request(app.server)
        .get('/api/projects/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .get(`/api/projects/${projectId}`)
        .expect(401);
    });
  });

  describe('PATCH /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Original Project' });
      
      projectId = response.body.id;
    });

    it('должен обновить проект', async () => {
      const response = await request(app.server)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Project' })
        .expect(200);

      expect(response.body.name).toBe('Updated Project');
    });

    it('должен обновить данные проекта', async () => {
      const response = await request(app.server)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: {
            contextBlocks: [
              {
                id: 'block-1',
                title: 'Context',
                items: [
                  { id: 'item-1', content: 'test', chars: 4 },
                ],
              },
            ],
          },
        })
        .expect(200);

      expect(response.body.data.contextBlocks).toHaveLength(1);
    });

    it('должен вернуть 413 при превышении лимита', async () => {
      const largeContent = 'a'.repeat(11_000_000);
      
      await request(app.server)
        .patch(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          data: {
            contextBlocks: [
              {
                id: 'block-1',
                title: 'Large',
                items: [
                  { id: 'item-1', content: largeContent, chars: largeContent.length },
                ],
              },
            ],
          },
        })
        .expect(413);
    });

    it('должен вернуть 404 для несуществующего проекта', async () => {
      await request(app.server)
        .patch('/api/projects/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project to Delete' });
      
      projectId = response.body.id;
    });

    it('должен удалить проект', async () => {
      await request(app.server)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Проверяем, что проект действительно удален
      await request(app.server)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 404 для несуществующего проекта', async () => {
      await request(app.server)
        .delete('/api/projects/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .delete(`/api/projects/${projectId}`)
        .expect(401);
    });
  });

  describe('POST /api/projects/:id/share', () => {
    let projectId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Project to Share' });
      
      projectId = response.body.id;
    });

    it('должен расшарить проект', async () => {
      const response = await request(app.server)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'colleague@example.com',
          permission: 'edit',
        })
        .expect(201);

      expect(response.body.sharedWithEmail).toBe('colleague@example.com');
      expect(response.body.permission).toBe('edit');
    });

    it('должен вернуть 400 при невалидном email', async () => {
      await request(app.server)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
          permission: 'edit',
        })
        .expect(400);
    });

    it('должен вернуть 400 при невалидном permission', async () => {
      await request(app.server)
        .post(`/api/projects/${projectId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'colleague@example.com',
          permission: 'invalid',
        })
        .expect(400);
    });
  });

  describe('GET /api/projects/shared', () => {
    it('должен вернуть расшаренные проекты', async () => {
      const response = await request(app.server)
        .get('/api/projects/shared')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .get('/api/projects/shared')
        .expect(401);
    });
  });
});

