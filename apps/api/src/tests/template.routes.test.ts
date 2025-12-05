import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { createTestApp, createTestUser } from './helpers/test-app';

describe('Template Routes', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;
  let projectId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const auth = await createTestUser(app);
    authToken = auth.token;
    userId = auth.userId;

    // Создаем тестовый проект
    const projectResponse = await request(app.server)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Test Project' });
    
    projectId = projectResponse.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/templates', () => {
    it('должен создать новый промпт', async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Test Prompt',
          content: 'This is a test prompt for {{variable}}',
          variables: { variable: 'test' },
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Prompt');
      expect(response.body.content).toContain('{{variable}}');
    });

    it('должен создать промпт без переменных', async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Simple Prompt',
          content: 'Simple prompt without variables',
        })
        .expect(201);

      expect(response.body.variables).toBeFalsy();
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .post('/api/templates')
        .send({
          projectId,
          name: 'Test',
          content: 'Content',
        })
        .expect(401);
    });

    it('должен вернуть 400 при отсутствии обязательных полей', async () => {
      await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ projectId })
        .expect(400);
    });
  });

  describe('GET /api/templates', () => {
    beforeEach(async () => {
      // Создаем тестовые промпты
      await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Prompt 1',
          content: 'Content 1',
        });

      await request(app.server)
        .post('/api/templates')
        .set('Authorization`, `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Prompt 2',
          content: 'Content 2',
        });
    });

    it('должен вернуть все промпты пользователя', async () => {
      const response = await request(app.server)
        .get('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);
    });

    it('должен фильтровать по projectId', async () => {
      const response = await request(app.server)
        .get(`/api/templates?projectId=${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((template: any) => {
        expect(template.projectId).toBe(projectId);
      });
    });

    it('должен вернуть 401 без авторизации', async () => {
      await request(app.server)
        .get('/api/templates')
        .expect(401);
    });
  });

  describe('GET /api/templates/search', () => {
    beforeEach(async () => {
      await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Python Code Review',
          content: 'Review this Python code',
        });

      await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'JavaScript Analysis',
          content: 'Analyze JavaScript code',
        });
    });

    it('должен найти промпты по запросу', async () => {
      const response = await request(app.server)
        .get('/api/templates/search?q=python')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].name.toLowerCase()).toContain('python');
    });

    it('должен вернуть пустой массив если ничего не найдено', async () => {
      const response = await request(app.server)
        .get('/api/templates/search?q=nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('должен вернуть 400 если нет параметра q', async () => {
      await request(app.server)
        .get('/api/templates/search')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('GET /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Test Template',
          content: 'Test content',
        });

      templateId = response.body.id;
    });

    it('должен вернуть конкретный промпт', async () => {
      const response = await request(app.server)
        .get(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(templateId);
      expect(response.body.name).toBe('Test Template');
    });

    it('должен вернуть 404 для несуществующего промпта', async () => {
      await request(app.server)
        .get('/api/templates/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Original Template',
          content: 'Original content',
        });

      templateId = response.body.id;
    });

    it('должен обновить промпт', async () => {
      const response = await request(app.server)
        .patch(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Template',
          content: 'Updated content with {{variable}}',
          variables: { variable: 'value' },
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Template');
      expect(response.body.content).toContain('{{variable}}');
    });

    it('должен вернуть 404 для несуществующего промпта', async () => {
      await request(app.server)
        .patch('/api/templates/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' })
        .expect(404);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Template to Delete',
          content: 'Content',
        });

      templateId = response.body.id;
    });

    it('должен удалить промпт', async () => {
      await request(app.server)
        .delete(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      // Проверяем, что промпт удален
      await request(app.server)
        .get(`/api/templates/${templateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('должен вернуть 404 для несуществующего промпта', async () => {
      await request(app.server)
        .delete('/api/templates/nonexistent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /api/templates/:id/duplicate', () => {
    let templateId: string;

    beforeEach(async () => {
      const response = await request(app.server)
        .post('/api/templates')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId,
          name: 'Original Template',
          content: 'Original content',
          variables: { var: 'value' },
        });

      templateId = response.body.id;
    });

    it('должен создать копию промпта', async () => {
      const response = await request(app.server)
        .post(`/api/templates/${templateId}/duplicate`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.name).toContain('Copy');
      expect(response.body.content).toBe('Original content');
      expect(response.body.variables).toEqual({ var: 'value' });
      expect(response.body.id).not.toBe(templateId);
    });

    it('должен вернуть 404 для несуществующего промпта', async () => {
      await request(app.server)
        .post('/api/templates/nonexistent-id/duplicate')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

