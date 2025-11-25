// src/components/AppInitializer.js - Компонент для инициализации состояния приложения
// @description: Загружает сохраненное состояние при запуске и восстанавливает последний проект
// @created: 2025-06-25

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import AppStateService from '../services/AppStateService';
import ProjectService from '../services/ProjectService';

const AppInitializer = ({ children }) => {
  const { state, actions } = useApp();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('=== Инициализация приложения ===');
        
        // Загружаем сохраненное состояние
        const savedState = await AppStateService.loadAppState();
        console.log('Загруженное состояние:', savedState);
        
        // Восстанавливаем пути к папкам
        if (savedState.projectFolder) {
          actions.setProjectFolder(savedState.projectFolder);
        }
        if (savedState.contextDataFolder) {
          actions.setContextDataFolder(savedState.contextDataFolder);
        }
        if (savedState.templateFolder) {
          actions.setTemplateFolder(savedState.templateFolder);
        }
        
        // Проверяем и загружаем последний проект
        if (savedState.lastProjectPath) {
          console.log('Найден последний проект:', savedState.lastProjectPath);
          
          // Проверяем существование файла
          const fileExists = await window.electronAPI.fileExists(savedState.lastProjectPath);
          
          if (fileExists) {
            console.log('Загрузка последнего проекта...');
            try {
              const projectData = await ProjectService.loadProject(savedState.lastProjectPath);
              
              if (projectData) {
                // Загружаем проект в состояние
                actions.loadProject(projectData, savedState.lastProjectPath);
                
                // Восстанавливаем активные элементы
                if (savedState.activeTab) {
                  actions.setActiveTab(savedState.activeTab);
                }
                if (savedState.activeContextBlockId) {
                  actions.setActiveContextBlock(savedState.activeContextBlockId);
                }
                if (savedState.activePromptBlockId) {
                  actions.setActivePromptBlock(savedState.activePromptBlockId);
                }
                
                console.log('Последний проект успешно загружен');
                actions.showNotification(`Загружен проект: ${projectData.projectName}`, 'success');
              }
            } catch (error) {
              console.error('Ошибка при загрузке последнего проекта:', error);
              actions.showNotification('Не удалось загрузить последний проект', 'error');
            }
          } else {
            console.log('Файл последнего проекта не найден:', savedState.lastProjectPath);
            actions.showNotification('Файл последнего проекта не найден', 'warning');
          }
        } else {
          console.log('Последний проект не найден, начинаем с чистого состояния');
        }
        
        setIsInitialized(true);
        console.log('=== Инициализация завершена ===');
      } catch (error) {
        console.error('Ошибка при инициализации приложения:', error);
        setIsInitialized(true);
      }
    };
    
    // Запускаем инициализацию только один раз
    if (!isInitialized) {
      initializeApp();
    }
  }, []); // Пустой массив зависимостей - выполняется только при монтировании
  
  // Сохраняем состояние при изменении пути проекта
  useEffect(() => {
    if (isInitialized && state.projectPath) {
      console.log('Сохранение пути последнего проекта:', state.projectPath);
      AppStateService.saveLastProjectPath(state.projectPath);
    }
  }, [state.projectPath, isInitialized]);
  
  // Сохраняем активные элементы при их изменении
  useEffect(() => {
    if (isInitialized) {
      console.log('Сохранение активных элементов');
      AppStateService.saveActiveElements(
        state.activeTab,
        state.activeContextBlockId,
        state.activePromptBlockId
      );
    }
  }, [
    state.activeTab,
    state.activeContextBlockId,
    state.activePromptBlockId,
    isInitialized
  ]);
  
  // Сохраняем пути к папкам при их изменении
  useEffect(() => {
    if (isInitialized) {
      const hasChanges = state.projectFolder || 
                        state.contextDataFolder || 
                        state.templateFolder;
      
      if (hasChanges) {
        console.log('Сохранение путей к папкам');
        AppStateService.saveFolderPaths({
          projectFolder: state.projectFolder,
          contextDataFolder: state.contextDataFolder,
          templateFolder: state.templateFolder
        });
      }
    }
  }, [
    state.projectFolder,
    state.contextDataFolder,
    state.templateFolder,
    isInitialized
  ]);
  
  // Показываем загрузку пока не инициализировано
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка приложения...</p>
        </div>
      </div>
    );
  }
  
  return children;
};

export default AppInitializer;