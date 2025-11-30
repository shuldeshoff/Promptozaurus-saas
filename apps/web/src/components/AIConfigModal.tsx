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
import { useConfirmation } from '../context/ConfirmationContext';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export default function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const { t } = useTranslation(['common', 'aiConfig']);
  const { openConfirmation } = useConfirmation();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'providers' | 'models' | 'settings'>('providers');
  
  // State for providers
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showPassword, setShowPassword] = useState<Record<AiProvider, boolean>>({} as any);

  const { data: apiKeys, isLoading } = useApiKeys();
  const upsertMutation = useUpsertApiKey();
  const deleteMutation = useDeleteApiKey();
  const testMutation = useTestApiKey();

  const handleSave = async () => {
    if (!editingProvider || !apiKeyInput.trim()) {
      toast.error(t('common:messages.fillAllFields', 'Please fill all fields'));
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        provider: editingProvider,
        apiKey: apiKeyInput,
      });
      setEditingProvider(null);
      setApiKeyInput('');
      toast.success(t('common:messages.apiKeySaved', 'API key saved successfully'));
    } catch {
      toast.error(t('common:messages.failedToSave', 'Failed to save API key'));
    }
  };

  const handleDelete = async (provider: AiProvider) => {
    openConfirmation(
      t('common:messages.confirmDelete', 'Confirm deletion'),
      t('common:messages.confirmDeleteApiKey', 'Delete API key for this provider?'),
      async () => {
        try {
          await deleteMutation.mutateAsync(provider);
          toast.success(t('common:messages.apiKeyDeleted', 'API key deleted'));
        } catch {
          toast.error(t('common:messages.failedToDelete', 'Failed to delete API key'));
        }
      }
    );
  };

  const handleTest = async (provider: AiProvider) => {
    try {
      const result = await testMutation.mutateAsync(provider);
      toast.success(`✅ ${result.message}`);
    } catch {
      toast.error(t('common:messages.testFailed', 'API key test failed'));
    }
  };

  const startEdit = (provider: AiProvider) => {
    setEditingProvider(provider);
    setApiKeyInput('');
  };

  const cancelEdit = () => {
    setEditingProvider(null);
    setApiKeyInput('');
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
        return t('common:labels.active', 'Active');
      case 'error':
        return t('common:labels.error', 'Error');
      default:
        return t('common:labels.notConfigured', 'Not Configured');
    }
  };

  const togglePasswordVisibility = (provider: AiProvider) => {
    setShowPassword(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
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
                      className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {t('common:buttons.test', 'Test')}
                    </button>
                    <button
                      onClick={() => handleDelete(provider.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                    >
                      {t('common:buttons.delete')}
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
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
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
                  {t(`aiConfig:providers.getKeyHints.${provider.id}`, `Get key on ${provider.name} console`)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={upsertMutation.isPending}
                    className="flex-1 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t('common:buttons.save')}
                  </button>
                  {isEditing && (
                    <button
                      onClick={cancelEdit}
                      className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      {t('common:buttons.cancel')}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {t('aiConfig:providers.keyConfigured', 'API key configured and ready to use')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Render Models Tab
  const renderModelsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('aiConfig:models.addConfigTitle', 'Add Model Configuration')}
        </h3>
        <div className="text-center py-8 text-gray-400">
          <p>{t('aiConfig:models.comingSoon', 'Model configuration coming soon')}</p>
        </div>
      </div>
    </div>
  );

  // Render Settings Tab
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('aiConfig:settings.globalTitle', 'Global Settings')}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('aiConfig:settings.requestTimeout', 'Request Timeout (ms)')}
            </label>
            <input
              type="number"
              defaultValue={60000}
              min="10000"
              max="600000"
              step="1000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {t('aiConfig:settings.timeoutHint', 'Maximum time to wait for AI response (10-600 seconds)')}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('aiConfig:settings.retryCount', 'Retry Count on Error')}
            </label>
            <input
              type="number"
              defaultValue={3}
              min="0"
              max="10"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
            />
          </div>
          
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">
                  {t('aiConfig:settings.streamingEnabled', 'Streaming Response')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('aiConfig:settings.streamingHint', 'Show AI response as it is generated (if supported by model)')}
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">
                  {t('aiConfig:settings.autoSave', 'Auto-save Responses')}
                </div>
                <div className="text-xs text-gray-500">
                  {t('aiConfig:settings.autoSaveHint', 'Automatically save AI responses to context')}
                </div>
              </div>
            </label>
          </div>
          
          <button
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            {t('aiConfig:settings.saveSettings', 'Save Settings')}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t('aiConfig:settings.statsTitle', 'Usage Statistics')}
        </h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">
              {t('aiConfig:settings.configuredProviders', 'Configured Providers')}
            </div>
            <div className="text-xl font-semibold text-white">
              {apiKeys?.filter(k => k.status === 'active').length || 0} / {PROVIDERS.length}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400">
              {t('aiConfig:settings.configuredModels', 'Configured Models')}
            </div>
            <div className="text-xl font-semibold text-white">
              0
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
              {t('aiConfig:title', 'AI Parameters')}
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
            { id: 'providers' as const, label: t('aiConfig:tabs.providers', 'Providers'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'models' as const, label: t('aiConfig:tabs.models', 'Models'), icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
            { id: 'settings' as const, label: t('aiConfig:tabs.settings', 'Settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
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
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          >
            {t('aiConfig:close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
