// src/components/context/ContextBlockItem.js - Компонент для отображения блока контекста с улучшенной иерархией
// @description: Расширенное отображение вложенных контекстов с автораскрытием, индикаторами и древовидной структурой
// @updated: 2025-06-25 - добавлены улучшения UX для вложенных структур
import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

const ContextBlockItem = ({ block, isActive }) => {
  const { t } = useTranslation();
  const { actions } = useApp();
  const [expandedItems, setExpandedItems] = useState({});
  const [autoExpandInitialized, setAutoExpandInitialized] = useState(false);
  
  console.log('Rendering ContextBlockItem:', block.title, 'active:', isActive, 'stats:', blockStats);
  
  // Автораскрытие элементов с только подэлементами при первой загрузке
  useEffect(() => {
    if (!autoExpandInitialized && normalizedItems.length > 0) {
      const autoExpandState = {};
      normalizedItems.forEach(item => {
        const itemContent = item.content && item.content.trim() ? item.content.trim() : '';
        const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
        
        // Автораскрываем элементы без основного контента, но с подэлементами
        if (itemContent.length === 0 && hasSubItems) {
          autoExpandState[item.id] = true;
        }
      });
      
      if (Object.keys(autoExpandState).length > 0) {
        setExpandedItems(autoExpandState);
        console.log('Auto-expanding items without content:', Object.keys(autoExpandState));
      }
      
      setAutoExpandInitialized(true);
    }
  }, [normalizedItems, autoExpandInitialized]);
  
  // Обработчик клика на блок - активирует блок в правой панели
  const handleBlockClick = () => {
    console.log(`Click on context block: ${block.title} (id: ${block.id})`);
    actions.setActiveContextBlock(block.id);
  };
  
  // Обработчик удаления блока контекста
  const handleDeleteBlock = (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события на родительские элементы
    console.log(`Delete block button pressed: ${block.title} (id: ${block.id})`);
    actions.deleteContextBlock(block.id);
  };
  
  // Обработчик удаления элемента контекста
  const handleDeleteItem = (itemId, e) => {
    e.stopPropagation(); // Предотвращаем всплытие события на родительские элементы
    console.log(`Delete item button pressed: ${itemId} from block ${block.id}`);
    actions.deleteContextItem(block.id, itemId);
  };
  
  // Обработчик удаления подэлемента контекста
  const handleDeleteSubItem = (itemId, subItemId, e) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Delete subitem button pressed: ${subItemId} from item ${itemId}`);
    actions.deleteContextSubItem(block.id, itemId, subItemId);
  };
  
  // Обработчик добавления элемента - предотвращаем активацию блока
  const handleAddItem = (e) => {
    e.stopPropagation();
    console.log(`Adding item to block: ${block.title} (id: ${block.id})`);
    actions.addContextItem(block.id);
  };
  
  // Обработчик добавления подэлемента
  const handleAddSubItem = (itemId, e) => {
    e.stopPropagation();
    console.log(`Adding subitem to item: ${itemId}`);
    actions.addContextSubItem(block.id, itemId);
  };
  
  // Обработчик экспорта блока контекста
  const handleExportBlock = (e) => {
    e.stopPropagation(); // Предотвращаем всплытие события
    console.log(`Exporting context block: ${block.title} (id: ${block.id})`);
    actions.exportContextBlock(block.id);
  };
  
  // Функция для переключения состояния развернутости элемента
  const toggleItemExpanded = (itemId, e) => {
    e.stopPropagation(); // Предотвращаем всплытие клика
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Проверка на наличие всех необходимых полей и их инициализация при необходимости
  const normalizedItems = Array.isArray(block.items) 
    ? block.items.map(item => ({
        ...item,
        subItems: Array.isArray(item.subItems) ? item.subItems : []
      }))
    : [];
  
  // Вычисление статистики блока
  const blockStats = normalizedItems.reduce((stats, item) => {
    // Символы в самом элементе
    const itemContent = item.content && item.content.trim() ? item.content.trim() : '';
    const itemChars = itemContent.length;
    
    // Количество и символы в подэлементах
    const subItemsCount = Array.isArray(item.subItems) ? item.subItems.length : 0;
    const subItemsChars = Array.isArray(item.subItems) 
      ? item.subItems.reduce((subSum, subItem) => subSum + (subItem.chars || 0), 0)
      : 0;
    
    stats.totalChars += itemChars + subItemsChars;
    stats.totalSubItems += subItemsCount;
    stats.itemsWithContent += itemContent.length > 0 ? 1 : 0;
    stats.itemsWithOnlySubItems += (itemContent.length === 0 && subItemsCount > 0) ? 1 : 0;
    
    return stats;
  }, { totalChars: 0, totalSubItems: 0, itemsWithContent: 0, itemsWithOnlySubItems: 0 });
  
  const totalChars = blockStats.totalChars;
  const hasOnlySubItems = blockStats.itemsWithContent === 0 && blockStats.totalSubItems > 0;
  const mixedContent = blockStats.itemsWithContent > 0 && blockStats.totalSubItems > 0;
  
  return (
    <div 
      className={`mb-6 p-4 border rounded-md cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'border-blue-500 shadow-lg bg-blue-900 bg-opacity-20 active-context-block' 
          : 'border-blue-900 hover:border-blue-700 bg-gray-800 hover:bg-gray-750'
      }`}
      onClick={handleBlockClick}
      data-block-type="context"
      data-block-id={block.id}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 flex-1">
          <h3 className={`font-semibold text-lg ${isActive ? 'text-blue-300' : 'text-blue-400'}`}>{block.title}</h3>
          
          {/* Индикаторы структуры блока */}
          <div className="flex items-center gap-1">
            {blockStats.totalSubItems > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                hasOnlySubItems 
                  ? 'bg-amber-900 text-amber-300 border border-amber-700' 
                  : 'bg-blue-900 text-blue-300 border border-blue-700'
              }`}>
                {blockStats.totalSubItems} {t('blockItem.context.subItems')}
              </span>
            )}
            
            {hasOnlySubItems && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-orange-900 text-orange-300 border border-orange-700" title={t('blockItem.context.onlyStructureTooltip')}>
                📋 {t('blockItem.context.onlyStructure')}
              </span>
            )}
            
            {mixedContent && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-900 text-green-300 border border-green-700" title={t('blockItem.context.mixedTooltip')}>
                📄+ {t('blockItem.context.mixed')}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-400">
            <span className="font-medium">{totalChars}</span> {t('blockItem.context.characters')}
            {blockStats.totalSubItems > 0 && (
              <span className="ml-1 text-gray-500">• {normalizedItems.length} {t('blockItem.context.elements')}</span>
            )}
          </div>
          
          {/* Кнопка экспорта блока */}
          <button 
            className="ml-2 p-1 text-xs text-green-400 hover:text-green-300 rounded"
            onClick={handleExportBlock}
            title={t('blockItem.context.export')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0L8 8m4-4v12" />
            </svg>
          </button>
          
          {/* Кнопка удаления блока */}
          <button 
            className="ml-2 p-1 text-xs text-red-400 hover:text-red-300 rounded"
            onClick={handleDeleteBlock}
            title={t('blockItem.context.delete')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
      <div className="pl-4 border-l-2 border-blue-800 relative">
        {/* Декоративная вертикальная линия */}
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 opacity-30"></div>
        
        {normalizedItems.map((item, itemIndex) => {
          const itemContent = item.content && item.content.trim() ? item.content.trim() : '';
          const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
          const isEmptyWithSubItems = itemContent.length === 0 && hasSubItems;
          const isLastItem = itemIndex === normalizedItems.length - 1;
          
          return (
            <div key={item.id} className="mb-3 relative">
              {/* Горизонтальная соединительная линия */}
              <div className="absolute left-[-16px] top-3 w-4 h-0.5 bg-blue-700 opacity-40"></div>
              
              <div className="flex justify-between group">
                <div className="flex items-center flex-1 mr-2">
                  {/* Улучшенная иконка разворачивания */}
                  {hasSubItems && (
                    <button
                      className={`p-1.5 text-xs rounded-md mr-2 transition-all duration-200 ${
                        expandedItems[item.id] 
                          ? 'text-blue-300 bg-blue-900 bg-opacity-30' 
                          : 'text-gray-400 hover:text-blue-400 hover:bg-blue-900 hover:bg-opacity-20'
                      }`}
                      onClick={(e) => toggleItemExpanded(item.id, e)}
                      title={expandedItems[item.id] ? t('blockItem.context.collapse') : t('blockItem.context.expand')}
                    >
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-3 w-3 transition-transform duration-200 ${expandedItems[item.id] ? 'rotate-90' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                  
                  {/* Индикатор типа элемента */}
                  <div className="flex items-center gap-2 flex-1">
                    {isEmptyWithSubItems ? (
                      <span className="flex items-center gap-1 text-amber-400 text-sm font-medium">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        {item.title}
                        <span className="text-xs text-amber-500">({item.subItems.length})</span>
                      </span>
                    ) : (
                      <span className={`truncate ${
                        hasSubItems 
                          ? 'text-blue-300 font-medium' 
                          : 'text-gray-300'
                      }`}>
                        {item.title}
                        {hasSubItems && (
                          <span className="ml-1 text-xs text-blue-500">({item.subItems.length})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className={`text-xs mr-2 ${
                    isEmptyWithSubItems 
                      ? 'text-amber-400' 
                      : 'text-gray-400'
                  }`}>
                    {item.chars || 0} {t('blockItem.context.characters')}
                  </span>
                
                {/* Кнопка добавления подэлемента */}
                <button
                  className="ml-1 p-1 text-xs text-blue-400 hover:text-blue-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleAddSubItem(item.id, e)}
                  title={t('blockItem.context.addSubItem')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                
                {/* Кнопка удаления элемента */}
                <button 
                  className="ml-1 p-1 text-xs text-red-400 hover:text-red-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  title={t('blockItem.context.deleteItem')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Улучшенное отображение подэлементов */}
            {expandedItems[item.id] && Array.isArray(item.subItems) && item.subItems.length > 0 && (
              <div className="pl-8 mt-2 relative">
                {/* Вертикальная линия для подэлементов */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gray-600 to-gray-700 opacity-50"></div>
                
                <div className="space-y-1">
                  {item.subItems.map((subItem, subIndex) => {
                    const isLastSubItem = subIndex === item.subItems.length - 1;
                    
                    return (
                      <div key={subItem.id} className="flex justify-between py-1.5 group relative">
                        {/* Горизонтальная соединительная линия для подэлементов */}
                        <div className="absolute left-[-16px] top-3 w-4 h-0.5 bg-gray-600 opacity-40"></div>
                        
                        <div className="flex items-center flex-1 mr-2">
                          <span className="w-1 h-1 bg-gray-500 rounded-full mr-2 flex-shrink-0"></span>
                          <span className="text-sm text-gray-300 truncate font-normal">{subItem.title}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-2 font-mono">{subItem.chars || 0} {t('blockItem.context.characters')}</span>
                          
                          {/* Кнопка удаления подэлемента */}
                          <button 
                            className="p-1 text-xs text-red-400 hover:text-red-300 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-900 hover:bg-opacity-20"
                            onClick={(e) => handleDeleteSubItem(item.id, subItem.id, e)}
                            title={t('blockItem.context.deleteSubItem')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-3">
        <button 
          className="px-2 py-1 text-sm bg-blue-900 text-blue-200 rounded hover:bg-blue-800"
          onClick={handleAddItem}
        >
          {t('blockItem.context.addItem')}
        </button>
      </div>
    </div>
  );
};

export default ContextBlockItem;