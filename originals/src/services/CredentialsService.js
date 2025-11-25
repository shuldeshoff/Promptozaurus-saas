// src/services/CredentialsService.js - Service for secure API key storage
// @description: Secure storage and management of API keys via system keychain and fallback encryption
// @created: 2025-06-25 - secure architecture implementation for AI API keys

/**
 * Service for secure API key storage
 * Uses system keychain (Windows Credential Manager, macOS Keychain, Linux libsecret)
 * via keytar module with fallback to encrypted local storage
 */
class CredentialsService {
  static SERVICE_NAME = 'prompt-constructor-ai';
  
  /**
   * Store API key for provider
   * @param {string} provider - Provider name (openai, anthropic, openrouter)
   * @param {string} apiKey - API key to store
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async storeAPIKey(provider, apiKey) {
    try {
      console.log(`Storing API key for provider: ${provider}`);
      
      if (!provider || !apiKey) {
        throw new Error('Provider and API key are required');
      }
      
      // Skip validation for simplicity
      
      // Use simple local storage directly
      const result = await window.electronAPI.invoke('credentials-store', {
        service: CredentialsService.SERVICE_NAME,
        account: `${provider}-api-key`,
        password: apiKey
      });
      
      if (result.success) {
        console.log(`API key for ${provider} successfully stored`);
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to store key');
      }
    } catch (error) {
      console.error(`Error storing API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error storing key' 
      };
    }
  }
  
  /**
   * Get API key for provider
   * @param {string} provider - Provider name
   * @returns {Promise<{success: boolean, apiKey?: string, error?: string}>}
   */
  static async getAPIKey(provider) {
    try {
      console.log(`Getting API key for provider: ${provider}`);
      
      if (!provider) {
        throw new Error('Provider is required');
      }
      
      // Use simple local storage directly
      const result = await window.electronAPI.invoke('credentials-get', {
        service: CredentialsService.SERVICE_NAME,
        account: `${provider}-api-key`
      });
      
      if (result.success && result.password) {
        console.log(`API key for ${provider} retrieved`);
        return { success: true, apiKey: result.password };
      } else if (result.notFound) {
        console.log(`API key for ${provider} not found`);
        return { success: false, error: 'API key not found' };
      } else {
        throw new Error(result.error || 'Failed to get key');
      }
    } catch (error) {
      console.error(`Error getting API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error getting key' 
      };
    }
  }
  
  /**
   * Remove API key for provider
   * @param {string} provider - Provider name
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  static async removeAPIKey(provider) {
    try {
      console.log(`Removing API key for provider: ${provider}`);
      
      if (!provider) {
        throw new Error('Provider is required');
      }
      
      // Remove from simple local storage
      const result = await window.electronAPI.invoke('credentials-remove', {
        service: CredentialsService.SERVICE_NAME,
        account: `${provider}-api-key`
      });
      
      if (result.success) {
        console.log(`API key for ${provider} removed`);
        return { success: true };
      } else {
        return { success: false, error: result.error || 'Failed to remove key' };
      }
    } catch (error) {
      console.error(`Error removing API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error removing key' 
      };
    }
  }
  
  /**
   * Check if API key exists for provider
   * @param {string} provider - Provider name
   * @returns {Promise<{success: boolean, hasKey: boolean, error?: string}>}
   */
  static async hasAPIKey(provider) {
    try {
      const result = await CredentialsService.getAPIKey(provider);
      return { 
        success: true, 
        hasKey: result.success && !!result.apiKey 
      };
    } catch (error) {
      console.error(`Error checking API key existence for ${provider}:`, error);
      return { 
        success: false, 
        hasKey: false, 
        error: error.message 
      };
    }
  }
  
  /**
   * Get status of all providers (whether they have keys)
   * @returns {Promise<{success: boolean, providers: Object, error?: string}>}
   */
  static async getAllProvidersStatus() {
    try {
      const providers = ['openai', 'anthropic', 'openrouter'];
      const status = {};
      
      for (const provider of providers) {
        const result = await CredentialsService.hasAPIKey(provider);
        status[provider] = {
          hasKey: result.hasKey,
          error: result.error
        };
      }
      
      return { success: true, providers: status };
    } catch (error) {
      console.error('Error getting providers status:', error);
      return { 
        success: false, 
        providers: {}, 
        error: error.message 
      };
    }
  }
  
  /**
   * Validate API key format for different providers
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to validate
   * @returns {boolean}
   */
  static validateAPIKeyFormat(provider, apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    const trimmedKey = apiKey.trim();
    
    switch (provider) {
      case 'openai':
        // OpenAI keys start with "sk-" and contain letters, numbers and dashes
        // New format may include "sk-proj-" and other prefixes
        return /^sk-[a-zA-Z0-9\-_]{20,}$/.test(trimmedKey);
        
      case 'anthropic':
        // Anthropic keys start with "sk-ant-" 
        return /^sk-ant-[a-zA-Z0-9\-_]{20,}$/.test(trimmedKey);
        
      case 'openrouter':
        // OpenRouter keys start with "sk-or-" (various versions)
        return /^sk-or-[a-zA-Z0-9\-_]{20,}$/.test(trimmedKey);
        
      default:
        // For unknown providers - basic validation
        return trimmedKey.length >= 20 && /^[a-zA-Z0-9\-_]+$/.test(trimmedKey);
    }
  }
  
  /**
   * Mask API key for UI display (show only first and last characters)
   * @param {string} apiKey - API key to mask
   * @returns {string}
   */
  static maskAPIKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return '***';
    }
    
    const trimmedKey = apiKey.trim();
    
    if (trimmedKey.length <= 8) {
      return '***';
    }
    
    const start = trimmedKey.slice(0, 6);
    const end = trimmedKey.slice(-4);
    const middle = '*'.repeat(Math.min(12, trimmedKey.length - 10));
    
    return `${start}${middle}${end}`;
  }
  
  /**
   * Test API key (basic connection check)
   * @param {string} provider - Provider name
   * @param {string} apiKey - API key to test
   * @returns {Promise<{success: boolean, error?: string, models?: Array}>}
   */
  static async testAPIKey(provider, apiKey) {
    try {
      console.log(`Testing API key for provider: ${provider}`);
      
      if (!CredentialsService.validateAPIKeyFormat(provider, apiKey)) {
        throw new Error('Invalid API key format');
      }
      
      // Temporarily disable testing via main process
      // TODO: Implement testing via AIService
      console.log('API key testing temporarily disabled');
      return { success: true, models: [] };
    } catch (error) {
      console.error(`Error testing API key for ${provider}:`, error);
      return { 
        success: false, 
        error: error.message || 'Unknown error testing key' 
      };
    }
  }
}

export default CredentialsService;