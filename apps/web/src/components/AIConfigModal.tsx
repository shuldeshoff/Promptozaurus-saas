import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { AiProvider } from '@promptozaurus/shared';
import {
  useApiKeys,
  useUpsertApiKey,
  useDeleteApiKey,
  useTestApiKey,
} from '../hooks/useApiKeys';
import {
  useAIConfig,
  useSaveAIConfig,
  UserAISettings,
} from '../hooks/useAIConfig';
import { useConfirmation } from '../context/ConfirmationContext';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ModelConfig {
  id: string;
  provider: AiProvider;
  modelId: string;
  modelName: string;
  customName: string;
  temperature: number;
  maxTokens: number;
  isDefault: boolean;
}

const PROVIDERS: Array<{
  id: AiProvider;
  name: string;
  placeholder: string;
}> = [
  {
    id: 'openai',
    name: 'OpenAI',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    placeholder: 'AI...',
  },
  {
    id: 'grok',
    name: 'X.AI Grok',
    placeholder: 'xai-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    placeholder: 'sk-or-...',
  },
];

// Hardcoded models for providers (обновлено на основе реальных тестов 30.11.2025)
const PROVIDER_MODELS: Record<AiProvider, Array<{ id: string; name: string; contextLength: number }>> = {
  openai: [
    // GPT-5 модели (новые, протестированы)
    { id: 'gpt-5-mini', name: 'GPT-5 Mini', contextLength: 128000 },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano', contextLength: 128000 },
    // GPT-4 модели (legacy, могут работать)
    { id: 'gpt-4o', name: 'GPT-4o', contextLength: 128000 },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', contextLength: 128000 },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', contextLength: 128000 },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', contextLength: 16385 },
  ],
  anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', contextLength: 200000 },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', contextLength: 200000 },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', contextLength: 200000 },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', contextLength: 200000 },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', contextLength: 200000 },
  ],
  gemini: [
    // Gemini 2.5 модели (упомянуты в документации, региональные ограничения!)
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash ⚠️ ', contextLength: 1000000 },
    { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-Lite ⚠️', contextLength: 1000000 },
    // Gemini 2.0 и 1.5 модели
    { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash', contextLength: 1000000 },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', contextLength: 2000000 },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', contextLength: 1000000 },
  ],
  grok: [
    // Новые модели Grok (протестированы, работают отлично)
    { id: 'grok-3-mini', name: 'Grok 3 Mini', contextLength: 131072 },
    { id: 'grok-4-1-fast-non-reasoning', name: 'Grok 4.1 Fast', contextLength: 131072 },
    // Legacy модели (могут не работать)
    { id: 'grok-beta', name: 'Grok Beta (deprecated)', contextLength: 131072 },
    { id: 'grok-vision-beta', name: 'Grok Vision Beta', contextLength: 8192 },
  ],
  openrouter: [
    // Бесплатные модели (протестированы)
    { id: 'meta-llama/llama-3.2-3b-instruct:free', name: 'Llama 3.2 3B (Free)', contextLength: 131072 },
    // Платные модели
    { id: 'openai/gpt-4o', name: 'GPT-4o', contextLength: 128000 },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', contextLength: 200000 },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', contextLength: 1000000 },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', contextLength: 131072 },
  ],
};

