import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';
import { projectRoutes } from '../routes/project.routes';
import { prisma } from '../lib/prisma';

// E2E tests will run with proper test database
const shouldSkip = false;
const describeOrSkip = shouldSkip ? describe.skip : describe;

describeOrSkip('E2E: Project Management Flow', () => {
  let app: FastifyInstance;
  let testUser: any;
  let authToken: string;
  let createdProjectId: string;

  beforeAll(async () => {
    app = Fastify();

    // Register JWT plugin
    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'test-jwt-secret',
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'e2e@example.com',
        name: 'E2E Test User',
        googleId: 'e2e-google-id',
      },
    });

    // Generate auth token
    authToken = app.jwt.sign({ userId: testUser.id });

    await app.register(projectRoutes);
    await app.ready();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.project.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    await prisma.$disconnect();
    await app.close();
  });

  it('E2E Flow: Create → Read → Update → Duplicate → Export → Import → Delete', async () => {
    // Step 1: Create a project
    console.log('Step 1: Creating project...');
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'E2E Test Project',
      },
    });

    expect(createResponse.statusCode).toBe(200);
    const createBody = JSON.parse(createResponse.body);
    expect(createBody.success).toBe(true);
    expect(createBody.data).toHaveProperty('id');
    expect(createBody.data.name).toBe('E2E Test Project');

    createdProjectId = createBody.data.id;
    console.log(`✓ Project created with ID: ${createdProjectId}`);

    // Step 2: Read the project
    console.log('Step 2: Reading project...');
    const readResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProjectId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(readResponse.statusCode).toBe(200);
    const readBody = JSON.parse(readResponse.body);
    expect(readBody.data.id).toBe(createdProjectId);
    console.log('✓ Project read successfully');

    // Step 3: Update the project
    console.log('Step 3: Updating project...');
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${createdProjectId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'E2E Updated Project',
        data: {
          contextBlocks: [
            {
              id: 'ctx-1',
              name: 'Test Context',
              items: [],
            },
          ],
          promptBlocks: [],
        },
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = JSON.parse(updateResponse.body);
    expect(updateBody.data.name).toBe('E2E Updated Project');
    console.log('✓ Project updated successfully');

    // Step 4: Duplicate the project
    console.log('Step 4: Duplicating project...');
    const duplicateResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${createdProjectId}/duplicate`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(duplicateResponse.statusCode).toBe(200);
    const duplicateBody = JSON.parse(duplicateResponse.body);
    expect(duplicateBody.data.name).toContain('(Copy)');
    const duplicateId = duplicateBody.data.id;
    console.log(`✓ Project duplicated with ID: ${duplicateId}`);

    // Step 5: Export the project
    console.log('Step 5: Exporting project...');
    const exportResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProjectId}/export`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(exportResponse.statusCode).toBe(200);
    const exportBody = JSON.parse(exportResponse.body);
    expect(exportBody.data).toHaveProperty('name');
    expect(exportBody.data).toHaveProperty('exportedAt');
    console.log('✓ Project exported successfully');

    // Step 6: Import a project
    console.log('Step 6: Importing project...');
    const importResponse = await app.inject({
      method: 'POST',
      url: '/api/projects/import',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: {
        name: 'E2E Imported Project',
        data: {
          contextBlocks: [],
          promptBlocks: [],
        },
      },
    });

    expect(importResponse.statusCode).toBe(200);
    const importBody = JSON.parse(importResponse.body);
    expect(importBody.data.name).toBe('E2E Imported Project');
    const importedId = importBody.data.id;
    console.log(`✓ Project imported with ID: ${importedId}`);

    // Step 7: Delete projects
    console.log('Step 7: Deleting projects...');
    
    // Delete original
    const deleteResponse1 = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${createdProjectId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
    expect(deleteResponse1.statusCode).toBe(200);

    // Delete duplicate
    const deleteResponse2 = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${duplicateId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
    expect(deleteResponse2.statusCode).toBe(200);

    // Delete imported
    const deleteResponse3 = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${importedId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });
    expect(deleteResponse3.statusCode).toBe(200);

    console.log('✓ All projects deleted successfully');

    // Step 8: Verify deletion
    console.log('Step 8: Verifying deletion...');
    const verifyResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProjectId}`,
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    expect(verifyResponse.statusCode).toBe(404);
    console.log('✓ Deletion verified');

    console.log('✅ E2E Flow completed successfully!');
  });

  it('E2E Flow: Project Limit Enforcement', async () => {
    console.log('Testing project limit enforcement...');

    // Get current count
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
    });

    const currentCount = JSON.parse(listResponse.body).data.length;
    console.log(`Current project count: ${currentCount}`);

    // Create projects up to limit
    const projectsToCreate = 10 - currentCount;
    console.log(`Creating ${projectsToCreate} projects to reach limit...`);

    for (let i = 0; i < projectsToCreate; i++) {
      await app.inject({
        method: 'POST',
        url: '/api/projects',
        headers: {
          authorization: `Bearer ${authToken}`,
        },
        payload: { name: `Limit Test Project ${i}` },
      });
    }

    // Try to create one more (should fail)
    console.log('Attempting to create project beyond limit...');
    const limitResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      payload: { name: 'Should Fail' },
    });

    expect(limitResponse.statusCode).toBe(403);
    const limitBody = JSON.parse(limitResponse.body);
    expect(limitBody.error).toBe('Project limit reached');
    console.log('✓ Limit enforcement working correctly');

    console.log('✅ Project limit test completed!');
  });
});
