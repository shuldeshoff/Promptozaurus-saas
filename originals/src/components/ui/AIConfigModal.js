// src/components/ui/AIConfigModal.js - AI providers and models configuration modal
// @description: Full-featured interface for managing AI integration with three tabs support
// @created: 2025-06-25 - implementation of AI providers, models and global settings

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import CredentialsService from '../../services/CredentialsService';
import AIService from '../../services/AIService';

const AIConfigModal = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const { state, actions } = useApp();
  const [activeTab, setActiveTab] = useState('providers');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Локальное состояние для провайдеров
  const [providersState, setProvidersState] = useState({});
  
  // Инициализация providersState на основе провайдеров из aiConfig
  React.useEffect(() => {
    const initialState = {};
    Object.keys(state.aiConfig.providers).forEach(providerId => {
      initialState[providerId] = {
        apiKey: '',
        isVisible: false,
        isTesting: false
      };
    });
    setProvidersState(initialState);
  }, [state.aiConfig.providers]);
  
  // Состояние для загруженных моделей
  const [loadedModels, setLoadedModels] = useState({});
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  
  // Локальное состояние для настройки новой модели
  const [newModelConfig, setNewModelConfig] = useState({
    provider: '',
    modelId: '',
    customName: '',
    temperature: 0.7,
    maxTokens: 4000,
    isDefault: false
  });
  
  // Локальное состояние для глобальных настроек
  const [globalSettings, setGlobalSettings] = useState({
    ...state.aiConfig.globalSettings
  });
  
  // Эффект для инициализации состояния провайдеров при открытии
  useEffect(() => {
    if (isOpen) {
      checkAllProvidersStatus();
      setGlobalSettings({ ...state.aiConfig.globalSettings });
      loadAvailableModels();
    }
  }, [isOpen]);
  
  // Загрузка доступных моделей
  const loadAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      const result = await AIService.loadAllAvailableModels();
      if (result.success) {
        setLoadedModels(result.models);
        // Сохраняем в контекст для использования в других компонентах
        actions.setAvailableModels(result.models);
        
        // Также сохраняем каждый провайдер отдельно
        Object.keys(result.models).forEach(providerId => {
          actions.setAIProviderModels(providerId, result.models[providerId]);
        });
      }
      if (result.errors && Object.keys(result.errors).length > 0) {
        console.error('Models loading errors:', result.errors);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  // Обновить модели для конкретного провайдера
  const refreshProviderModels = async (providerId) => {
    try {
      setIsLoadingModels(true);
      const result = await AIService.refreshProviderModels(providerId);
      if (result.success) {
        // Обновляем локальное состояние
        setLoadedModels(prev => ({
          ...prev,
          [providerId]: result.models
        }));
        
        // Сохраняем в глобальное состояние
        actions.setAIProviderModels(providerId, result.models);
        
        showNotification(t('aiConfig.notifications.modelsUpdated', { provider: providerId }), 'success');
      } else {
        showNotification(`${t('aiConfig.notifications.modelsUpdateError')}: ${result.error}`, 'error');
      }
    } catch (error) {
        showNotification(`${t('aiConfig.notifications.error')}: ${error.message}`, 'error');
    } finally {
      setIsLoadingModels(false);
    }
  };
  
  // Проверка статуса всех провайдеров
  const checkAllProvidersStatus = async () => {
    setIsLoading(true);
    try {
      const statusResult = await AIService.checkProvidersStatus();
      if (statusResult.success) {
        // Обновляем статус провайдеров в state
        Object.keys(statusResult.providers).forEach(providerId => {
          const status = statusResult.providers[providerId];
          actions.updateAIProviderStatus(providerId, {
            hasKey: status.hasKey,
            status: status.hasKey ? 'active' : 'not_configured'
          });
        });
      }
    } catch (error) {
      console.error('Provider check error:', error);
      showNotification(t('aiConfig.notifications.providerCheckError'), 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Показать уведомление
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };
  
  // Обработчик сохранения API ключа
  const handleSaveApiKey = async (providerId) => {
    const apiKey = providersState[providerId].apiKey.trim();
    
    if (!apiKey) {
      showNotification(t('aiConfig.notifications.enterApiKey'), 'warning');
      return;
    }
    
    // Валидация формата ключа
    if (!CredentialsService.validateAPIKeyFormat(providerId, apiKey)) {
      showNotification(t('aiConfig.notifications.invalidKeyFormat'), 'error');
      return;
    }
    
    setProvidersState(prev => ({
      ...prev,
      [providerId]: { ...prev[providerId], isTesting: true }
    }));
    
    try {
      // Тестируем соединение
      const testResult = await AIService.testProviderConnection(providerId, apiKey);
      
      if (testResult.success) {
        // Сохраняем ключ
        const saveResult = await CredentialsService.storeAPIKey(providerId, apiKey);
        
        if (saveResult.success) {
          showNotification(t('aiConfig.notifications.keySaved', { provider: state.aiConfig.providers[providerId].name }), 'success');
          
          // Обновляем статус провайдера
          actions.updateAIProviderStatus(providerId, {
            hasKey: true,
            status: 'active',
            error: null
          });
          
          // Загружаем доступные модели
          await loadProviderModels(providerId);
          
          // Очищаем поле ввода
          setProvidersState(prev => ({
            ...prev,
            [providerId]: { ...prev[providerId], apiKey: '', isVisible: false }
          }));
        } else {
          throw new Error(saveResult.error || t('aiConfig.notifications.keySaveError'));
        }
      } else {
        throw new Error(testResult.error || t('aiConfig.notifications.connectionTestError'));
      }
    } catch (error) {
      console.error(`Error saving key ${providerId}:`, error);
      showNotification(error.message, 'error');
      
      actions.updateAIProviderStatus(providerId, {
        status: 'error',
        error: error.message
      });
    } finally {
      setProvidersState(prev => ({
        ...prev,
        [providerId]: { ...prev[providerId], isTesting: false }
      }));
    }
  };
  
  // Загрузка моделей провайдера
  const loadProviderModels = async (providerId, forceRefresh = false) => {
    try {
      // Устанавливаем состояние загрузки
      setProvidersState(prev => ({
        ...prev,
        [providerId]: { ...prev[providerId], isLoadingModels: true }
      }));
      
      const result = await AIService.loadProviderModels(providerId, forceRefresh);
      if (result.success && result.models) {
        actions.setAIProviderModels(providerId, result.models);
        
        if (forceRefresh) {
          showNotification(t('aiConfig.notifications.modelListUpdated', { provider: state.aiConfig.providers[providerId].name }), 'success');
        }
      }
    } catch (error) {
      console.error(`Error loading models ${providerId}:`, error);
      showNotification(`${t('aiConfig.notifications.modelsLoadError')}: ${error.message}`, 'error');
    } finally {
      setProvidersState(prev => ({
        ...prev,
        [providerId]: { ...prev[providerId], isLoadingModels: false }
      }));
    }
  };
  
  // Обработчик обновления списка моделей
  const handleRefreshModels = async (providerId) => {
    await loadProviderModels(providerId, true);
  };
  
  // Обработчик удаления API ключа
  const handleRemoveApiKey = async (providerId) => {
    if (!confirm(t('aiConfig.notifications.deleteKeyConfirm', { provider: state.aiConfig.providers[providerId].name }))) {
      return;
    }
    
    try {
      const result = await CredentialsService.removeAPIKey(providerId);
      if (result.success) {
        showNotification(t('aiConfig.notifications.keyDeleted', { provider: state.aiConfig.providers[providerId].name }), 'success');
        
        actions.updateAIProviderStatus(providerId, {
          hasKey: false,
          status: 'not_configured',
          availableModels: [],
          error: null
        });
      }
    } catch (error) {
      console.error(`Error deleting key ${providerId}:`, error);
      showNotification(t('aiConfig.notifications.keyDeleteError'), 'error');
    }
  };
  
  // Обработчик добавления конфигурации модели
  const handleAddModelConfig = () => {
    if (!newModelConfig.provider || !newModelConfig.modelId) {
      showNotification(t('aiConfig.notifications.selectProviderAndModel'), 'warning');
      return;
    }
    
    if (!newModelConfig.customName.trim()) {
      showNotification(t('aiConfig.notifications.enterConfigName'), 'warning');
      return;
    }
    
    const config = {
      provider: newModelConfig.provider,
      modelId: newModelConfig.modelId,
      modelName: getModelName(newModelConfig.provider, newModelConfig.modelId),
      customName: newModelConfig.customName,
      temperature: newModelConfig.temperature,
      maxTokens: newModelConfig.maxTokens,
      isDefault: newModelConfig.isDefault || state.aiConfig.selectedModels.length === 0
    };
    
    actions.addAIModelConfig(config);
    showNotification(t('aiConfig.notifications.configAdded'), 'success');
    
    // Сброс формы
    setNewModelConfig({
      provider: '',
      modelId: '',
      customName: '',
      temperature: 0.7,
      maxTokens: 4000,
      isDefault: false
    });
  };
  
  // Получить имя модели
  const getModelName = (providerId, modelId) => {
    const provider = state.aiConfig.providers[providerId];
    if (!provider || !provider.availableModels) return modelId;
    
    const model = provider.availableModels.find(m => m.id === modelId);
    return model ? model.name : modelId;
  };
  
  // Обработчик удаления конфигурации модели
  const handleRemoveModelConfig = (modelId) => {
    const model = state.aiConfig.selectedModels.find(m => m.id === modelId);
    if (!model) return;
    
    if (!confirm(t('aiConfig.notifications.deleteConfigConfirm', { name: model.customName }))) {
      return;
    }
    
    actions.removeAIModelConfig(modelId);
    showNotification(t('aiConfig.notifications.configDeleted'), 'success');
  };
  
  // Обработчик установки модели по умолчанию
  const handleSetDefaultModel = (modelId) => {
    // Сброс флага default у всех моделей
    state.aiConfig.selectedModels.forEach(model => {
      if (model.id !== modelId && model.isDefault) {
        actions.updateAIModelConfig(model.id, { isDefault: false });
      }
    });
    
    // Установка новой модели по умолчанию
    actions.updateAIModelConfig(modelId, { isDefault: true });
    actions.setCurrentAIModel(modelId);
    showNotification(t('aiConfig.notifications.defaultModelSet'), 'success');
  };
  
  // Обработчик сохранения глобальных настроек
  const handleSaveGlobalSettings = () => {
    actions.updateAIGlobalSettings(globalSettings);
    showNotification(t('aiConfig.notifications.settingsSaved'), 'success');
  };
  
  // Закрытие модального окна
  const handleClose = () => {
    setActiveTab('providers');
    setNotification(null);
    onClose();
  };
  
  if (!isOpen) return null;
  
  // Рендер вкладки провайдеров
  const renderProvidersTab = () => (
    <div className="space-y-6">
      <div className="text-sm text-gray-400 mb-4">
        {t('aiConfig.providers.description')}
      </div>
      
      {Object.keys(state.aiConfig.providers).map(providerId => {
        const provider = state.aiConfig.providers[providerId];
        const isConfigured = provider.hasKey;
        const isActive = provider.status === 'active';
        const hasError = provider.status === 'error';
        
        return (
          <div key={providerId} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-white">{provider.name}</h3>
                {isActive && (
                  <span className="px-2 py-1 text-xs bg-green-900 text-green-300 rounded-full">
                    {t('aiConfig.providers.active')}
                  </span>
                )}
                {hasError && (
                  <span className="px-2 py-1 text-xs bg-red-900 text-red-300 rounded-full">
                    {t('aiConfig.providers.error')}
                  </span>
                )}
              </div>
              
              {isConfigured && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">
                    {provider.availableModels?.length || 0} {t('aiConfig.providers.modelsCount')}
                  </span>
                  <button
                    onClick={() => handleRemoveApiKey(providerId)}
                    className="p-1 text-red-400 hover:text-red-300 transition-colors"
                    title={t('aiConfig.providers.deleteKey')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            
            {!isConfigured ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type={providersState[providerId]?.isVisible ? 'text' : 'password'}
                    value={providersState[providerId]?.apiKey || ''}
                    onChange={(e) => setProvidersState(prev => ({
                      ...prev,
                      [providerId]: { ...prev[providerId], apiKey: e.target.value }
                    }))}
                    placeholder={t('aiConfig.providers.enterApiKey')}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => setProvidersState(prev => ({
                      ...prev,
                      [providerId]: { 
                        ...prev[providerId], 
                        isVisible: !prev[providerId]?.isVisible 
                      }
                    }))}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                  >
                    {providersState[providerId]?.isVisible ? (
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
                  <button
                    onClick={() => handleSaveApiKey(providerId)}
                    disabled={providersState[providerId]?.isTesting || !providersState[providerId]?.apiKey}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {providersState[providerId]?.isTesting ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('aiConfig.providers.checkingKey')}
                      </>
                    ) : (
                      t('aiConfig.providers.saveAndCheck')
                    )}
                  </button>
                </div>
                
                {provider.error && (
                  <div className="text-sm text-red-400 mt-2">
                    {provider.error}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  {t(`aiConfig.providers.getKeyHints.${providerId}`)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">
                {t('aiConfig.providers.keyConfigured')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
  
  // Рендер вкладки моделей
  const renderModelsTab = () => {
    const configuredProviders = Object.keys(state.aiConfig.providers).filter(
      providerId => state.aiConfig.providers[providerId].hasKey
    );
    
    return (
      <div className="space-y-6">
        {configuredProviders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p>{t('aiConfig.models.noProvidersTitle')}</p>
          </div>
        ) : (
          <>
            {/* Форма добавления новой конфигурации */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">{t('aiConfig.models.addConfigTitle')}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('aiConfig.models.provider')}</label>
                  <select
                    value={newModelConfig.provider}
                    onChange={(e) => setNewModelConfig(prev => ({ 
                      ...prev, 
                      provider: e.target.value,
                      modelId: '' 
                    }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">{t('aiConfig.models.selectProvider')}</option>
                    {configuredProviders.map(providerId => (
                      <option key={providerId} value={providerId}>
                        {state.aiConfig.providers[providerId].name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-400">{t('aiConfig.models.model')}</label>
                    {newModelConfig.provider && (
                      <button
                        onClick={() => handleRefreshModels(newModelConfig.provider)}
                        disabled={providersState[newModelConfig.provider]?.isLoadingModels}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                      >
                        {providersState[newModelConfig.provider]?.isLoadingModels ? t('aiConfig.models.loading') : t('aiConfig.models.refreshList')}
                      </button>
                    )}
                  </div>
                  <select
                    value={newModelConfig.modelId}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, modelId: e.target.value }))}
                    disabled={!newModelConfig.provider}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                  >
                    <option value="">{t('aiConfig.models.selectModel')}</option>
                    {newModelConfig.provider && state.aiConfig.providers[newModelConfig.provider].availableModels?.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.contextLength} {t('aiConfig.models.tokens')})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">{t('aiConfig.models.configName')}</label>
                  <input
                    type="text"
                    value={newModelConfig.customName}
                    onChange={(e) => setNewModelConfig(prev => ({ ...prev, customName: e.target.value }))}
                    placeholder={t('aiConfig.models.configNamePlaceholder')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    {t('aiConfig.models.temperature')}: {newModelConfig.temperature}
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
                  <label className="block text-sm text-gray-400 mb-2">{t('aiConfig.models.maxTokens')}</label>
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
                    {t('aiConfig.models.setAsDefault')}
                  </label>
                </div>
              </div>
              
              <button
                onClick={handleAddModelConfig}
                disabled={!newModelConfig.provider || !newModelConfig.modelId || !newModelConfig.customName}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {t('aiConfig.models.addConfig')}
              </button>
            </div>
            
            {/* Список настроенных моделей */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">{t('aiConfig.models.configuredModels')}</h3>
              
              {state.aiConfig.selectedModels.length === 0 ? (
                <div className="text-center py-6 text-gray-400 bg-gray-800 rounded-lg border border-gray-700">
                  {t('aiConfig.models.noConfiguredModels')}
                </div>
              ) : (
                state.aiConfig.selectedModels.map(model => (
                  <div key={model.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-white">{model.customName}</h4>
                        {model.isDefault && (
                          <span className="px-2 py-0.5 text-xs bg-purple-900 text-purple-300 rounded-full">
                            {t('aiConfig.models.default')}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        {state.aiConfig.providers[model.provider]?.name} • {model.modelName} • 
                        {t('aiConfig.models.temperature')}: {model.temperature} • {t('aiConfig.models.maxTokens')}: {model.maxTokens}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!model.isDefault && (
                        <button
                          onClick={() => handleSetDefaultModel(model.id)}
                          className="p-2 text-gray-400 hover:text-purple-400 transition-colors"
                          title={t('aiConfig.models.setAsDefault')}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoveModelConfig(model.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title={t('aiConfig.models.deleteConfig')}
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
  
  // Рендер вкладки настроек
  const renderSettingsTab = () => (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{t('aiConfig.settings.globalTitle')}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('aiConfig.settings.requestTimeout')}
            </label>
            <input
              type="number"
              value={globalSettings.timeout}
              onChange={(e) => setGlobalSettings(prev => ({ 
                ...prev, 
                timeout: parseInt(e.target.value) || 60000 
              }))}
              min="10000"
              max="600000"
              step="1000"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:border-purple-500"
            />
            <div className="text-xs text-gray-500 mt-1">
              {t('aiConfig.settings.timeoutHint')}
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {t('aiConfig.settings.retryCount')}
            </label>
            <input
              type="number"
              value={globalSettings.retryCount}
              onChange={(e) => setGlobalSettings(prev => ({ 
                ...prev, 
                retryCount: parseInt(e.target.value) || 3 
              }))}
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
                onChange={(e) => setGlobalSettings(prev => ({ 
                  ...prev, 
                  streamingEnabled: e.target.checked 
                }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">{t('aiConfig.settings.streamingEnabled')}</div>
                <div className="text-xs text-gray-500">
                  {t('aiConfig.settings.streamingHint')}
                </div>
              </div>
            </label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={globalSettings.autoSave}
                onChange={(e) => setGlobalSettings(prev => ({ 
                  ...prev, 
                  autoSave: e.target.checked 
                }))}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
              />
              <div>
                <div className="text-sm text-white">{t('aiConfig.settings.autoSave')}</div>
                <div className="text-xs text-gray-500">
                  {t('aiConfig.settings.autoSaveHint')}
                </div>
              </div>
            </label>
          </div>
          
          <button
            onClick={handleSaveGlobalSettings}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
          >
            {t('aiConfig.settings.saveSettings')}
          </button>
        </div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">{t('aiConfig.settings.statsTitle')}</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">{t('aiConfig.settings.configuredProviders')}</div>
            <div className="text-xl font-semibold text-white">
              {Object.values(state.aiConfig.providers).filter(p => p.hasKey).length} / {Object.keys(state.aiConfig.providers).length}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400">{t('aiConfig.settings.configuredModels')}</div>
            <div className="text-xl font-semibold text-white">
              {state.aiConfig.selectedModels.length}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400">{t('aiConfig.settings.currentModel')}</div>
            <div className="text-white">
              {state.aiConfig.currentModelId 
                ? state.aiConfig.selectedModels.find(m => m.id === state.aiConfig.currentModelId)?.customName || t('aiConfig.settings.notSelected')
                : t('aiConfig.settings.notSelected')}
            </div>
          </div>
          
          <div>
            <div className="text-gray-400">{t('aiConfig.settings.totalAvailableModels')}</div>
            <div className="text-xl font-semibold text-white">
              {Object.values(state.aiConfig.providers).reduce((sum, provider) => 
                sum + (provider.availableModels?.length || 0), 0
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] shadow-lg overflow-hidden flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white">{t('aiConfig.title')}</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-white rounded-md transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Вкладки */}
        <div className="flex border-b border-gray-700 px-6">
          {[
            { id: 'providers', label: t('aiConfig.tabs.providers'), icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { id: 'models', label: t('aiConfig.tabs.models'), icon: 'M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z' },
            { id: 'settings', label: t('aiConfig.tabs.settings'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
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
        
        {/* Контент вкладки */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <svg className="w-8 h-8 text-purple-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
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
        
        {/* Уведомления */}
        {notification && (
          <div className={`absolute bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-green-900 text-green-300' :
            notification.type === 'error' ? 'bg-red-900 text-red-300' :
            notification.type === 'warning' ? 'bg-amber-900 text-amber-300' :
            'bg-blue-900 text-blue-300'
          }`}>
            {notification.type === 'success' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.type === 'error' && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {notification.message}
          </div>
        )}
        
        {/* Кнопки действий */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-md hover:bg-gray-600 transition-colors"
          >
            {t('aiConfig.close')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIConfigModal;