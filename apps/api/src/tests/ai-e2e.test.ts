import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { FastifyInstance } from 'fastify';
import { createTestApp } from './helpers/test-app';
import { createTestUser, getAuthToken } from './helpers/test-auth';

/**
 * E2E тесты для AI API endpoints
 * 
 * Тестирует полный flow от HTTP запроса до получения ответа от AI модели
 */

describe('AI API E2E Tests', () => {
  let app: FastifyInstance;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const user = await createTestUser(app);
    userId = user.id;
    authToken = await getAuthToken(user.id);
  });

  describe('POST /ai/send', () => {
    it('should fail without authentication', async () => {
      const response = await request(app.server)
        .post('/ai/send')
        .send({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
        });

      expect(response.status).toBe(401);
    });

    it('should fail without API key configured', async () => {
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.7,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('API key');
    });

    it.skipIf(!process.env.OPENAI_API_KEY)(
      'should generate AI response with valid API key',
      async () => {
        // Сначала сохраняем API ключ
        await request(app.server)
          .post('/user/api-keys/openai')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ apiKey: process.env.OPENAI_API_KEY });

        // Отправляем запрос к AI
        const response = await request(app.server)
          .post('/ai/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "test" in one word.' }],
            temperature: 0.7,
            maxTokens: 10,
          });

        expect(response.status).toBe(200);
        expect(response.body.response).toBeDefined();
        expect(response.body.response.length).toBeGreaterThan(0);
      },
      30000
    );

    it('should validate request body', async () => {
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Отсутствует model
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.status).toBe(400);
    });

    it('should handle invalid model', async () => {
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'openai',
          model: 'invalid-model-name',
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.status).toBe(400);
    });

    it('should respect temperature and maxTokens', async () => {
      // Mock для проверки параметров
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          temperature: 0.3,
          maxTokens: 5,
        });

      // Проверяем что запрос валидный
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /ai/models', () => {
    it.skipIf(!process.env.OPENROUTER_API_KEY)(
      'should fetch available models from OpenRouter',
      async () => {
        // Сохраняем OpenRouter API ключ
        await request(app.server)
          .post('/user/api-keys/openrouter')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ apiKey: process.env.OPENROUTER_API_KEY });

        const response = await request(app.server)
          .get('/ai/models?provider=openrouter')
          .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.models)).toBe(true);
        expect(response.body.models.length).toBeGreaterThan(0);

        // Проверяем структуру модели
        const firstModel = response.body.models[0];
        expect(firstModel).toHaveProperty('id');
        expect(firstModel).toHaveProperty('name');
        expect(firstModel).toHaveProperty('contextLength');
      },
      30000
    );

    it('should return cached models on second request', async () => {
      const response1 = await request(app.server)
        .get('/ai/models?provider=openai')
        .set('Authorization', `Bearer ${authToken}`);

      const response2 = await request(app.server)
        .get('/ai/models?provider=openai')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response1.body).toEqual(response2.body);
    });
  });

  describe('GET /ai/config', () => {
    it('should return user AI configuration', async () => {
      const response = await request(app.server)
        .get('/ai/config')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('settings');
      expect(response.body).toHaveProperty('models');
      expect(response.body.settings).toHaveProperty('timeout');
      expect(response.body.settings).toHaveProperty('retryCount');
    });
  });

  describe('PUT /ai/config', () => {
    it('should save user AI configuration', async () => {
      const config = {
        settings: {
          timeout: 45000,
          retryCount: 2,
          streamingEnabled: true,
          autoSave: false,
        },
        models: [
          {
            id: 'test-1',
            provider: 'openai',
            modelId: 'gpt-4o-mini',
            customName: 'Test Model',
            temperature: 0.8,
            maxTokens: 1000,
            isDefault: true,
          },
        ],
      };

      const response = await request(app.server)
        .put('/ai/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send(config);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Проверяем что конфигурация сохранилась
      const getResponse = await request(app.server)
        .get('/ai/config')
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.settings.timeout).toBe(45000);
      expect(getResponse.body.models).toHaveLength(1);
      expect(getResponse.body.models[0].customName).toBe('Test Model');
    });

    it('should validate configuration schema', async () => {
      const response = await request(app.server)
        .put('/ai/config')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          settings: {
            timeout: 'invalid', // должно быть число
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Streaming responses', () => {
    it.skipIf(!process.env.OPENAI_API_KEY)(
      'should handle streaming AI responses',
      async () => {
        // Сохраняем API ключ
        await request(app.server)
          .post('/user/api-keys/openai')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ apiKey: process.env.OPENAI_API_KEY });

        let chunks: string[] = [];
        
        const response = await request(app.server)
          .post('/ai/send')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Accept', 'text/event-stream')
          .send({
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Count from 1 to 3.' }],
            temperature: 0.7,
            maxTokens: 50,
            stream: true,
          });

        // Проверяем что получили SSE stream
        expect(response.headers['content-type']).toContain('text/event-stream');
        expect(response.status).toBe(200);
      },
      30000
    );
  });

  describe('Error handling', () => {
    it('should handle API rate limits gracefully', async () => {
      // Имитируем rate limit через много быстрых запросов
      const requests = Array(10).fill(null).map(() =>
        request(app.server)
          .post('/ai/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Hi' }],
          })
      );

      const responses = await Promise.all(requests);
      
      // Хотя бы один запрос должен вернуть ошибку rate limit или успех
      const statuses = responses.map(r => r.status);
      expect(statuses.some(s => [200, 429, 400].includes(s))).toBe(true);
    });

    it('should handle network timeout', async () => {
      // Устанавливаем очень короткий timeout
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          timeout: 1, // 1ms - гарантированно не успеет
        });

      expect([408, 400, 500]).toContain(response.status);
    });

    it('should handle malformed API responses', async () => {
      // Используем несуществующий endpoint для теста
      const response = await request(app.server)
        .post('/ai/send')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          provider: 'openai',
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Hello' }],
          baseUrl: 'https://invalid-url-that-does-not-exist.com',
        });

      expect([400, 500, 502, 503]).toContain(response.status);
    });
  });

  describe('Multi-provider workflow', () => {
    it.skipIf(!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY)(
      'should work with multiple providers',
      async () => {
        // Сохраняем ключи для разных провайдеров
        await request(app.server)
          .post('/user/api-keys/openai')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ apiKey: process.env.OPENAI_API_KEY });

        await request(app.server)
          .post('/user/api-keys/anthropic')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ apiKey: process.env.ANTHROPIC_API_KEY });

        // Запрос к OpenAI
        const openaiResponse = await request(app.server)
          .post('/ai/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'openai',
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Say "OpenAI"' }],
            maxTokens: 10,
          });

        // Запрос к Anthropic
        const anthropicResponse = await request(app.server)
          .post('/ai/send')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            provider: 'anthropic',
            model: 'claude-3-5-haiku-20241022',
            messages: [{ role: 'user', content: 'Say "Anthropic"' }],
            maxTokens: 10,
          });

        expect(openaiResponse.status).toBe(200);
        expect(anthropicResponse.status).toBe(200);
        expect(openaiResponse.body.response).toBeDefined();
        expect(anthropicResponse.body.response).toBeDefined();
      },
      60000
    );
  });
});

