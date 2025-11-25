import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify, { FastifyInstance } from 'fastify';
import { projectRoutes } from '../routes/project.routes';

// Skip E2E tests if DATABASE_URL is not set for PostgreSQL
const shouldSkip = !process.env.DATABASE_URL || process.env.DATABASE_URL.includes('file:');
const describeOrSkip = shouldSkip ? describe.skip : describe;

describeOrSkip('E2E: Project Management Flow', () => {
  let app: FastifyInstance;
  const mockUserId = 'e2e-test-user';
  let createdProjectId: string;

  beforeAll(async () => {
    app = Fastify();

    // Mock authentication
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

  it('E2E Flow: Create → Read → Update → Duplicate → Export → Import → Delete', async () => {
    // Step 1: Create a project
    console.log('Step 1: Creating project...');
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
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
    });

    expect(readResponse.statusCode).toBe(200);
    const readBody = JSON.parse(readResponse.body);
    expect(readBody.data.id).toBe(createdProjectId);
    expect(readBody.data.name).toBe('E2E Test Project');
    console.log('✓ Project read successfully');

    // Step 3: Update the project
    console.log('Step 3: Updating project...');
    const updateResponse = await app.inject({
      method: 'PATCH',
      url: `/api/projects/${createdProjectId}`,
      payload: {
        name: 'Updated E2E Project',
        data: {
          contextBlocks: [{ id: '1', content: 'Test context' }],
          promptBlocks: [{ id: '1', content: 'Test prompt' }],
        },
      },
    });

    expect(updateResponse.statusCode).toBe(200);
    const updateBody = JSON.parse(updateResponse.body);
    expect(updateBody.data.name).toBe('Updated E2E Project');
    expect(updateBody.data.data.contextBlocks).toHaveLength(1);
    console.log('✓ Project updated successfully');

    // Step 4: List all projects
    console.log('Step 4: Listing all projects...');
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects',
    });

    expect(listResponse.statusCode).toBe(200);
    const listBody = JSON.parse(listResponse.body);
    expect(Array.isArray(listBody.data)).toBe(true);
    expect(listBody.data.length).toBeGreaterThan(0);
    console.log(`✓ Found ${listBody.data.length} project(s)`);

    // Step 5: Duplicate the project
    console.log('Step 5: Duplicating project...');
    const duplicateResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${createdProjectId}/duplicate`,
    });

    expect(duplicateResponse.statusCode).toBe(200);
    const duplicateBody = JSON.parse(duplicateResponse.body);
    expect(duplicateBody.data.name).toContain('(Copy)');
    expect(duplicateBody.data.id).not.toBe(createdProjectId);

    const duplicatedProjectId = duplicateBody.data.id;
    console.log(`✓ Project duplicated with ID: ${duplicatedProjectId}`);

    // Step 6: Export the project
    console.log('Step 6: Exporting project...');
    const exportResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProjectId}/export`,
    });

    expect(exportResponse.statusCode).toBe(200);
    const exportBody = JSON.parse(exportResponse.body);
    expect(exportBody.data).toHaveProperty('name');
    expect(exportBody.data).toHaveProperty('data');
    expect(exportBody.data).toHaveProperty('exportedAt');
    expect(exportBody.data).toHaveProperty('version', '1.0');
    console.log('✓ Project exported successfully');

    // Step 7: Import a new project
    console.log('Step 7: Importing project...');
    const importResponse = await app.inject({
      method: 'POST',
      url: '/api/projects/import',
      payload: {
        name: 'Imported E2E Project',
        data: exportBody.data.data,
      },
    });

    expect(importResponse.statusCode).toBe(200);
    const importBody = JSON.parse(importResponse.body);
    expect(importBody.data.name).toBe('Imported E2E Project');

    const importedProjectId = importBody.data.id;
    console.log(`✓ Project imported with ID: ${importedProjectId}`);

    // Step 8: Delete the duplicated project
    console.log('Step 8: Deleting duplicated project...');
    const deleteDuplicateResponse = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${duplicatedProjectId}`,
    });

    expect(deleteDuplicateResponse.statusCode).toBe(200);
    console.log('✓ Duplicated project deleted');

    // Step 9: Delete the imported project
    console.log('Step 9: Deleting imported project...');
    const deleteImportedResponse = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${importedProjectId}`,
    });

    expect(deleteImportedResponse.statusCode).toBe(200);
    console.log('✓ Imported project deleted');

    // Step 10: Delete the original project
    console.log('Step 10: Deleting original project...');
    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${createdProjectId}`,
    });

    expect(deleteResponse.statusCode).toBe(200);
    console.log('✓ Original project deleted');

    // Step 11: Verify deletion
    console.log('Step 11: Verifying deletion...');
    const verifyResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProjectId}`,
    });

    expect(verifyResponse.statusCode).toBe(404);
    console.log('✓ Deletion verified');

    console.log('\n✅ E2E Flow completed successfully!');
  });

  it('E2E Flow: Project Limit Enforcement', async () => {
    console.log('\nTesting project limit enforcement...');

    // Get current project count
    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects',
    });

    const currentCount = JSON.parse(listResponse.body).data.length;
    console.log(`Current project count: ${currentCount}`);

    // Create projects up to limit
    const projectsToCreate = 10 - currentCount;
    const createdIds: string[] = [];

    for (let i = 0; i < projectsToCreate; i++) {
      const response = await app.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { name: `Limit Test Project ${i}` },
      });

      if (response.statusCode === 200) {
        const body = JSON.parse(response.body);
        createdIds.push(body.data.id);
      }
    }

    console.log(`✓ Created ${createdIds.length} projects`);

    // Try to create one more (should fail)
    console.log('Attempting to exceed limit...');
    const limitResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: { name: 'Should Fail' },
    });

    expect(limitResponse.statusCode).toBe(403);
    const limitBody = JSON.parse(limitResponse.body);
    expect(limitBody.error).toBe('Project limit reached');
    console.log('✓ Limit enforcement working correctly');

    // Cleanup
    console.log('Cleaning up test projects...');
    for (const id of createdIds) {
      await app.inject({
        method: 'DELETE',
        url: `/api/projects/${id}`,
      });
    }
    console.log('✓ Cleanup complete');

    console.log('\n✅ Limit enforcement test completed successfully!');
  });
});

