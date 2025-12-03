#!/usr/bin/env tsx
/**
 * Create 1000+ test templates to simulate real customer load
 */

import prisma from '../src/lib/prisma.js';

async function createMassTestData() {
  console.log('📦 Creating 1000 test templates...\n');

  const user = await prisma.user.findFirst();
  if (!user) {
    console.error('❌ No users found');
    process.exit(1);
  }

  const keywords = [
    'AI', 'machine learning', 'neural networks', 'deep learning', 'NLP',
    'computer vision', 'transformers', 'GPT', 'BERT', 'reinforcement learning',
    'supervised', 'unsupervised', 'classification', 'regression', 'clustering',
    'gradient descent', 'backpropagation', 'convolutional', 'recurrent', 'attention',
    'embeddings', 'tokenization', 'fine-tuning', 'transfer learning', 'pre-training',
  ];

  const templates = [];
  const batchSize = 100;
  const totalCount = 1000;

  for (let i = 0; i < totalCount; i++) {
    const randomKeywords = keywords
      .sort(() => Math.random() - 0.5)
      .slice(0, 5)
      .join(', ');

    templates.push({
      userId: user.id,
      name: `AI Template ${i + 1}: ${randomKeywords.split(',')[0]}`,
      content: `This is a comprehensive AI template about ${randomKeywords}. 
      
It includes detailed information about various machine learning concepts, algorithms, and applications.
The template covers topics like neural network architectures, training methodologies, and optimization techniques.

Keywords: ${randomKeywords}

Generated at: ${new Date().toISOString()}
Template number: ${i + 1}`,
    });

    if (templates.length >= batchSize || i === totalCount - 1) {
      await prisma.template.createMany({ data: templates });
      console.log(`✅ Created ${i + 1}/${totalCount} templates`);
      templates.length = 0; // Clear array
    }
  }

  console.log('\n🎉 Successfully created 1000 test templates!');
  await prisma.$disconnect();
}

createMassTestData().catch(console.error);

