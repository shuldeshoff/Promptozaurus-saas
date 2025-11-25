// src/components/prompt/PromptBlockList.js
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import PromptBlockItem from './PromptBlockItem';

const PromptBlockList = () => {
  const { t } = useTranslation();
  const { state } = useApp();
  const { activePromptBlock, promptBlocks } = state;
  
  console.log('Рендеринг PromptBlockList, блоков:', promptBlocks.length, 'активный блок:', activePromptBlock);
  
  if (promptBlocks.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-800 rounded-lg mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-gray-400 mb-2">{t('blocks.prompt.empty.title')}</p>
        <p className="text-sm text-gray-500">{t('blocks.prompt.empty.description')}</p>
      </div>
    );
  }
  
  return (
    <div className="prompt-blocks-container">
      {promptBlocks.map((block) => (
        <PromptBlockItem 
          key={block.id} 
          block={block} 
          isActive={block.id === activePromptBlock} 
        />
      ))}
    </div>
  );
};

export default PromptBlockList;