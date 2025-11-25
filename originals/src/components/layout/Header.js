// src/components/layout/Header.js - Компонент верхней панели приложения
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import AppStateService from '../../services/AppStateService';
import AIConfigModal from '../ui/AIConfigModal';
import QuickHelp from '../ui/QuickHelp';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../ui/LanguageSwitcher';

const Header = () => {
  const { t } = useTranslation();
  const { state, actions } = useApp();
  const { notification, projectPath } = state;
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationType, setNotificationType] = useState('info');
  
  // Состояния для редактирования названий
  const [projectName, setProjectName] = useState(state.projectName || t('header.project.newProject'));
  const [isEditingProject, setIsEditingProject] = useState(false);
  
  // Состояние для модального окна AI настроек
  const [showAIConfig, setShowAIConfig] = useState(false);
  
  // Состояние для окна справки
  const [showHelp, setShowHelp] = useState(false);

  // Синхронизация с глобальным состоянием
  useEffect(() => {
    console.log('Синхронизация названия проекта из состояния:', state.projectName);
    if (state.projectName && !isEditingProject) {
      setProjectName(state.projectName);
    }
  }, [state.projectName, isEditingProject]);

  // Обработка уведомлений
  useEffect(() => {
    if (notification && notification.visible) {
      setNotificationMessage(notification.message || '');
      setNotificationType(notification.type || 'info');
      setShowNotification(true);

      // Автоматически скрываем уведомление через 3 секунды
      const timer = setTimeout(() => {
        setShowNotification(false);
        actions.hideNotification();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification, actions]);

  // Обработчики для проектов
  const handleNewProject = () => {
    console.log('Создание нового проекта');
    actions.createNewProject();
  };

  const handleOpenProject = () => {
    console.log('Открытие проекта');
    actions.openProject();
  };

  const handleSaveProject = async () => {
    console.log('Сохранение проекта - начало');
    
    // Снимаем фокус со всех активных элементов чтобы сохранить текущие изменения
    if (document.activeElement) {
      console.log('Снятие фокуса с активного элемента:', document.activeElement.tagName);
      document.activeElement.blur();
    }
    
    // Ждем применения изменений из полей ввода
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Обновляем название проекта в глобальном состоянии перед сохранением
    if (projectName !== state.projectName) {
      console.log(`Обновление названия проекта перед сохранением: ${projectName}`);
      actions.setProjectName(projectName);
      // Даем время на обновление состояния
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log('Вызов actions.saveProject()');
    const result = await actions.saveProject();
    console.log('Результат сохранения:', result);
    return result;
  };

  const handleSaveProjectAs = () => {
    console.log('Сохранение проекта как...');
    // Обновляем название проекта в глобальном состоянии перед сохранением
    if (projectName !== state.projectName) {
      console.log(`Обновление названия проекта перед сохранением как...: ${projectName}`);
      actions.setProjectName(projectName);
    }
    actions.saveProjectAs();
  };

  // Обработчик для импорта контекста
  const handleImportContext = () => {
    console.log('Импорт контекста');
    actions.importContextBlock();
  };

  // Обработчик для выбора папки проектов
  const handleChooseProjectsFolder = async () => {
    try {
      const folder = await window.electronAPI.selectDirectory();
      if (folder) {
        actions.setProjectFolder(folder);
      }
    } catch (error) {
      console.error('Ошибка при выборе папки проектов:', error);
    }
  };

  // Обработчик для выбора папки блоков контекста
  const handleChooseContextDataFolder = async () => {
    try {
      const folder = await window.electronAPI.selectDirectory();
      if (folder) {
        actions.setContextDataFolder(folder);
      }
    } catch (error) {
      console.error('Ошибка при выборе папки блоков контекста:', error);
    }
  };

  // Обработчики редактирования названия проекта
  const handleProjectNameChange = (e) => {
    setProjectName(e.target.value);
  };

  const handleProjectNameBlur = () => {
    console.log(`Завершено редактирование названия проекта: ${projectName}`);
    setIsEditingProject(false);
    if (projectName.trim() === '') {
      setProjectName(t('header.project.newProject'));
    }
    actions.setProjectName(projectName);
  };

  const handleProjectNameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // Снимаем фокус для триггера blur события
    } else if (e.key === 'Escape') {
      setProjectName(state.projectName || t('header.project.newProject'));
      setIsEditingProject(false);
    }
  };

  // Обработчик выхода из приложения
  const handleExit = async () => {
    console.log('Выход из приложения - начало процедуры');
    
    // Устанавливаем флаг, чтобы предотвратить предупреждение браузера
    window.isExitingApp = true;
    
    try {
      // Сохраняем проект и ждем завершения
      console.log('Автоматическое сохранение проекта перед выходом...');
      const saved = await handleSaveProject();
      console.log('Результат автосохранения:', saved);
      
      // Сохраняем состояние приложения
      console.log('Сохранение состояния приложения...');
      await AppStateService.saveAppState({
        lastProjectPath: state.projectPath,
        activeTab: state.activeTab,
        activeContextBlockId: state.activeContextBlockId,
        activePromptBlockId: state.activePromptBlockId,
        projectFolder: state.projectFolder,
        contextDataFolder: state.contextDataFolder
      });
      
      // Даем время на показ уведомления о сохранении
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Теперь закрываем приложение
      console.log('Закрытие приложения');
      if (window.electronAPI && window.electronAPI.exitApp) {
        window.electronAPI.exitApp();
      } else {
        window.close();
      }
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      // Все равно закрываем приложение
      if (window.electronAPI && window.electronAPI.exitApp) {
        window.electronAPI.exitApp();
      } else {
        window.close();
      }
    } finally {
      // Сбрасываем флаг в случае ошибки
      window.isExitingApp = false;
    }
  };


  return (
    <div className="relative">
      <header className="flex flex-col px-4 py-2 bg-gray-800 border-b border-gray-700">
        {/* Путь к текущему файлу проекта */}
        {projectPath && (
          <div className="w-full mb-2 text-xs text-gray-400 truncate">
            {t('header.project.currentPath', { path: projectPath })}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {/* Зона работы с проектами */}
            <div className="flex items-center">
              <div className="mr-2 font-medium text-sm text-gray-300 whitespace-nowrap">{t('header.project.label')}</div>
              <div className="flex flex-wrap gap-1">
                <button 
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  onClick={handleNewProject}
                  title={t('header.tooltips.createNewProject')}
                >
                  {t('header.project.new')}
                </button>
                <button 
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  onClick={handleOpenProject}
                  title={t('header.tooltips.openExistingProject')}
                >
                  {t('header.project.open')}
                </button>
                <button 
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  onClick={handleSaveProject}
                  title={t('header.tooltips.saveCurrentProject')}
                >
                  {t('header.project.save')}
                </button>
                <button 
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  onClick={handleSaveProjectAs}
                  title={t('header.tooltips.saveProjectWithNewName')}
                >
                  {t('header.project.saveAs')}
                </button>
                <button 
                  className="ml-2 px-2 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                  onClick={handleChooseProjectsFolder}
                  title={t('header.tooltips.selectProjectsFolder')}
                >
                  {t('header.project.projectsFolder')}
                </button>
                <div 
                  className="ml-2 px-2 py-1 bg-gray-700 text-white text-xs rounded max-w-[200px] min-w-[100px]"
                  onClick={() => setIsEditingProject(true)}
                  title={t('header.tooltips.editProjectName')}
                >
                  {isEditingProject ? (
                    <input
                      type="text"
                      className="bg-gray-600 border border-gray-500 text-white text-xs rounded px-1 py-0 w-full focus:outline-none focus:border-blue-500"
                      value={projectName}
                      onChange={handleProjectNameChange}
                      onBlur={handleProjectNameBlur}
                      onKeyDown={handleProjectNameKeyDown}
                      autoFocus
                    />
                  ) : (
                    <div className="cursor-pointer truncate">{projectName}</div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Кнопки для работы с контекстом */}
            <div className="flex items-center">
              <button 
                className="px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700 flex items-center"
                onClick={handleImportContext}
                title={t('header.tooltips.importContextBlock')}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 mr-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" 
                  />
                </svg>
                {t('header.context.import')}
              </button>
              <button 
                className="ml-2 px-3 py-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"
                onClick={handleChooseContextDataFolder}
                title={t('header.tooltips.selectContextFolder')}
              >
                {t('header.context.folder')}
              </button>
            </div>
          </div>

          {/* Управляющие кнопки справа */}
          <div className="flex gap-2 items-center">
            {/* Переключатель языка */}
            <LanguageSwitcher />
            {/* Кнопка справки */}
            <button 
              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center"
              onClick={() => setShowHelp(true)}
              title={t('header.tooltips.help')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              {t('header.help')}
            </button>
            <button 
              className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 flex items-center"
              onClick={() => setShowAIConfig(true)}
              title={t('header.tooltips.aiSettings')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
                />
              </svg>
              {t('header.ai.settings')}
            </button>
            <button 
              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 flex items-center"
              onClick={handleExit}
              title={t('header.tooltips.exitApp')}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-3 w-3 mr-1" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                />
              </svg>
              {t('header.app.exit')}
            </button>
          </div>
        </div>
      </header>

      {/* Уведомление */}
      {showNotification && (
        <div 
          className={`absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-4 py-2 rounded shadow-lg z-50 transition-opacity duration-300 ${
            notificationType === 'success' ? 'bg-green-600 text-white' : 
            notificationType === 'error' ? 'bg-red-600 text-white' : 
            'bg-blue-600 text-white'
          }`}
        >
          {notificationMessage}
        </div>
      )}
      
      {/* AI Config Modal */}
      <AIConfigModal 
        isOpen={showAIConfig}
        onClose={() => setShowAIConfig(false)}
      />
      
      {/* Quick Help Modal */}
      <QuickHelp 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default Header;