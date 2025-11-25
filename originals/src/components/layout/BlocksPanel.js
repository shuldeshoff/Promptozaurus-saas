// src/components/layout/BlocksPanel.js - Компонент панели блоков (средняя колонка)
// @description: Отображает только активный блок контекста или промпта
// @updated: 2025-11-17 - переработка для отображения одного активного блока
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import ContextBlockItem from '../context/ContextBlockItem';
import PromptBlockItem from '../prompt/PromptBlockItem';

const BlocksPanel = () => {
  const { t } = useTranslation();
  const { state } = useApp();
  const { activeTab, activeContextBlock, activePromptBlock, contextBlocks, promptBlocks } = state;

  console.log('Рендеринг BlocksPanel, активная вкладка:', activeTab, 'активный контекст:', activeContextBlock, 'активный промпт:', activePromptBlock);

  // Находим активный блок контекста
  const currentContextBlock = contextBlocks.find(block => block.id === activeContextBlock);

  // Находим активный блок промпта
  const currentPromptBlock = promptBlocks.find(block => block.id === activePromptBlock);

  // Компонент пустого состояния для контекста
  const EmptyContextState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {contextBlocks.length === 0 ? (
        <>
          <p className="text-gray-400 text-lg mb-2">{t('blocks.context.empty.title')}</p>
          <p className="text-sm text-gray-500 mb-4">{t('blocks.context.empty.description')}</p>
          <p className="text-xs text-gray-600">{t('blocks.context.empty.hint')}</p>
        </>
      ) : (
        <>
          <p className="text-gray-400 text-lg mb-2">{t('blocks.context.noSelection.title')}</p>
          <p className="text-sm text-gray-500">{t('blocks.context.noSelection.description')}</p>
        </>
      )}
    </div>
  );

  // Компонент пустого состояния для промптов
  const EmptyPromptState = () => (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      {promptBlocks.length === 0 ? (
        <>
          <p className="text-gray-400 text-lg mb-2">{t('blocks.prompt.empty.title')}</p>
          <p className="text-sm text-gray-500 mb-4">{t('blocks.prompt.empty.description')}</p>
          <p className="text-xs text-gray-600">{t('blocks.prompt.empty.hint')}</p>
        </>
      ) : (
        <>
          <p className="text-gray-400 text-lg mb-2">{t('blocks.prompt.noSelection.title')}</p>
          <p className="text-sm text-gray-500">{t('blocks.prompt.noSelection.description')}</p>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full h-full border-x border-gray-700 p-4 overflow-y-auto">
      {/* Блок контекста */}
      {activeTab === 'context' && (
        <div className="h-full">
          {currentContextBlock ? (
            <ContextBlockItem
              block={currentContextBlock}
              isActive={true}
            />
          ) : (
            <EmptyContextState />
          )}
        </div>
      )}

      {/* Блок промпта */}
      {activeTab === 'prompt' && (
        <div className="h-full">
          {currentPromptBlock ? (
            <PromptBlockItem
              block={currentPromptBlock}
              isActive={true}
            />
          ) : (
            <EmptyPromptState />
          )}
        </div>
      )}
    </div>
  );
};

export default BlocksPanel;