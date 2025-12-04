#!/usr/bin/env tsx
/**
 * Test script to check which Claude models actually work with the API key
 */

import { AnthropicProvider } from '../src/providers/anthropic.provider.js';

async function testClaudeModels() {
  console.log('🧪 Testing Claude Models\n');

  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY not set in environment');
    process.exit(1);
  }

  const provider = new AnthropicProvider(apiKey);

  // Test models to try
  const modelsToTest = [
    'claude-sonnet-4-20240929',
    'claude-4-sonnet-20240929',
    'claude-sonnet-4.5-20240929',
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
  ];

  console.log(`Testing ${modelsToTest.length} model IDs...\n`);

  for (const modelId of modelsToTest) {
    console.log(`\n🔍 Testing: ${modelId}`);
    
    try {
      const result = await provider.sendMessage({
        model: modelId,
        prompt: 'Say "Hello" in one word',
        maxTokens: 10,
        temperature: 0.7,
      });

      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      } else {
        console.log(`   ✅ SUCCESS! Response: "${result.content}"`);
        console.log(`   📊 Tokens: ${result.usage?.totalTokens || 'N/A'}`);
      }
    } catch (error: any) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }

  console.log('\n✅ Test completed!');
}

testClaudeModels().catch(console.error);