export default function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const { t } = useTranslation('aiConfig');
  const { openConfirmation } = useConfirmation();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'settings'>('providers');
  
  // State for providers
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState<Record<AiProvider, string>>({} as any);
  const [showPassword, setShowPassword] = useState<Record<AiProvider, boolean>>({} as any);

  const { data: apiKeys, isLoading } = useApiKeys();
  const upsertMutation = useUpsertApiKey();
  const deleteMutation = useDeleteApiKey();
  const testMutation = useTestApiKey();

  // State for model configurations
  const [modelConfigs, setModelConfigs] = useState<ModelConfig[]>([]);
  const [newModelConfig, setNewModelConfig] = useState({
    provider: '' as AiProvider | '',
    modelId: '',
    customName: '',
    temperature: 0.7,
    maxTokens: 4000,
    isDefault: false,
  });

  // Global settings (из серверной конфигурации)
  const [globalSettings, setGlobalSettings] = useState<UserAISettings>({
    timeout: 60000,
    retryCount: 3,
    streamingEnabled: true,
    autoSave: true,
  });

  const { data: serverConfig } = useAIConfig();
  const saveConfigMutation = useSaveAIConfig();

  // Инициализация из серверной конфигурации
  useEffect(() => {
    if (serverConfig) {
      setModelConfigs(serverConfig.models || []);
      setGlobalSettings(serverConfig.settings);
    }
  }, [serverConfig]);

  // Сохранение конфигурации на сервере (и локально как fallback)
  const saveModelConfigs = (configs: ModelConfig[]) => {
    setModelConfigs(configs);
    try {
      localStorage.setItem('aiModelConfigs', JSON.stringify(configs));
    } catch {
      // ignore localStorage errors
    }

    saveConfigMutation.mutate({
      settings: globalSettings,
      models: configs,
    });
  };

  const handleSave = async (provider: AiProvider) => {
    const apiKeyInput = apiKeyInputs[provider] || '';
    
    if (!apiKeyInput.trim()) {
      toast.error(t('providers.enterApiKey'));
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        provider,
        apiKey: apiKeyInput,
      });
      setEditingProvider(null);
      setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
      toast.success(t('notifications.keySaved', { provider: PROVIDERS.find(p => p.id === provider)?.name }));
    } catch {
      toast.error(t('notifications.keySaveError'));
    }
  };

  const handleDelete = async (provider: AiProvider) => {
    openConfirmation(
      t('notifications.deleteKeyConfirm', { provider: PROVIDERS.find(p => p.id === provider)?.name }),
      '',
      async () => {
        try {
          await deleteMutation.mutateAsync(provider);
          toast.success(t('notifications.keyDeleted', { provider: PROVIDERS.find(p => p.id === provider)?.name }));
        } catch {
          toast.error(t('notifications.keyDeleteError'));
        }
      }
    );
  };

  const handleTest = async (provider: AiProvider) => {
    try {
      const result = await testMutation.mutateAsync(provider);
      toast.success(`✅ ${result.message}`);
    } catch {
      toast.error(t('notifications.connectionTestError'));
    }
  };

  const cancelEdit = (provider: AiProvider) => {
    setEditingProvider(null);
    setApiKeyInputs(prev => ({ ...prev, [provider]: '' }));
  };

  const getKeyStatus = (provider: AiProvider) => {
    const key = apiKeys?.find((k) => k.provider === provider);
    return key?.status || 'not_configured';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t('providers.active');
      case 'error':
        return t('providers.error');
      default:
        return t('providers.notConfigured');
    }
  };

  const togglePasswordVisibility = (provider: AiProvider) => {
    setShowPassword(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  // Model configuration handlers
  const handleAddModelConfig = () => {
    if (!newModelConfig.provider || !newModelConfig.modelId || !newModelConfig.customName.trim()) {
      toast.error(t('notifications.selectProviderAndModel'));
      return;
    }

    const selectedModel = PROVIDER_MODELS[newModelConfig.provider as AiProvider]?.find(m => m.id === newModelConfig.modelId);
    if (!selectedModel) {
      toast.error(t('notifications.selectProviderAndModel'));
      return;
    }

    const newConfig: ModelConfig = {
      id: `${Date.now()}-${Math.random()}`,
      provider: newModelConfig.provider as AiProvider,
      modelId: newModelConfig.modelId,
      modelName: selectedModel.name,
      customName: newModelConfig.customName,
      temperature: newModelConfig.temperature,
      maxTokens: newModelConfig.maxTokens,
      isDefault: newModelConfig.isDefault || modelConfigs.length === 0,
    };

    // If setting as default, unset other defaults
    let updatedConfigs = modelConfigs;
    if (newConfig.isDefault) {
      updatedConfigs = modelConfigs.map(c => ({ ...c, isDefault: false }));
    }

    saveModelConfigs([...updatedConfigs, newConfig]);
    toast.success(t('notifications.configAdded'));

    // Reset form
    setNewModelConfig({
      provider: '',
      modelId: '',
      customName: '',
      temperature: 0.7,
      maxTokens: 4000,
      isDefault: false,
    });
  };

  const handleRemoveModelConfig = (configId: string) => {
    const config = modelConfigs.find(c => c.id === configId);
    if (!config) return;

    openConfirmation(
      t('notifications.deleteConfigConfirm', { name: config.customName }),
      '',
      () => {
        saveModelConfigs(modelConfigs.filter(c => c.id !== configId));
        toast.success(t('notifications.configDeleted'));
      }
    );
  };

  const handleSetDefaultModel = (configId: string) => {
    const updated = modelConfigs.map((c) => ({
      ...c,
      isDefault: c.id === configId,
    }));
    saveModelConfigs(updated);
    toast.success(t('notifications.defaultModelSet'));
  };

  const handleSaveSettings = () => {
    saveConfigMutation.mutate(
      {
        settings: globalSettings,
        models: modelConfigs,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.settingsSaved'));
        },
        onError: () => {
          toast.error(t('notifications.modelsUpdateError'));
        },
      }
    );
  };

  if (!isOpen) return null;

  // Render Providers Tab
  const renderProvidersTab = () => (
    <div className="space-y-4">
      {PROVIDERS.map((provider) => {
        const status = getKeyStatus(provider.id);
        const isEditing = editingProvider === provider.id;
        const isConfigured = status !== 'not_configured';

        return (
          <div
            key={provider.id}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {provider.name}
                  </h3>
                  <p className={`text-sm ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {isConfigured && !isEditing && (
                  <>
                    <button
                      onClick={() => handleTest(provider.id)}
                      disabled={testMutation.isPending}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t('providers.test')}
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {t('providers.delete')}
                    </button>
                  </>
                )}
              </div>
            </div>

            {!isConfigured || isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type={showPassword[provider.id] ? 'text' : 'password'}
                    value={apiKeyInputs[provider.id] || ''}
                    onChange={(e) => setApiKeyInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                    placeholder={provider.placeholder}
                    className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono text-sm"
                  />
                  <button
                    onClick={() => togglePasswordVisibility(provider.id)}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword[provider.id] ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {t(`providers.getKeyHints.${provider.id}`)}
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleSave(provider.id)}
                    disabled={upsertMutation.isPending}
                    className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    {upsertMutation.isPending 
                      ? t('providers.checkingKey') 
                      : t('providers.saveAndCheck')
                    }
                  </button>
                  {isEditing && (
                    <button
                      onClick={() => cancelEdit(provider.id)}
                      className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      {t('providers.cancel')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {t('providers.keyConfigured')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Models Tab
  const renderModelsTab = () => {
    const configuredProviders = PROVIDERS.filter(
      p => getKeyStatus(p.id) === 'active'
    );
    
    return (
      <div className="space-y-6">
        {configuredProviders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{t('models.noProvidersTitle')}</p>
          </div>
        ) : (
          <>
            {/* Форма добавления новой конфигурации */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {t('models.addConfigTitle')}
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('models.provider')}</label>
                  <select
                    value={newModelConfig.provider}
                    onChange={(e) => setNewModelConfig(prev => ({ 
                      ...prev, 
                      provider: e.target.value as AiProvider,
                      modelId: '' 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">{t('models.selectProvider')}</option>
                    {configuredProviders.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('models.model')}</label>
                  <select
                    value={newModelConfig.modelId}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, modelId: e.target.value }))}
                    disabled={!newModelConfig.provider}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">{t('models.selectModel')}</option>
                    {newModelConfig.provider && PROVIDER_MODELS[newModelConfig.provider as AiProvider]?.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.contextLength} {t('models.tokens')})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('models.configName')}</label>
                  <input
                    type="text"
                    value={newModelConfig.customName}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, customName: e.target.value }))}
                    placeholder={t('models.configNamePlaceholder')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t('models.temperature')}: {newModelConfig.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={newModelConfig.temperature}
                    onChange={(e) => setNewModelConfig(prev => ({ 
                      ...prev, 
                      temperature: parseFloat(e.target.value) 
                    }))}
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('models.maxTokens')}</label>
                  <input
                    type="number"
                    value={newModelConfig.maxTokens}
                    onChange={(e) => setNewModelConfig(prev => ({ 
                      ...prev, 
                      maxTokens: parseInt(e.target.value) || 0 
                    }))}
                    min="100"
                    max="128000"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newModelConfig.isDefault}
                      onChange={(e) => setNewModelConfig(prev => ({ 
                        ...prev, 
                        isDefault: e.target.checked 
                      }))}
                      className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                    />
                    {t('models.setAsDefault')}
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleAddModelConfig}
                disabled={!newModelConfig.provider || !newModelConfig.modelId || !newModelConfig.customName}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('models.addConfig')}
              </button>
            </div>
            
            {/* Список настроенных моделей */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">
                {t('models.configuredModels')}
              </h3>
              
              {modelConfigs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
                  {t('models.noConfiguredModels')}
                </div>
              ) : (
                modelConfigs.map(model => (
                  <div key={model.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{model.customName}</h4>
                        {model.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-purple-900 text-purple-300 rounded-full">
                            {t('models.default')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {PROVIDERS.find(p => p.id === model.provider)?.name} • {model.modelName} • 
                        {t('models.temperature')}: {model.temperature} • {t('models.maxTokens')}: {model.maxTokens}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!model.isDefault && (
                        <button
                          onClick={() => handleSetDefaultModel(model.id)}
                          className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                          title={t('models.setAsDefault')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveModelConfig(model.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title={t('models.deleteConfig')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  // Render Settings Tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('settings.globalTitle')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('settings.requestTimeout')}
            </label>
            <input
              type="number"
              value={globalSettings.timeout}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  timeout: parseInt(e.target.value || '0', 10),
                }))
              }
              min="10000"
              max="600000"
              step="1000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {t('settings.timeoutHint')}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('settings.retryCount')}
            </label>
            <input
              type="number"
              value={globalSettings.retryCount}
              onChange={(e) =>
                setGlobalSettings((prev) => ({
                  ...prev,
                  retryCount: parseInt(e.target.value || '0', 10),
                }))
              }
              min="0"
              max="10"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.streamingEnabled}
                onChange={(e) =>
                  setGlobalSettings((prev) => ({
                    ...prev,
                    streamingEnabled: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">
                  {t('settings.streamingEnabled')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('settings.streamingHint')}
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.autoSave}
                onChange={(e) =>
                  setGlobalSettings((prev) => ({
                    ...prev,
                    autoSave: e.target.checked,
                  }))
                }
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">
                  {t('settings.autoSave')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('settings.autoSaveHint')}
                </div>
              </div>
            </label>
          </div>
          
          <button
            onClick={handleSaveSettings}
            disabled={saveConfigMutation.isPending}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {t('settings.saveSettings')}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('settings.statsTitle')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">
              {t('settings.configuredProviders')}
            </div>
            <div className="text-xl font-semibold text-white">
              {apiKeys?.filter(k => k.status === 'active').length || 0} / {PROVIDERS.length}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400">
              {t('settings.configuredModels')}
            </div>
            <div className="text-xl font-semibold text-white">
              {modelConfigs.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">
              {t('title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'providers' as const, label: t('tabs.providers'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'models' as const, label: t('tabs.models'), icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
            { id: 'settings' as const, label: t('tabs.settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-8 h-8 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <>
              {activeTab === 'providers' && renderProvidersTab()}
              {activeTab === 'models' && renderModelsTab()}
              {activeTab === 'settings' && renderSettingsTab()}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
