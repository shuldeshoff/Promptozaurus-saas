import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useSendMessage, AIResponse } from '../hooks/useAI';
import { useAIConfig } from '../hooks/useAIConfig';
import { useEditor } from '../context/EditorContext';
import { useProjectUpdate } from '../hooks/useProjectUpdate';
import type { ContextBlock } from '@promptozaurus/shared';

interface AIResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

type ModalPhase = 'INITIAL' | 'SENDING' | 'RECEIVED';

export default function AIResponseModal({
  isOpen,
  onClose,
  initialPrompt = '',
}: AIResponseModalProps) {
  const { t } = useTranslation('common');
  const { currentProject, setActiveTab, setActiveContextBlock } = useEditor();
  const { updateProjectAndRefresh } = useProjectUpdate();
  
  const [phase, setPhase] = useState<ModalPhase>('INITIAL');
  const [selectedConfigId, setSelectedConfigId] = useState<string>('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4000);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);
  const [newBlockTitle, setNewBlockTitle] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);

  const { data: aiConfig } = useAIConfig();
  const sendMutation = useSendMessage();
  
  const contextBlocks = currentProject?.data?.contextBlocks || [];

  // Reset phase when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPhase('INITIAL');
      setResponse(null);
      setShowSaveOptions(false);
    }
  }, [isOpen]);

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
    if (!selectedModelConfig || !initialPrompt.trim()) {
      toast.error(t('messages.selectModelAndPrompt', 'Please select a model'));
      return;
    }

    setPhase('SENDING');

    try {
      const timeout = aiConfig?.settings?.timeout || 60000;
      
      const result = await sendMutation.mutateAsync({
        provider: selectedModelConfig.provider,
        model: selectedModelConfig.modelId,
        prompt: initialPrompt,
        systemPrompt: undefined,
        temperature,
        maxTokens,
        timeout,
      });

      setResponse(result);
      setPhase('RECEIVED');
      
      // Save last used model config to localStorage
      localStorage.setItem('lastUsedAIModelConfig', selectedConfigId);
    } catch (error) {
      toast.error(t('messages.failedToSend', 'Failed to send message'));
      setPhase('INITIAL');
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

  const handleRegenerate = () => {
    setPhase('INITIAL');
    setResponse(null);
    setShowSaveOptions(false);
  };

  // Save response to new context block
  const handleSaveAsNewBlock = async () => {
    if (!response?.content || !currentProject) return;
    
    const blockTitle = newBlockTitle.trim() || `Ответ ИИ: Prompt1`;
    
    try {
      const newBlockId = Math.max(0, ...contextBlocks.map(b => b.id)) + 1;
      
      const newBlock: ContextBlock = {
        id: newBlockId,
        title: blockTitle,
        items: [
          {
            id: 1,
            title: 'AI Response',
            content: response.content,
            chars: response.content.length,
            subItems: [],
          },
        ],
      };

      const updatedContextBlocks = [...contextBlocks, newBlock];

      await updateProjectAndRefresh({
        ...currentProject.data,
        contextBlocks: updatedContextBlocks,
      });

      toast.success(`Ответ сохранён в новый блок "${blockTitle}"`);
      setActiveTab('context');
      setTimeout(() => setActiveContextBlock(newBlockId), 200);
      onClose();
      setShowSaveOptions(false);
      setNewBlockTitle('');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    }
  };

  // Save response to existing context block
  const handleSaveToExistingBlock = async () => {
    if (!response?.content || !currentProject || !selectedBlockId) return;
    
    const targetBlock = contextBlocks.find(b => b.id === selectedBlockId);
    if (!targetBlock) {
      toast.error('Блок не найден');
      return;
    }

    try {
      const newItemId = Math.max(0, ...targetBlock.items.map(item => item.id)) + 1;

      const updatedContextBlocks = contextBlocks.map(block => {
        if (block.id === selectedBlockId) {
          return {
            ...block,
            items: [
              ...block.items,
              {
                id: newItemId,
                title: 'AI Response',
                content: response.content,
                chars: response.content.length,
                subItems: [],
              },
            ],
          };
        }
        return block;
      });

      await updateProjectAndRefresh({
        ...currentProject.data,
        contextBlocks: updatedContextBlocks,
      });

      toast.success(`Ответ добавлен в блок "${targetBlock.title}"`);
      setActiveTab('context');
      setTimeout(() => setActiveContextBlock(selectedBlockId), 200);
      onClose();
      setShowSaveOptions(false);
      setSelectedBlockId(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Ошибка сохранения');
    }
  };

  if (!isOpen) return null;

  // PHASE 1: INITIAL - Model selection
  if (phase === 'INITIAL') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-2xl flex flex-col border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <h2 className="text-xl font-bold text-white">
              Взаимодействие с ИИ
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors text-2xl"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">
              Выберите модель для генерации
            </h3>

            {(!aiConfig?.models || aiConfig.models.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  Нет настроенных моделей ИИ
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Закрыть и настроить
                </button>
              </div>
            ) : (
              <>
                {/* Model Selection Cards */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {aiConfig.models.map((config) => (
                    <div
                      key={config.id}
                      onClick={() => handleConfigChange(config.id)}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedConfigId === config.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-white">
                              {config.customName}
                            </h4>
                            {config.isDefault && (
                              <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">
                                По умолчанию
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mb-2">
                            {config.provider.toUpperCase()} • {config.modelName}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Температура: {config.temperature}</span>
                            <span>Макс. токенов: {config.maxTokens}</span>
                          </div>
                        </div>
                        <div>
                          {selectedConfigId === config.id && (
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Temperature & Max Tokens Override */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Температура: {temperature}
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

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Макс. токенов
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
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSend}
                    disabled={!selectedConfigId}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    Сгенерировать ответ
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Отмена
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // PHASE 2: SENDING - Loading state
  if (phase === 'SENDING') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-gray-900 rounded-lg w-full max-w-2xl flex flex-col border border-gray-800 p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 border-r-2 border-blue-500 border-b-2 border-transparent mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Генерация ответа...
            </h3>
            <p className="text-gray-400">
              {selectedModelConfig?.customName} ({selectedModelConfig?.provider})
            </p>
            <p className="text-sm text-gray-500 mt-4">
              {initialPrompt.length} символов • {maxTokens} макс. токенов
            </p>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 3: RECEIVED - Show response
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-green-500">●</span>
            <span className="font-semibold text-white">
              {selectedModelConfig?.customName || 'openai/gpt-4.1-nano'}
            </span>
            <span className="text-xs text-gray-400">
              {response?.usage?.totalTokens?.toLocaleString()} токенов • 3 сек
            </span>
            <span className="text-xs bg-green-700 text-white px-2 py-0.5 rounded">
              ✓ Завершено
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Response Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {response?.error ? (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <p className="text-red-400">{response.error}</p>
            </div>
          ) : (
            <div className="bg-gray-800 rounded-lg p-4">
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-sans">
                {response?.content}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-800 p-4">
          {!showSaveOptions ? (
            <div className="flex gap-3">
              <button
                onClick={handleCopyResponse}
                className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Копировать
              </button>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Перегенерировать
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Закрыть
              </button>
              <button
                onClick={() => setShowSaveOptions(true)}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-semibold"
              >
                ✓ Сохранить
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-white">Сохранить ответ как:</h4>
                <button
                  onClick={() => setShowSaveOptions(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>

              {/* Radio: New block */}
              <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <input
                  type="radio"
                  name="saveOption"
                  id="newBlock"
                  checked={!selectedBlockId}
                  onChange={() => setSelectedBlockId(null)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="newBlock" className="block text-white mb-2 cursor-pointer">
                    Новый блок контекста:
                  </label>
                  <input
                    type="text"
                    value={newBlockTitle}
                    onChange={(e) => setNewBlockTitle(e.target.value)}
                    placeholder="Ответ ИИ: Prompt1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Radio: Existing block */}
              <div className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <input
                  type="radio"
                  name="saveOption"
                  id="existingBlock"
                  checked={!!selectedBlockId}
                  onChange={() => {
                    if (contextBlocks.length > 0) {
                      setSelectedBlockId(contextBlocks[0].id);
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="existingBlock" className="block text-white mb-2 cursor-pointer">
                    В существующий блок:
                  </label>
                  <select
                    value={selectedBlockId || ''}
                    onChange={(e) => setSelectedBlockId(Number(e.target.value))}
                    disabled={!selectedBlockId && contextBlocks.length === 0}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  >
                    <option value="">Выберите блок контекста</option>
                    {contextBlocks.map((block) => (
                      <option key={block.id} value={block.id}>
                        {block.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Save buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveOptions(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={selectedBlockId ? handleSaveToExistingBlock : handleSaveAsNewBlock}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold"
                >
                  ✓ Сохранить
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
