// src/components/ui/AIResponseModal.js - Модальное окно для взаимодействия с ИИ
// @description: Полнофункциональное модальное окно с реальными API вызовами к ИИ, редактированием ответа и сохранением
// @created: 2025-06-25 - реализация workflow запрос → ожидание → ответ → редактирование → сохранение

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import AIService from '../../services/AIService';

const AIResponseModal = ({ 
  isOpen, 
  onClose, 
  promptContent, 
  promptTitle 
}) => {
  const { t } = useTranslation();
  const { state, actions } = useApp();
  const textareaRef = useRef(null);
  
  // Основное состояние модального окна
  const [modalState, setModalState] = useState({
    phase: 'INITIAL', // INITIAL | SENDING | RECEIVING | RECEIVED | EDITING | SAVING
    response: '',
    responseMetadata: {
      model: '',
      tokensUsed: 0,
      timestamp: null,
      duration: 0,
      charactersTyped: 0
    },
    saveOptions: {
      asNewContext: true,
      targetBlockId: null,
      newBlockTitle: '',
      splitIntoSections: false
    },
    error: null,
    hasChanges: false,
    streamingText: '',
    selectedModelId: null // ID выбранной модели
  });
  
  // Проверяем наличие настроенных моделей
  const hasConfiguredModels = state.aiConfig.selectedModels.length > 0;
  const currentModel = state.aiConfig.selectedModels.find(
    model => model.id === modalState.selectedModelId
  );
  
  // Получаем последнюю использованную модель из localStorage
  const lastUsedModelId = localStorage.getItem('lastUsedAIModel') || state.aiConfig.currentModelId;
  
  // Отсортированный список моделей (последняя использованная сверху)
  const sortedModels = useMemo(() => {
    if (!state.aiConfig.selectedModels || state.aiConfig.selectedModels.length === 0) {
      return [];
    }
    
    const models = [...state.aiConfig.selectedModels];
    
    // Сортируем: последняя использованная модель сверху
    models.sort((a, b) => {
      if (a.id === lastUsedModelId) return -1;
      if (b.id === lastUsedModelId) return 1;
      return 0;
    });
    
    return models;
  }, [state.aiConfig.selectedModels, lastUsedModelId]);
  
  // Маппинг провайдеров для отображения
  const providerNames = {
    openai: 'OpenAI',
    anthropic: 'Anthropic',
    openrouter: 'OpenRouter',
    gemini: 'Google Gemini',
    grok: 'X.AI Grok'
  };
  
  // Симуляция задержки
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Обработчик выбора модели и генерации
  const handleGenerateWithModel = async (modelId) => {
    // Сохраняем выбранную модель
    setModalState(prev => ({ ...prev, selectedModelId: modelId }));
    localStorage.setItem('lastUsedAIModel', modelId);
    
    // Запускаем генерацию с реальным API, передавая modelId напрямую
    await sendRealAIRequest(modelId);
  };
  
  // Обработчик перегенерации ответа
  const handleRegenerate = async () => {
    if (!modalState.selectedModelId) {
      actions.showNotification(t('ai.modal.error.noModelForRegenerate'), 'warning');
      return;
    }
    
    // Показываем уведомление о перегенерации
    actions.showNotification(`${t('ai.modal.notifications.regenerating')} ${currentModel?.customName || ''}`, 'info');
    
    // Сбрасываем предыдущий ответ и запускаем новую генерацию
    setModalState(prev => ({
      ...prev,
      response: '',
      hasChanges: false,
      error: null,
      responseMetadata: {
        ...prev.responseMetadata,
        tokensUsed: 0,
        duration: 0,
        charactersTyped: 0
      }
    }));
    
    // Запускаем перегенерацию с той же моделью
    await sendRealAIRequest();
  };
  
  // Реальный запрос к ИИ
  const sendRealAIRequest = async (modelIdParam) => {
    const startTime = Date.now();
    
    // Используем переданный modelId или берем из состояния
    const modelId = modelIdParam || modalState.selectedModelId;
    const model = state.aiConfig.selectedModels.find(m => m.id === modelId);
    
    if (!modelId || !model) {
      setModalState(prev => ({
        ...prev,
        phase: 'INITIAL',
        error: t('ai.modal.error.noModel')
      }));
      return;
    }
    
    // Фаза отправки
    setModalState(prev => ({
      ...prev,
      phase: 'SENDING',
      error: null,
      responseMetadata: {
        ...prev.responseMetadata,
        model: model.customName || model.modelId,
        timestamp: new Date().toISOString()
      }
    }));
    
    try {
      // Подготавливаем запрос
      const requestOptions = {
        temperature: model.temperature,
        maxTokens: model.maxTokens,
        stream: false, // Временно отключаем streaming для простоты
        systemPrompt: '' // Можно добавить системный промпт при необходимости
      };
      
      // Отправляем запрос
      const result = await AIService.sendRequest(promptContent, model, requestOptions);
      
      console.log('Результат от AIService:', result);
      
      if (result.success) {
        const endTime = Date.now();
        const duration = Math.floor((endTime - startTime) / 1000);
        
        setModalState(prev => ({
          ...prev,
          phase: 'RECEIVED',
          response: result.content || result.response || '',
          responseMetadata: {
            ...prev.responseMetadata,
            duration,
            tokensUsed: result.usage?.totalTokens || result.metadata?.usage?.totalTokens || Math.floor((result.content || '').length / 4),
            model: result.metadata?.model || result.model || model.customName || model.modelId
          },
          saveOptions: {
            ...prev.saveOptions,
            newBlockTitle: `${t('ai.modal.defaultTitles.aiResponseBlock')} ${promptTitle}`
          }
        }));
      } else {
        throw new Error(result.error || t('ai.modal.error.unknownError'));
      }
    } catch (error) {
      console.error('AI request error:', error);
      setModalState(prev => ({
        ...prev,
        phase: 'INITIAL',
        error: `${t('ai.modal.error.title')}: ${error.message}`
      }));
    }
  };
  
  // Симуляция ответа ИИ с потоковой передачей
  const simulateAIResponse = async () => {
    const startTime = Date.now();
    
    // Фаза отправки
    setModalState(prev => ({
      ...prev,
      phase: 'SENDING',
      responseMetadata: {
        ...prev.responseMetadata,
        timestamp: new Date().toISOString()
      }
    }));
    
    await delay(1500); // Имитация отправки запроса
    
    // Переходим к получению ответа
    setModalState(prev => ({ ...prev, phase: 'RECEIVING' }));
    
    // Симулированный ответ ИИ
    const mockResponse = `${t('ai.modal.mockResponse.analysis')} "${promptTitle}":

1. **${t('ai.modal.mockResponse.structuralAnalysis')}**
   ${t('ai.modal.mockResponse.structuralAnalysisText', { length: promptContent.length })}

2. **${t('ai.modal.mockResponse.recommendations')}**
   - ${t('ai.modal.mockResponse.recommendation1')}
   - ${t('ai.modal.mockResponse.recommendation2')}
   - ${t('ai.modal.mockResponse.recommendation3')}

3. **${t('ai.modal.mockResponse.potentialIssues')}**
   - ${t('ai.modal.mockResponse.issue1')}
   - ${t('ai.modal.mockResponse.issue2')}

4. **${t('ai.modal.mockResponse.conclusion')}**
   ${t('ai.modal.mockResponse.conclusionText')}`;
    
    // Потоковая симуляция печати
    const words = mockResponse.split(' ');
    let streamText = '';
    
    for (let i = 0; i < words.length; i++) {
      streamText += (i > 0 ? ' ' : '') + words[i];
      
      setModalState(prev => ({
        ...prev,
        response: streamText,
        streamingText: streamText,
        responseMetadata: {
          ...prev.responseMetadata,
          tokensUsed: Math.floor(streamText.length / 4), // Примерно 4 символа = 1 токен
          charactersTyped: streamText.length
        }
      }));
      
      // Случайная задержка между словами для реалистичности
      await delay(Math.random() * 100 + 50);
    }
    
    // Завершение получения ответа
    const endTime = Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    setModalState(prev => ({
      ...prev,
      phase: 'RECEIVED',
      response: mockResponse,
      responseMetadata: {
        ...prev.responseMetadata,
        duration,
        tokensUsed: Math.floor(mockResponse.length / 4)
      },
      saveOptions: {
        ...prev.saveOptions,
        newBlockTitle: `${t('ai.modal.defaultTitles.aiAnalysis')} ${promptTitle}`
      }
    }));
  };
  
  // Обработчик изменения текста ответа
  const handleResponseChange = (e) => {
    setModalState(prev => ({
      ...prev,
      response: e.target.value,
      hasChanges: e.target.value !== prev.streamingText,
      phase: 'EDITING'
    }));
  };
  
  // Копирование ответа в буфер обмена
  const handleCopyResponse = async () => {
    try {
      await navigator.clipboard.writeText(modalState.response);
      actions.showNotification(t('ai.modal.notifications.copied'), 'success');
    } catch (error) {
      console.error('Copy error:', error);
      actions.showNotification(t('ai.modal.error.copyError'), 'error');
    }
  };
  
  // Сохранение ответа как новый контекстный блок
  const handleSaveAsNewContext = async () => {
    setModalState(prev => ({ ...prev, phase: 'SAVING' }));
    
    try {
      await delay(500); // Имитация сохранения
      
      const blockTitle = modalState.saveOptions.newBlockTitle || `${t('ai.modal.defaultTitles.aiResponseBlock')} ${promptTitle}`;
      
      // Создаем новый блок контекста
      actions.addContextBlock(blockTitle);
      
      // Находим созданный блок (последний в списке)
      const newBlockId = state.contextBlocks.length > 0 
        ? Math.max(...state.contextBlocks.map(b => b.id)) + 1
        : 1;
      
      // Добавляем элемент с ответом ИИ сразу с контентом
      setTimeout(() => {
        actions.addMultipleContextItems(newBlockId, [{
          title: t('ai.modal.defaultTitles.aiResponse'),
          content: modalState.response,
          chars: modalState.response.length
        }]);
      }, 100);
      
      actions.showNotification(`${t('ai.modal.notifications.savedNewBlock')} "${blockTitle}"`, 'success');
      
      // Переключаемся на вкладку контекста и активируем новый блок
      actions.setActiveTab('context');
      setTimeout(() => {
        actions.setActiveContextBlock(newBlockId);
      }, 200);
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      actions.showNotification(t('ai.modal.error.saveError'), 'error');
      setModalState(prev => ({ ...prev, phase: 'RECEIVED' }));
    }
  };
  
  // Сохранение в существующий блок контекста
  const handleSaveToExistingContext = async () => {
    if (!modalState.saveOptions.targetBlockId) {
      actions.showNotification(t('ai.modal.notifications.selectBlock'), 'warning');
      return;
    }
    
    setModalState(prev => ({ ...prev, phase: 'SAVING' }));
    
    try {
      await delay(500);
      
      const targetBlock = state.contextBlocks.find(b => b.id === modalState.saveOptions.targetBlockId);
      if (!targetBlock) {
        throw new Error('Блок контекста не найден');
      }
      
      // Добавляем новый элемент в существующий блок сразу с контентом
      actions.addMultipleContextItems(modalState.saveOptions.targetBlockId, [{
        title: 'Ответ ИИ',
        content: modalState.response,
        chars: modalState.response.length
      }]);
      
      actions.showNotification(`Ответ ИИ добавлен в блок "${targetBlock.title}"`, 'success');
      
      // Переключаемся на вкладку контекста и активируем блок
      actions.setActiveTab('context');
      setTimeout(() => {
        actions.setActiveContextBlock(modalState.saveOptions.targetBlockId);
      }, 200);
      
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      actions.showNotification(t('ai.modal.error.saveError'), 'error');
      setModalState(prev => ({ ...prev, phase: 'RECEIVED' }));
    }
  };
  
  // Сброс состояния при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      setModalState({
        phase: 'INITIAL',
        response: '',
        responseMetadata: {
          model: 'GPT-4 Simulation',
          tokensUsed: 0,
          timestamp: null,
          duration: 0,
          charactersTyped: 0
        },
        saveOptions: {
          asNewContext: true,
          targetBlockId: null,
          newBlockTitle: `${t('ai.modal.defaultTitles.aiAnalysis')} ${promptTitle}`,
          splitIntoSections: false
        },
        error: null,
        hasChanges: false,
        streamingText: '',
        selectedModelId: null
      });
    }
  }, [isOpen, promptTitle, lastUsedModelId, state.aiConfig.currentModelId]);
  
  // Автоматически выбираем последнюю использованную модель при открытии
  useEffect(() => {
    if (isOpen && !modalState.selectedModelId && lastUsedModelId) {
      // Проверяем, что эта модель существует в списке доступных
      const modelExists = state.aiConfig.selectedModels.some(m => m.id === lastUsedModelId);
      if (modelExists) {
        setModalState(prev => ({ ...prev, selectedModelId: lastUsedModelId }));
      }
    }
  }, [isOpen, lastUsedModelId, state.aiConfig.selectedModels]);
  
  // Обработка нажатий клавиш
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.ctrlKey && e.key === 'c' && modalState.phase === 'RECEIVED') {
        handleCopyResponse();
      } else if (e.ctrlKey && e.key === 's' && modalState.phase === 'RECEIVED') {
        e.preventDefault();
        handleSaveAsNewContext();
      } else if (e.ctrlKey && e.key === 'r' && (modalState.phase === 'RECEIVED' || modalState.phase === 'EDITING')) {
        e.preventDefault();
        handleRegenerate();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, modalState.phase]);
  
  // Закрытие по клику на оверлей
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // Рендер разных фаз
  const renderPhaseContent = () => {
    switch (modalState.phase) {
      case 'INITIAL':
        if (modalState.error) {
          return (
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-900 bg-opacity-30 rounded-full mb-4">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{t('ai.modal.error.title')}</h3>
                <p className="text-red-400 text-sm mb-4">{modalState.error}</p>
              </div>
              <button
                onClick={() => {
                  setModalState(prev => ({ ...prev, error: null }));
                  if (!modalState.useSimulation && hasConfiguredModels) {
                    sendRealAIRequest();
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                {t('ai.modal.error.retry')}
              </button>
            </div>
          );
        }
        
        // Интерфейс выбора модели
        return (
          <div className="py-6">
            <h3 className="text-lg font-medium text-white mb-4">{t('ai.modal.modelSelection.title')}</h3>
            
            {!hasConfiguredModels ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-900 bg-opacity-30 rounded-full mb-4">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-4">{t('ai.modal.modelSelection.noModels')}</p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  {t('ai.modal.modelSelection.closeAndConfigure')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedModels.map(model => {
                  const isSelected = model.id === modalState.selectedModelId;
                  const isLastUsed = model.id === lastUsedModelId;
                  
                  return (
                    <div
                      key={model.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-900 bg-opacity-20' 
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800 hover:bg-gray-750'
                      }`}
                      onClick={() => setModalState(prev => ({ ...prev, selectedModelId: model.id }))}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-white">{model.customName}</h4>
                            {isLastUsed && (
                              <span className="text-xs px-2 py-1 bg-blue-900 bg-opacity-50 text-blue-300 rounded">
                                {t('ai.modal.modelSelection.lastUsed')}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400 mt-1">
                            {providerNames[model.provider] || model.provider} • {model.modelId} • 
                            {t('ai.modal.modelSelection.temperature')}: {model.temperature} • 
                            {t('ai.modal.modelSelection.maxTokens')}: {model.maxTokens}
                          </p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          isSelected 
                            ? 'border-purple-500 bg-purple-500' 
                            : 'border-gray-600'
                        }`} />
                      </div>
                    </div>
                  );
                })}
                
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleGenerateWithModel(modalState.selectedModelId)}
                    disabled={!modalState.selectedModelId}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {t('ai.modal.modelSelection.generate')}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-3 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                  >
                    {t('ai.modal.modelSelection.cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'SENDING':
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-900 bg-opacity-30 rounded-full mb-4">
                <svg className="w-8 h-8 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {t('ai.modal.sending.title')}
              </h3>
              <p className="text-gray-400 text-sm">
                {t('ai.modal.sending.prompt')}: "{promptTitle}"<br/>
                {t('ai.modal.sending.characters')}: {promptContent.length}
              </p>
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
              <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
            </div>
          </div>
        );
        
      case 'RECEIVING':
        return (
          <div>
            <div className="flex items-center justify-between mb-4 p-3 bg-purple-900 bg-opacity-20 rounded-lg border border-purple-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <span className="text-purple-300 font-medium">{modalState.responseMetadata.model}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm">{modalState.responseMetadata.tokensUsed} {t('ai.modal.receiving.tokens')}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm">{modalState.responseMetadata.charactersTyped} {t('ai.modal.receiving.characters')}</span>
              </div>
              <div className="text-xs text-gray-500">{t('ai.modal.receiving.title')}</div>
            </div>
            
            <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
              <pre className="whitespace-pre-wrap text-gray-200 font-normal leading-relaxed">
                {modalState.response}
                <span className="animate-pulse">█</span>
              </pre>
            </div>
            
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setModalState(prev => ({ ...prev, phase: 'RECEIVED' }))}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
              >
                {t('ai.modal.receiving.stop')}
              </button>
              <button
                onClick={handleCopyResponse}
                disabled={!modalState.response}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('ai.modal.response.copy')}
              </button>
            </div>
          </div>
        );
        
      case 'RECEIVED':
      case 'EDITING':
        return (
          <div>
            <div className="flex items-center justify-between mb-4 p-3 bg-green-900 bg-opacity-20 rounded-lg border border-green-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-green-300 font-medium">{modalState.responseMetadata.model}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm">{modalState.responseMetadata.tokensUsed} {t('ai.modal.receiving.tokens')}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-400 text-sm">{modalState.responseMetadata.duration} {t('ai.modal.response.seconds')}</span>
                <span className="text-gray-400">•</span>
                <span className="text-green-400 text-sm">✓ {t('ai.modal.response.complete')}</span>
              </div>
              {modalState.hasChanges && (
                <div className="text-xs text-amber-400">● {t('ai.modal.response.modified')}</div>
              )}
            </div>
            
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                value={modalState.response}
                onChange={handleResponseChange}
                className="w-full h-80 p-4 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder={t('ai.modal.response.placeholder')}
              />
            </div>
            
            {/* Опции сохранения */}
            <div className="bg-gray-750 border border-gray-600 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-300 mb-3">{t('ai.modal.saveOptions.title')}</h4>
              
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="saveOption"
                    checked={modalState.saveOptions.asNewContext}
                    onChange={() => setModalState(prev => ({
                      ...prev,
                      saveOptions: { ...prev.saveOptions, asNewContext: true }
                    }))}
                    className="mr-3 text-purple-600"
                  />
                  <span className="text-gray-300">{t('ai.modal.saveOptions.newBlock')}</span>
                  <input
                    type="text"
                    value={modalState.saveOptions.newBlockTitle}
                    onChange={(e) => setModalState(prev => ({
                      ...prev,
                      saveOptions: { ...prev.saveOptions, newBlockTitle: e.target.value }
                    }))}
                    className="ml-2 flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-purple-500"
                    placeholder={t('ai.modal.saveOptions.newBlockPlaceholder')}
                  />
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="saveOption"
                    checked={!modalState.saveOptions.asNewContext}
                    onChange={() => setModalState(prev => ({
                      ...prev,
                      saveOptions: { ...prev.saveOptions, asNewContext: false }
                    }))}
                    className="mr-3 text-purple-600"
                  />
                  <span className="text-gray-300">{t('ai.modal.saveOptions.existingBlock')}</span>
                  <select
                    value={modalState.saveOptions.targetBlockId || ''}
                    onChange={(e) => setModalState(prev => ({
                      ...prev,
                      saveOptions: { ...prev.saveOptions, targetBlockId: parseInt(e.target.value) || null }
                    }))}
                    className="ml-2 flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 text-sm focus:outline-none focus:border-purple-500"
                    disabled={modalState.saveOptions.asNewContext}
                  >
                    <option value="">{t('ai.modal.saveOptions.selectBlock')}</option>
                    {state.contextBlocks.map(block => (
                      <option key={block.id} value={block.id}>
                        {block.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            
            <div className="flex justify-between">
              <div className="flex gap-2">
                <button
                  onClick={handleCopyResponse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t('ai.modal.response.copy')}
                </button>
                <button
                  onClick={handleRegenerate}
                  disabled={!modalState.selectedModelId}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  title={`${t('ai.modal.response.regenerateTooltip')} ${currentModel?.customName || ''} (Ctrl+R)`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('ai.modal.response.regenerate')}
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
                >
                  {t('ai.modal.response.close')}
                </button>
                <button
                  onClick={modalState.saveOptions.asNewContext ? handleSaveAsNewContext : handleSaveToExistingContext}
                  disabled={!modalState.response.trim() || (!modalState.saveOptions.asNewContext && !modalState.saveOptions.targetBlockId)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('ai.modal.response.save')}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'SAVING':
        return (
          <div className="text-center py-8">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900 bg-opacity-30 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-400 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {t('ai.modal.saving.title')}
              </h3>
              <p className="text-gray-400 text-sm">
                {t('ai.modal.saving.description')}
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick}
    >
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] shadow-lg overflow-hidden">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white">
              {t('ai.modal.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Контент */}
        <div className="p-6">
          {renderPhaseContent()}
        </div>
      </div>
      
      {/* Индикатор режима работы */}
      {modalState.phase !== 'INITIAL' && (
        <div className="absolute top-2 right-2 text-xs text-gray-400">
          {modalState.useSimulation || !hasConfiguredModels ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              {t('ai.modal.simulationMode')}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {modalState.responseMetadata.model}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AIResponseModal;