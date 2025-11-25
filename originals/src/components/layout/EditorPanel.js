// src/components/layout/EditorPanel.js - Компонент панели редактора (правая колонка)
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import ContextEditor from '../context/ContextEditor';
import PromptEditor from '../prompt/PromptEditor';

const EditorPanel = () => {
  const { state } = useApp();
  const { activeTab } = state;
  const [key, setKey] = useState(Date.now());

  // При изменении активной вкладки или активного блока, пересоздаем компонент
  // для гарантии полной перерисовки и корректной инициализации
  useEffect(() => {
    console.log('EditorPanel: обновление ключа для принудительного пересоздания редактора');
    setKey(Date.now());
  }, [activeTab, state.activeContextBlock, state.activePromptBlock]);

  return (
    <div className="flex-1 p-4 bg-gray-900 overflow-y-auto">
      {/* Отображение редактора для контекстных блоков */}
      {activeTab === 'context' && <ContextEditor key={`context-${key}`} />}
      
      {/* Отображение редактора для блоков промптов */}
      {activeTab === 'prompt' && <PromptEditor key={`prompt-${key}`} />}
    </div>
  );
};

export default EditorPanel;