import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useSendMessage, AIResponse } from '../hooks/useAI';
import { useAIConfig } from '../hooks/useAIConfig';

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export default function AIResponseModal({
  isOpen,
  onClose,
  initialPrompt = '',
}: AIResponseModalProps) {
  const { t } = useTranslation('common');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [response, setResponse] = useState<AIResponse | null>(null);

  const { data: aiConfig } = useAIConfig();
  const sendMutation = useSendMessage();

  // Auto-select default model config on open
  useEffect(() => {
    if (isOpen && aiConfig?.models && aiConfig.models.length > 0) {
      const defaultModel = aiConfig.models.find(m => m.isDefault);
      const modelToSelect = defaultModel || aiConfig.models[0];
      
      if (modelToSelect && !selectedConfigId) {
        setSelectedConfigId(modelToSelect.id);
        setTemperature(modelToSelect.temperature);
        setMaxTokens(modelToSelect.maxTokens);
      }
    }
  }, [isOpen, aiConfig, selectedConfigId]);

  // Get selected model config
  const selectedModelConfig = aiConfig?.models?.find(m => m.id === selectedConfigId);

  const handleSend = async () => {
    if (!selectedModelConfig || !prompt.trim()) {
      toast.error(t('messages.selectModelAndPrompt', 'Please select a model and enter a prompt'));
      return;
    }

    try {
      const timeout = aiConfig?.settings?.timeout || 60000;
      
      const result = await sendMutation.mutateAsync({
        provider: selectedModelConfig.provider,
        model: selectedModelConfig.modelId,
        prompt,
        systemPrompt: systemPrompt || undefined,
        temperature,
        maxTokens,
        timeout,
      });

      setResponse(result);
      
      // Save last used model config to localStorage
      localStorage.setItem('lastUsedAIModelConfig', selectedConfigId);
    } catch {
      toast.error(t('messages.failedToSend', 'Failed to send message'));
    }
  };
  
  const handleConfigChange = (configId: string) => {
    setSelectedConfigId(configId);
    const config = aiConfig?.models?.find(m => m.id === configId);
    if (config) {
      setTemperature(config.temperature);
      setMaxTokens(config.maxTokens);
    }
  };

  const handleCopyResponse = async () => {
    if (response?.content) {
      await navigator.clipboard.writeText(response.content);
      toast.success(t('messages.copiedToClipboard', 'Copied to clipboard!'));
    }
  };

  const handleCopyPrompt = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt);
      toast.success(t('messages.copiedToClipboard', 'Copied to clipboard!'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 md:p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[95vh] md:h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-800">
          <h2 className="text-xl md:text-2xl font-bold text-white">
            🤖 {t('labels.aiAssistant', 'AI Assistant')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Prompt Input */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-gray-800 flex flex-col p-3 md:p-4">
            <h3 className="text-base md:text-lg font-semibold text-white mb-3 md:mb-4">
              {t('labels.prompt', 'Prompt')}
            </h3>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('labels.model', 'Model')}
              </label>
              <select
                value={selectedConfigId}
                onChange={(e) => handleConfigChange(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                disabled={!aiConfig?.models || aiConfig.models.length === 0}
              >
                <option value="">{t('labels.selectModel', 'Select a model...')}</option>
                {aiConfig?.models?.map((config) => (
                  <option key={config.id} value={config.id}>
                    {config.customName} ({config.provider.toUpperCase()} - {config.modelName})
                    {config.isDefault ? ' ★' : ''}
                  </option>
                ))}
              </select>
              {(!aiConfig?.models || aiConfig.models.length === 0) && (
                <p className="text-xs text-yellow-400 mt-1">
                  {t('messages.configureModelsFirst', 'Configure models in AI Settings first')}
                </p>
              )}
            </div>

            {/* System Prompt */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('labels.systemPrompt', 'System Prompt')} ({t('labels.optional', 'optional')})
              </label>
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full h-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                placeholder={t('labels.systemPromptPlaceholder', 'You are a helpful assistant...')}
              />
            </div>

            {/* Temperature */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('labels.temperature', 'Temperature')}: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Max Tokens */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('labels.maxTokens', 'Max Tokens')}
              </label>
              <input
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
                min="100"
                max="128000"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Prompt Input */}
            <div className="flex-1 flex flex-col mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  {t('labels.yourPrompt', 'Your Prompt')}
                </label>
                <button
                  onClick={handleCopyPrompt}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  📋 {t('buttons.copy')}
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none font-mono text-sm"
                placeholder={t('labels.enterPrompt', 'Enter your prompt here...')}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSend}
              disabled={sendMutation.isPending || !selectedConfigId || !prompt}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 font-semibold"
            >
              {sendMutation.isPending
                ? t('buttons.sending', 'Sending...')
                : t('buttons.send', 'Send')}
            </button>
          </div>

          {/* Right: Response */}
          <div className="w-full md:w-1/2 flex flex-col p-3 md:p-4">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <h3 className="text-base md:text-lg font-semibold text-white">
                {t('labels.response', 'Response')}
              </h3>
              {response && (
                <button
                  onClick={handleCopyResponse}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  📋 {t('buttons.copy')}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {sendMutation.isPending ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-4xl mb-4 animate-pulse">🤔</div>
                    <p className="text-gray-400">{t('messages.thinking', 'Thinking...')}</p>
                  </div>
                </div>
              ) : response ? (
                <div>
                  {response.error ? (
                    <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                      <p className="text-red-400">{response.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="bg-gray-800 rounded-lg p-4 mb-4">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                          {response.content}
                        </pre>
                      </div>

                      {/* Usage Stats */}
                      {response.usage && (
                        <div className="text-xs text-gray-400 space-y-1">
                          <div>Model: {response.model}</div>
                          <div>Provider: {response.provider}</div>
                          <div>
                            Tokens: {response.usage.promptTokens?.toLocaleString()} prompt +{' '}
                            {response.usage.completionTokens?.toLocaleString()} completion ={' '}
                            {response.usage.totalTokens?.toLocaleString()} total
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-400">
                    <div className="text-6xl mb-4">💬</div>
                    <p>{t('messages.noResponse', 'No response yet')}</p>
                    <p className="text-sm mt-2">
                      {t('messages.sendPromptHint', 'Select a model and send a prompt')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

