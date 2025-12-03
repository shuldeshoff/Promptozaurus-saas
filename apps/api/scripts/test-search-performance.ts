#!/usr/bin/env tsx
/**
 * Test script to compare search performance
 * Before: ILIKE search (7-8 seconds on 1000+ records)
 * After: Full-text search with GIN indexes (expected <100ms)
 */

import prisma from '../src/lib/prisma.js';
import { templateService } from '../src/services/template.service.js';

async function testSearchPerformance() {
  console.log('🔍 Testing Template Search Performance\n');

  // Get first user from database
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found in database');
    process.exit(1);
  }

  const userId = user.id;
  console.log(`👤 Testing with user: ${user.email}\n`);

  // Get total template count
  const totalCount = await templateService.getTemplateCount(userId);
  console.log(`📊 Total templates: ${totalCount}\n`);

  if (totalCount === 0) {
    console.warn('⚠️  No templates found. Creating test data...\n');
    
    // Create 100 test templates
    for (let i = 0; i < 100; i++) {
      await templateService.createTemplate({
        userId,
        name: `Test Template ${i + 1}`,
        content: `This is test content for template ${i + 1}. It contains various keywords like: AI, machine learning, neural networks, deep learning, NLP, computer vision, and more.`,
      });
    }
    
    console.log('✅ Created 100 test templates\n');
  }

  // Test queries
  const testQueries = [
    'template',
    'machine learning',
    'AI neural',
    'test content',
    'vision networks',
  ];

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const query of testQueries) {
    console.log(`🔎 Query: "${query}"`);
    
    // Test new full-text search
    const startNew = Date.now();
    const resultsNew = await templateService.searchTemplates(userId, query);
    const timeNew = Date.now() - startNew;
    
    console.log(`   ✅ Full-text search: ${timeNew}ms (${resultsNew.length} results)`);
    
    // Test old ILIKE search (fallback)
    const startOld = Date.now();
    const resultsOld = await templateService.searchTemplatesFallback(userId, query);
    const timeOld = Date.now() - startOld;
    
    console.log(`   ❌ ILIKE search:     ${timeOld}ms (${resultsOld.length} results)`);
    
    // Calculate speedup
    const speedup = (timeOld / timeNew).toFixed(2);
    console.log(`   🚀 Speedup: ${speedup}x faster\n`);
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test edge cases
  console.log('🧪 Testing edge cases:\n');

  // Empty query
  const emptyStart = Date.now();
  const emptyResults = await templateService.searchTemplates(userId, '');
  const emptyTime = Date.now() - emptyStart;
  console.log(`   Empty query: ${emptyTime}ms (${emptyResults.length} results)`);

  // Special characters
  const specialStart = Date.now();
  const specialResults = await templateService.searchTemplates(userId, '!@#$%');
  const specialTime = Date.now() - specialStart;
  console.log(`   Special chars: ${specialTime}ms (${specialResults.length} results)`);

  // Very long query
  const longQuery = 'template '.repeat(20);
  const longStart = Date.now();
  const longResults = await templateService.searchTemplates(userId, longQuery);
  const longTime = Date.now() - longStart;
  console.log(`   Long query: ${longTime}ms (${longResults.length} results)\n`);

  console.log('✅ Performance test completed!\n');

  await prisma.$disconnect();
}

testSearchPerformance().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

