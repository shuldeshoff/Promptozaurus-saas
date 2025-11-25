// src/components/context/ContextBlockList.js
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import ContextBlockItem from './ContextBlockItem';

const ContextBlockList = () => {
  const { t } = useTranslation();
  const { state } = useApp();
  const { activeContextBlock, contextBlocks } = state;
  
  console.log('Рендеринг ContextBlockList, блоков:', contextBlocks.length, 'активный блок:', activeContextBlock);
  
  if (contextBlocks.length === 0) {
    return (
      <div className="text-center py-6 bg-gray-800 rounded-lg mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-gray-400 mb-2">{t('blocks.context.empty.title')}</p>
        <p className="text-sm text-gray-500">{t('blocks.context.empty.description')}</p>
      </div>
    );
  }
  
  return (
    <div className="context-blocks-container">
      {contextBlocks.map((block) => (
        <ContextBlockItem 
          key={block.id} 
          block={block} 
          isActive={block.id === activeContextBlock} 
        />
      ))}
    </div>
  );
};

export default ContextBlockList;