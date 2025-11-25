// src/components/prompt/PromptBlockItem.js
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

const PromptBlockItem = ({ block, isActive }) => {
  const { t } = useTranslation();
  const { state, actions, getSelectedContextsTotalChars } = useApp();
  const { contextBlocks } = state;

  // Список выбранных элементов контекста (проверка на наличие)
  const promptContextSelections = Array.isArray(block.selectedContexts) ? block.selectedContexts : [];
  
  // Состояния для управления отображением и поиском элементов
  const [expandedBlocks, setExpandedBlocks] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [searchQueries, setSearchQueries] = useState({});

  // Подсчёт символов
  const totalChars = useMemo(() => {
    try {
      return getSelectedContextsTotalChars(block.id);
    } catch (error) {
      console.error('Error counting characters:', error);
      return 0;
    }
  }, [block.id, getSelectedContextsTotalChars, promptContextSelections]);

  // Удаление промпт-блока
  const handleDeleteBlock = (e) => {
    e.stopPropagation();
    console.log(`Deleting prompt block: ${block.id}`);
    actions.deletePromptBlock(block.id);
  };

  // Активация блока для редактирования
  const handleBlockClick = () => {
    console.log(`Activating prompt block for editing: ${block.id}`);
    actions.setActivePromptBlock(block.id);
  };

  // Переключение видимости элементов контекст-блока
  const toggleBlockExpansion = (contextBlockId, e) => {
    e.stopPropagation();
    console.log(`Toggling visibility of block items: ${contextBlockId}`);
    setExpandedBlocks(prev => ({
      ...prev,
      [contextBlockId]: !prev[contextBlockId]
    }));
  };
  
  // Переключение видимости подэлементов в контекст-блоке
  const toggleItemExpansion = (contextBlockId, itemId, e) => {
    e.stopPropagation();
    console.log(`Toggling visibility of subitems for item ${itemId} in block ${contextBlockId}`);
    const key = `${contextBlockId}-${itemId}`;
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Обработка изменения поискового запроса
  const handleSearchChange = (contextBlockId, value, e) => {
    e.stopPropagation();
    setSearchQueries(prev => ({
      ...prev,
      [contextBlockId]: value
    }));
  };

  // Проверка выбранности подэлемента
  const isContextSubItemSelected = (blockId, itemId, subItemId) => {
    const sel = promptContextSelections.find((s) => s && s.blockId === blockId);
    if (!sel) return false;
    
    // Проверка наличия массива subItemIds
    if (!Array.isArray(sel.subItemIds)) return false;
    
    return sel.subItemIds.includes(`${itemId}.${subItemId}`);
  };

  // Выбор/снятие контекст-блока целиком
  const handleContextSelection = (contextBlockId, checked, e) => {
    e.stopPropagation();
    console.log(`Changing context block selection: ${contextBlockId}, selected: ${checked}`);
    
    let newSelections = [...promptContextSelections];
    if (checked) {
      const cBlock = contextBlocks.find((b) => b.id === contextBlockId);
      if (cBlock && Array.isArray(cBlock.items)) {
        // Выбираем все элементы и подэлементы
        const allItemIds = cBlock.items.map((item) => item.id);
        
        // Собираем все ID подэлементов в формате "itemId.subItemId"
        const allSubItemIds = cBlock.items.reduce((acc, item) => {
          if (Array.isArray(item.subItems) && item.subItems.length > 0) {
            acc.push(...item.subItems.map(subItem => `${item.id}.${subItem.id}`));
          }
          return acc;
        }, []);
        
        // Если уже есть выбор для этого блока, обновляем его
        const selIndex = newSelections.findIndex(s => s && s.blockId === contextBlockId);
        if (selIndex !== -1) {
          newSelections[selIndex] = {
            ...newSelections[selIndex],
            itemIds: allItemIds,
            subItemIds: allSubItemIds
          };
        } else {
          // Иначе добавляем новый выбор
          newSelections.push({
            blockId: contextBlockId,
            itemIds: allItemIds,
            subItemIds: allSubItemIds
          });
        }
      }
    } else {
      // Удаляем выбор для блока
      newSelections = newSelections.filter((s) => s && s.blockId !== contextBlockId);
    }
    actions.updateSelectedContexts(block.id, newSelections);
    
    // При выборе блока автоматически разворачиваем его элементы
    if (checked) {
      setExpandedBlocks(prev => ({
        ...prev,
        [contextBlockId]: true
      }));
    }
  };

  // Выбрать все элементы, соответствующие поисковому запросу
  const handleSelectFiltered = (contextBlockId, e) => {
    e.stopPropagation();
    const cBlock = contextBlocks.find((b) => b.id === contextBlockId);
    if (!cBlock || !Array.isArray(cBlock.items)) return;
    
    const searchQuery = (searchQueries[contextBlockId] || '').toLowerCase();
    
    // Фильтрация элементов по поисковому запросу
    let filteredItems = cBlock.items;
    if (searchQuery) {
      filteredItems = cBlock.items.filter(item => 
        item.title.toLowerCase().includes(searchQuery)
      );
    }
    
    // Получаем ID отфильтрованных элементов
    const filteredItemIds = filteredItems.map(item => item.id);
    
    // Собираем все ID подэлементов для всех отфильтрованных элементов
    const filteredSubItemIds = filteredItems.reduce((acc, item) => {
      if (Array.isArray(item.subItems) && item.subItems.length > 0) {
        acc.push(...item.subItems.map(subItem => `${item.id}.${subItem.id}`));
      }
      return acc;
    }, []);
    
    // Обновляем выборы
    let newSelections = [...promptContextSelections];
    const selIndex = newSelections.findIndex((s) => s && s.blockId === contextBlockId);
    
    if (selIndex === -1) {
      // Если выбора для этого блока нет, создаем новый
      newSelections.push({
        blockId: contextBlockId,
        itemIds: filteredItemIds,
        subItemIds: filteredSubItemIds
      });
    } else {
      // Объединяем существующие выбранные элементы с новыми отфильтрованными
      const existingItemIds = Array.isArray(newSelections[selIndex].itemIds) 
        ? newSelections[selIndex].itemIds 
        : [];
      
      const existingSubItemIds = Array.isArray(newSelections[selIndex].subItemIds) 
        ? newSelections[selIndex].subItemIds 
        : [];
      
      newSelections[selIndex] = {
        ...newSelections[selIndex],
        itemIds: Array.from(new Set([...existingItemIds, ...filteredItemIds])),
        subItemIds: Array.from(new Set([...existingSubItemIds, ...filteredSubItemIds]))
      };
    }
    
    actions.updateSelectedContexts(block.id, newSelections);
  };

  // Отменить выбор всех элементов, соответствующих поисковому запросу
  const handleDeselectFiltered = (contextBlockId, e) => {
    e.stopPropagation();
    const cBlock = contextBlocks.find((b) => b.id === contextBlockId);
    if (!cBlock || !Array.isArray(cBlock.items)) return;
    
    const searchQuery = (searchQueries[contextBlockId] || '').toLowerCase();
    
    // Обновляем выборы
    let newSelections = [...promptContextSelections];
    const selIndex = newSelections.findIndex((s) => s && s.blockId === contextBlockId);
    if (selIndex === -1) return;
    
    if (searchQuery) {
      // Если есть поисковый запрос, удаляем только отфильтрованные элементы
      const itemIdsToRemove = cBlock.items
        .filter(item => item.title.toLowerCase().includes(searchQuery))
        .map(item => item.id);
      
      // Собираем ID подэлементов для удаления
      const subItemIdsToRemove = cBlock.items
        .filter(item => item.title.toLowerCase().includes(searchQuery))
        .reduce((acc, item) => {
          if (Array.isArray(item.subItems) && item.subItems.length > 0) {
            acc.push(...item.subItems.map(subItem => `${item.id}.${subItem.id}`));
          }
          return acc;
        }, []);
      
      // Проверка на наличие массивов
      const currentItemIds = Array.isArray(newSelections[selIndex].itemIds) 
        ? newSelections[selIndex].itemIds 
        : [];
      
      const currentSubItemIds = Array.isArray(newSelections[selIndex].subItemIds) 
        ? newSelections[selIndex].subItemIds 
        : [];
      
      // Фильтруем ID элементов и подэлементов
      const remainingItemIds = currentItemIds.filter(id => !itemIdsToRemove.includes(id));
      const remainingSubItemIds = currentSubItemIds.filter(id => !subItemIdsToRemove.includes(id));
      
      if (remainingItemIds.length === 0 && remainingSubItemIds.length === 0) {
        // Если не осталось выбранных элементов и подэлементов, удаляем запись
        newSelections.splice(selIndex, 1);
      } else {
        // Иначе обновляем списки
        newSelections[selIndex] = {
          ...newSelections[selIndex],
          itemIds: remainingItemIds,
          subItemIds: remainingSubItemIds
        };
      }
    } else {
      // Если нет поискового запроса, удаляем все элементы и подэлементы
      newSelections.splice(selIndex, 1);
    }
    
    actions.updateSelectedContexts(block.id, newSelections);
  };

  // Выбор/снятие отдельного элемента контекста
  const handleItemSelection = (contextBlockId, itemId, checked, e) => {
    e.stopPropagation();
    console.log(`Changing context item selection: block ${contextBlockId}, item ${itemId}, selected: ${checked}`);
    
    let newSelections = [...promptContextSelections];
    const selIndex = newSelections.findIndex((s) => s && s.blockId === contextBlockId);
    
    // Находим элемент
    const cBlock = contextBlocks.find(b => b.id === contextBlockId);
    if (!cBlock || !Array.isArray(cBlock.items)) return;
    
    const item = cBlock.items.find(i => i.id === itemId);
    if (!item) return;
    
    if (selIndex === -1) {
      // Если выбора для этого блока еще нет
      if (checked) {
        newSelections.push({
          blockId: contextBlockId,
          itemIds: [itemId],
          subItemIds: [] // Теперь не добавляем автоматически подэлементы
        });
      }
    } else {
      // Обновляем существующий выбор
      // Проверка на наличие массивов
      const currentItemIds = Array.isArray(newSelections[selIndex].itemIds) 
        ? newSelections[selIndex].itemIds 
        : [];
      
      const currentSubItemIds = Array.isArray(newSelections[selIndex].subItemIds) 
        ? newSelections[selIndex].subItemIds 
        : [];
      
      let itemIds = [...currentItemIds];
      let subItemIds = [...currentSubItemIds];
      
      if (checked) {
        // Добавляем элемент без автоматического добавления подэлементов
        itemIds.push(itemId);
      } else {
        // Удаляем элемент
        itemIds = itemIds.filter(id => id !== itemId);
        // Оставляем подэлементы удаленного элемента - они теперь независимы
      }
      
      if (itemIds.length === 0 && subItemIds.length === 0) {
        // Если не осталось выбранных элементов, удаляем запись
        newSelections.splice(selIndex, 1);
      } else {
        // Обновляем выбор
        newSelections[selIndex] = {
          ...newSelections[selIndex],
          itemIds,
          subItemIds
        };
      }
    }
    
    actions.updateSelectedContexts(block.id, newSelections);
  };
  
  // Выбор/снятие отдельного подэлемента контекста
  const handleSubItemSelection = (contextBlockId, itemId, subItemId, checked, e) => {
    e.stopPropagation();
    console.log(`Changing subitem selection: block ${contextBlockId}, item ${itemId}, subitem ${subItemId}, selected: ${checked}`);
    
    let newSelections = [...promptContextSelections];
    const selIndex = newSelections.findIndex((s) => s && s.blockId === contextBlockId);
    const subItemKey = `${itemId}.${subItemId}`;
    
    if (selIndex === -1) {
      // Если выбора для этого блока еще нет
      if (checked) {
        newSelections.push({
          blockId: contextBlockId,
          itemIds: [],
          subItemIds: [subItemKey]
        });
      }
    } else {
      // Обновляем существующий выбор
      // Проверка на наличие массива subItemIds
      const currentSubItemIds = Array.isArray(newSelections[selIndex].subItemIds) 
        ? newSelections[selIndex].subItemIds 
        : [];
      
      let subItemIds = [...currentSubItemIds];
      
      if (checked) {
        // Добавляем подэлемент
        subItemIds.push(subItemKey);
      } else {
        // Удаляем подэлемент
        subItemIds = subItemIds.filter(id => id !== subItemKey);
      }
      
      // Проверяем, остались ли выбранные элементы или подэлементы
      const hasItems = Array.isArray(newSelections[selIndex].itemIds) && 
                     newSelections[selIndex].itemIds.length > 0;
                     
      if (!hasItems && subItemIds.length === 0) {
        // Если не осталось выбранных элементов и подэлементов, удаляем запись
        newSelections.splice(selIndex, 1);
      } else {
        // Обновляем выбор
        newSelections[selIndex] = {
          ...newSelections[selIndex],
          subItemIds: subItemIds
        };
      }
    }
    
    actions.updateSelectedContexts(block.id, newSelections);
  };

  // Проверка выбранности контекст-блоков и элементов
  const isContextBlockSelected = (id) => {
    return promptContextSelections.some((s) => s && s.blockId === id);
  };
  
  const isContextItemSelected = (blockId, itemId) => {
    const sel = promptContextSelections.find((s) => s && s.blockId === blockId);
    if (!sel || !Array.isArray(sel.itemIds)) return false;
    return sel.itemIds.includes(itemId);
  };
  
  const getSelectedItemsCount = (blockId) => {
    const sel = promptContextSelections.find((s) => s && s.blockId === blockId);
    if (!sel) return 0;
    
    // Проверка на наличие массивов
    if (!Array.isArray(sel.itemIds) && !Array.isArray(sel.subItemIds)) {
      return 0;
    }
    
    // Считаем выбранные элементы
    const selectedItemsCount = Array.isArray(sel.itemIds) ? sel.itemIds.length : 0;
    
    // Считаем уникальные элементы с выбранными подэлементами
    // (ID подэлементов хранятся в формате "itemId.subItemId")
    const itemsWithSelectedSubItems = Array.isArray(sel.subItemIds)
      ? sel.subItemIds.map(id => id.split('.')[0])
      : [];
    
    // Находим уникальные ID элементов, у которых выбраны подэлементы,
    // но которые не выбраны целиком
    const uniqueItemsWithSubItems = new Set(
      itemsWithSelectedSubItems.filter(id => 
        Array.isArray(sel.itemIds) ? !sel.itemIds.includes(parseInt(id)) : true
      )
    );
    
    return selectedItemsCount + uniqueItemsWithSubItems.size;
  };
  
  const getSelectedSubItemsCount = (blockId, itemId) => {
    const sel = promptContextSelections.find((s) => s && s.blockId === blockId);
    if (!sel || !Array.isArray(sel.subItemIds)) return 0;
    
    // Считаем подэлементы с префиксом "itemId."
    return sel.subItemIds.filter(id => id.startsWith(`${itemId}.`)).length;
  };
  
  // Проверка частичного выбора блока (не все элементы выбраны)
  const isContextBlockPartiallySelected = (blockId) => {
    const cBlock = contextBlocks.find((b) => b.id === blockId);
    if (!cBlock || !Array.isArray(cBlock.items) || cBlock.items.length === 0) return false;
    
    const sel = promptContextSelections.find((s) => s && s.blockId === blockId);
    if (!sel) return false;
    
    // Проверка на наличие массивов
    if (!Array.isArray(sel.itemIds) && !Array.isArray(sel.subItemIds)) {
      return false;
    }
    
    // Считаем общее количество элементов и подэлементов в блоке
    const totalItemCount = cBlock.items.length;
    const totalSubItemCount = cBlock.items.reduce((count, item) => {
      return count + (Array.isArray(item.subItems) ? item.subItems.length : 0);
    }, 0);
    
    // Считаем выбранные элементы и подэлементы
    const selectedItemCount = Array.isArray(sel.itemIds) ? sel.itemIds.length : 0;
    const selectedSubItemCount = Array.isArray(sel.subItemIds) ? sel.subItemIds.length : 0;
    
    // Если не все элементы выбраны полностью или есть выбранные подэлементы,
    // но их количество не совпадает с общим, возвращаем true (частичный выбор)
    return (selectedItemCount > 0 && selectedItemCount < totalItemCount) || 
           (selectedSubItemCount > 0 && selectedSubItemCount < totalSubItemCount);
  };
  
  // Проверка частичного выбора элемента (выбраны не все подэлементы)
  const isContextItemPartiallySelected = (blockId, itemId) => {
    const cBlock = contextBlocks.find((b) => b.id === blockId);
    if (!cBlock) return false;
    
    const item = cBlock.items.find(i => i.id === itemId);
    if (!item || !Array.isArray(item.subItems) || item.subItems.length === 0) return false;
    
    // Если элемент уже выбран полностью, возвращаем false
    if (isContextItemSelected(blockId, itemId)) return false;
    
    // Проверяем, выбраны ли какие-либо подэлементы
    const selectedSubItemsCount = getSelectedSubItemsCount(blockId, itemId);
    return selectedSubItemsCount > 0 && selectedSubItemsCount < item.subItems.length;
  };

  // Список контекст-блоков
  const contextBlocksList = useMemo(() => {
    return contextBlocks.map((cBlock) => {
      if (!cBlock) return null;
      
      const isSelected = isContextBlockSelected(cBlock.id);
      const isPartiallySelected = isContextBlockPartiallySelected(cBlock.id);
      const isExpanded = !!expandedBlocks[cBlock.id];
      const searchQuery = searchQueries[cBlock.id] || '';
      
      // Убедимся, что у блока есть массив items
      if (!Array.isArray(cBlock.items)) {
        cBlock.items = [];
      }
      
      // Фильтрация элементов по поисковому запросу
      let filteredItems = cBlock.items;
      if (searchQuery) {
        filteredItems = cBlock.items.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Подсчет выбранных элементов
      const selectedCount = getSelectedItemsCount(cBlock.id);
      const totalCount = cBlock.items.length;
      
      return (
        <div
          key={cBlock.id}
          className="bg-gray-750 p-3 rounded-md mb-3"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <label className="flex items-center">
                <div className="relative">
                  <input
                    type="checkbox"
                    className={`mr-2 bg-gray-700 border-gray-600 ${isPartiallySelected ? "opacity-50" : ""}`}
                    checked={isSelected}
                    onChange={(e) => handleContextSelection(cBlock.id, e.target.checked, e)}
                  />
                  {isPartiallySelected && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ marginLeft: "2px" }}
                    >
                      <div className="w-2 h-2 bg-white rounded-sm"></div>
                    </div>
                  )}
                </div>
                <span className="mr-2">{cBlock.title}</span>
              </label>
              <button
                className={`p-1 text-xs ${isExpanded ? 'text-blue-400' : 'text-gray-400'} hover:text-blue-300 rounded ml-2`}
                onClick={(e) => toggleBlockExpansion(cBlock.id, e)}
                title={isExpanded ? t('blockItem.context.collapse') : t('blockItem.context.expand')}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 transform ${isExpanded ? 'rotate-180' : ''} transition-transform`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <span className="text-xs text-gray-400">
              {selectedCount}/{totalCount} {t('blockItem.prompt.selected')}
            </span>
          </div>
          
          {isExpanded && (
            <div className="mt-2 mb-2">
              <div className="flex items-center mb-2">
                <input
                  type="text"
                  className="flex-1 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder={t('blockItem.prompt.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(cBlock.id, e.target.value, e)}
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  className="ml-2 px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-600"
                  onClick={(e) => handleSelectFiltered(cBlock.id, e)}
                  title={t('blockItem.prompt.selectAllTooltip')}
                >
                  {t('blockItem.prompt.selectAll')}
                </button>
                <button
                  className="ml-2 px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
                  onClick={(e) => handleDeselectFiltered(cBlock.id, e)}
                  title={t('blockItem.prompt.deselectAllTooltip')}
                >
                  {t('blockItem.prompt.deselectAll')}
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto pl-4 pr-2 py-1 border border-gray-700 rounded bg-gray-800">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    if (!item) return null;
                    
                    const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
                    const isItemSelected = isContextItemSelected(cBlock.id, item.id);
                    const isItemPartiallySelected = isContextItemPartiallySelected(cBlock.id, item.id);
                    const isItemExpanded = !!expandedItems[`${cBlock.id}-${item.id}`];
                    const selectedSubItems = getSelectedSubItemsCount(cBlock.id, item.id);
                    
                    return (
                      <div className="mb-2" key={item.id}>
                        <div className="flex items-center">
                          <div className="relative">
                            <input
                              type="checkbox"
                              className={`mr-2 bg-gray-700 border-gray-600 ${isItemPartiallySelected ? "opacity-50" : ""}`}
                              checked={isItemSelected}
                              onChange={(e) => handleItemSelection(cBlock.id, item.id, e.target.checked, e)}
                            />
                            {isItemPartiallySelected && (
                              <div 
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                style={{ marginLeft: "2px" }}
                              >
                                <div className="w-2 h-2 bg-white rounded-sm"></div>
                              </div>
                            )}
                          </div>
                          
                          <span className="flex-1">{item.title}</span>
                          
                          {hasSubItems && (
                            <button
                              className={`p-1 text-xs ${isItemExpanded ? 'text-blue-400' : 'text-gray-400'} hover:text-blue-300 rounded ml-1 mr-2`}
                              onClick={(e) => toggleItemExpansion(cBlock.id, item.id, e)}
                              title={isItemExpanded ? t('blockItem.prompt.collapseSubItems') : t('blockItem.prompt.expandSubItems')}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-3 w-3 transform ${isItemExpanded ? 'rotate-180' : ''} transition-transform`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          )}
                          
                          {hasSubItems && (
                            <span className="ml-0 text-xs text-gray-400">
                              {selectedSubItems}/{item.subItems.length}
                            </span>
                          )}
                          
                          <span className="ml-2 text-xs text-gray-400">{item.chars} {t('blockItem.prompt.characters')}</span>
                        </div>
                        
                        {/* Подэлементы (отображаются, только если элемент развернут) */}
                        {hasSubItems && isItemExpanded && (
                          <div className="pl-6 mt-1">
                            {item.subItems.map((subItem) => (
                              <div className="flex items-center py-1" key={subItem.id}>
                                <input
                                  type="checkbox"
                                  className="mr-2 bg-gray-700 border-gray-600"
                                  checked={isContextSubItemSelected(cBlock.id, item.id, subItem.id)}
                                  onChange={(e) => handleSubItemSelection(cBlock.id, item.id, subItem.id, e.target.checked, e)}
                                />
                                <span className="flex-1 text-sm">{subItem.title}</span>
                                <span className="ml-2 text-xs text-gray-400">{subItem.chars} {t('blockItem.prompt.characters')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="py-2 text-center text-gray-500">
                    {searchQuery ? t('blockItem.prompt.nothingFound') : t('blockItem.prompt.noItems')}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    }).filter(Boolean); // Фильтруем null-элементы
  }, [
    contextBlocks,
    promptContextSelections,
    expandedBlocks,
    expandedItems,
    searchQueries,
    actions
  ]);

  return (
    <div
      className={`mb-6 p-4 border rounded-md cursor-pointer transition-all duration-300 ${
        isActive 
          ? 'border-green-500 shadow-lg bg-green-900 bg-opacity-20 active-prompt-block' 
          : 'border-green-900 hover:border-green-700 bg-gray-800 hover:bg-gray-750'
      }`}
      onClick={handleBlockClick}
      data-block-type="prompt"
      data-block-id={block.id}
    >
      {/* Заголовок блока */}
      <div className="flex justify-between items-center mb-3">
        <h3 className={`font-medium text-lg ${isActive ? 'text-green-300' : 'text-green-400'}`}>
          {block.title}
        </h3>
        <div className="flex items-center space-x-2">
          {/* Кнопка удаления */}
          <button
            className="p-1 text-xs text-red-400 hover:text-red-300 rounded"
            onClick={handleDeleteBlock}
            title={t('blockItem.prompt.deleteTooltip')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 7l-.867 12.142A2
                 2 0 0116.138 21H7.862a2 2
                 0 01-1.995-1.858L5
                 7m5 4v6m4-6v6m1-10V4a1
                 1 0 00-1-1h-4a1 1 0
                 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Список контекстных блоков */}
      {contextBlocksList}

      {/* Общее количество символов */}
      <div className="flex justify-end">
        <span className="text-sm text-gray-400">{t('blockItem.prompt.total')}: {totalChars} {t('blockItem.prompt.characters')}</span>
      </div>
    </div>
  );
};

export default PromptBlockItem;