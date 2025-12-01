import { OpenAIProvider } from '../src/providers/openai.provider.js';
import { GeminiProvider } from '../src/providers/gemini.provider.js';
import { GrokProvider } from '../src/providers/grok.provider.js';
import { OpenRouterProvider } from '../src/providers/openrouter.provider.js';
import { AnthropicProvider } from '../src/providers/anthropic.provider.js';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

async function testModelsLoading() {
  console.log('🧪 Testing Dynamic Models Loading\n');

  const providers = [
    { 
      name: 'OpenAI', 
      provider: process.env.OPENAI_API_KEY ? new OpenAIProvider(process.env.OPENAI_API_KEY) : null,
      key: process.env.OPENAI_API_KEY 
    },
    { 
      name: 'Gemini', 
      provider: process.env.GEMINI_API_KEY ? new GeminiProvider(process.env.GEMINI_API_KEY) : null,
      key: process.env.GEMINI_API_KEY 
    },
    { 
      name: 'Grok', 
      provider: process.env.GROK_API_KEY ? new GrokProvider(process.env.GROK_API_KEY) : null,
      key: process.env.GROK_API_KEY 
    },
    { 
      name: 'OpenRouter', 
      provider: process.env.OPENROUTER_API_KEY ? new OpenRouterProvider(process.env.OPENROUTER_API_KEY) : null,
      key: process.env.OPENROUTER_API_KEY 
    },
    { 
      name: 'Anthropic', 
      provider: process.env.ANTHROPIC_API_KEY ? new AnthropicProvider(process.env.ANTHROPIC_API_KEY) : null,
      key: process.env.ANTHROPIC_API_KEY 
    },
  ];

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const { name, provider, key } of providers) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📡 Testing ${name} Provider`);
    console.log(`${'='.repeat(60)}`);

    if (!key) {
      console.log(`⚠️  ${name} API key not found in .env.test - SKIPPED\n`);
      continue;
    }

    if (!provider) {
      console.log(`❌ ${name} provider instance creation failed - SKIPPED\n`);
      continue;
    }

    try {
      console.log(`🔄 Fetching models from ${name} API...`);
      const startTime = Date.now();
      
      const models = await provider.getModels();
      
      const duration = Date.now() - startTime;
      
      if (models.length === 0) {
        console.log(`⚠️  No models returned from ${name} (fallback used?)`);
        totalFailed++;
      } else {
        console.log(`✅ Successfully fetched ${models.length} models in ${duration}ms`);
        console.log(`\n📋 Available models:`);
        
        models.slice(0, 10).forEach((model, index) => {
          console.log(`   ${index + 1}. ${model.name} (${model.id})`);
          console.log(`      Context: ${(model.contextWindow || 0).toLocaleString()} tokens`);
        });
        
        if (models.length > 10) {
          console.log(`   ... and ${models.length - 10} more models`);
        }
        
        totalSuccess++;
      }
    } catch (error) {
      console.log(`❌ Failed to fetch models: ${error instanceof Error ? error.message : String(error)}`);
      totalFailed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Summary`);
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Success: ${totalSuccess}`);
  console.log(`❌ Failed:  ${totalFailed}`);
  console.log(`📝 Total:   ${totalSuccess + totalFailed}`);
  console.log('');
}

testModelsLoading().catch(console.error);

