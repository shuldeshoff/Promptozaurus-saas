import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AiProvider } from '@promptozaurus/shared';
import {
  useApiKeys,
  useUpsertApiKey,
  useDeleteApiKey,
  useTestApiKey,
} from '../hooks/useApiKeys';

interface AIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROVIDERS: Array<{
  id: AiProvider;
  name: string;
  icon: string;
  placeholder: string;
}> = [
  {
    id: 'openai',
    name: 'OpenAI',
    icon: '🤖',
    placeholder: 'sk-...',
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    icon: '🧠',
    placeholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    icon: '✨',
    placeholder: 'AI...',
  },
  {
    id: 'grok',
    name: 'Grok (X.AI)',
    icon: '🚀',
    placeholder: 'xai-...',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    icon: '🔀',
    placeholder: 'sk-or-...',
  },
];

export default function AIConfigModal({ isOpen, onClose }: AIConfigModalProps) {
  const { t } = useTranslation('common');
  const [editingProvider, setEditingProvider] = useState<AiProvider | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const { data: apiKeys, isLoading } = useApiKeys();
  const upsertMutation = useUpsertApiKey();
  const deleteMutation = useDeleteApiKey();
  const testMutation = useTestApiKey();

  const handleSave = async () => {
    if (!editingProvider || !apiKeyInput.trim()) {
      alert(t('messages.fillAllFields', 'Please fill all fields'));
      return;
    }

    try {
      await upsertMutation.mutateAsync({
        provider: editingProvider,
        apiKey: apiKeyInput,
      });
      setEditingProvider(null);
      setApiKeyInput('');
    } catch {
      alert(t('messages.failedToSave', 'Failed to save API key'));
    }
  };

  const handleDelete = async (provider: AiProvider) => {
    if (!confirm(t('messages.confirmDelete', 'Are you sure you want to delete?'))) return;

    try {
      await deleteMutation.mutateAsync(provider);
    } catch {
      alert(t('messages.failedToDelete', 'Failed to delete API key'));
    }
  };

  const handleTest = async (provider: AiProvider) => {
    try {
      const result = await testMutation.mutateAsync(provider);
      alert(`✅ ${result.message}`);
    } catch {
      alert(t('messages.testFailed', 'API key test failed'));
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
        return t('labels.active', 'Active');
      case 'error':
        return t('labels.error', 'Error');
      default:
        return t('labels.notConfigured', 'Not Configured');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            🔑 {t('labels.aiApiKeys', 'AI API Keys')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center text-gray-400">{t('messages.loading')}</div>
          ) : (
            <div className="space-y-4">
              {PROVIDERS.map((provider) => {
                const status = getKeyStatus(provider.id);
                const isEditing = editingProvider === provider.id;

                return (
                  <div
                    key={provider.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {provider.name}
                          </h3>
                          <p
                            className={`text-sm ${getStatusColor(status)}`}
                          >
                            {getStatusText(status)}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {status !== 'not_configured' && !isEditing && (
                          <>
                            <button
                              onClick={() => handleTest(provider.id)}
                              disabled={testMutation.isPending}
                              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                            >
                              {t('buttons.test', 'Test')}
                            </button>
                            <button
                              onClick={() => startEdit(provider.id)}
                              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                            >
                              {t('buttons.edit')}
                            </button>
                            <button
                              onClick={() => handleDelete(provider.id)}
                              disabled={deleteMutation.isPending}
                              className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                            >
                              {t('buttons.delete')}
                            </button>
                          </>
                        )}
                        {status === 'not_configured' && !isEditing && (
                          <button
                            onClick={() => startEdit(provider.id)}
                            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                          >
                            {t('buttons.add', 'Add')}
                          </button>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div className="space-y-3">
                        <input
                          type="password"
                          value={apiKeyInput}
                          onChange={(e) => setApiKeyInput(e.target.value)}
                          placeholder={provider.placeholder}
                          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 font-mono text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={upsertMutation.isPending}
                            className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {t('buttons.save')}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                          >
                            {t('buttons.cancel')}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400 text-center">
            {t(
              'messages.apiKeysInfo',
              'Your API keys are encrypted and stored securely on our servers.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

