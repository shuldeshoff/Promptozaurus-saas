// src/components/context/ContextEditor.js - Редактор контекста в правой панели с улучшенным отображением вложенности
// @description: Расширенный редактор контекста с информативными индикаторами подэлементов и автораскрытием
// @updated: 2025-06-25 - добавлены улучшения UX для вложенных структур в редакторе
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import FullscreenEditor from '../ui/FullscreenEditor';
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut';
import SplitContentModal from '../ui/SplitContentModal';

const ContextEditor = () => {
  const { t } = useTranslation();
  const { state, getActiveContextBlock, actions, generateContextItemName, generateContextSubItemName } = useApp();
  const block = getActiveContextBlock();

  // Получаем глобальное состояние активного элемента/подэлемента
  const globalActiveItemId = state.activeContextItemId;
  const globalActiveSubItemId = state.activeContextSubItemId;
  
  // Состояние для добавления нового элемента
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  
  // Состояние для добавления нового подэлемента
  const [isAddingSubItem, setIsAddingSubItem] = useState(false);
  const [newSubItemTitle, setNewSubItemTitle] = useState('');
  const [parentItemId, setParentItemId] = useState(null);
  
  // Состояние для полноэкранного редактора
  const [fullscreenEditor, setFullscreenEditor] = useState({
    isOpen: false,
    content: '',
    title: '',
    itemId: null,
    subItemId: null
  });
  
  // Состояние для модального окна разделения текста
  const [splitModalState, setSplitModalState] = useState({
    isOpen: false,
    itemId: null,
    subItemId: null, // Добавляем поддержку подэлементов
    content: '',
    title: ''
  });
  
  // Используем глобальное состояние напрямую для подсветки (без локального состояния)
  const activeItemId = globalActiveItemId;
  const activeSubItemId = globalActiveSubItemId;

  // Состояние развернутости блоков
  const [expandedItems, setExpandedItems] = useState({});
  const [autoExpandInitialized, setAutoExpandInitialized] = useState(false);
  
  // Ref для доступа к input элементу
  const newItemInputRef = useRef(null);
  const newSubItemInputRef = useRef(null);
  // Ref для контейнера всего редактора
  const editorContainerRef = useRef(null);
  
  console.log('Рендеринг ContextEditor, активный блок:', block?.title);
  
  // Автораскрытие элементов с только подэлементами при загрузке блока
  useEffect(() => {
    if (block && block.items && block.items.length > 0 && (!autoExpandInitialized || !Object.keys(expandedItems).length)) {
      const normalizedItemsForAutoExpand = Array.isArray(block.items) 
        ? block.items.map(item => ({
            ...item,
            subItems: Array.isArray(item.subItems) ? item.subItems : []
          }))
        : [];
        
      if (normalizedItemsForAutoExpand.length > 0) {
        const autoExpandState = {};
        normalizedItemsForAutoExpand.forEach(item => {
        const itemContent = item.content && item.content.trim() ? item.content.trim() : '';
        const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
        
        // Автораскрываем элементы без основного контента, но с подэлементами
        if (itemContent.length === 0 && hasSubItems) {
          autoExpandState[item.id] = true;
        }
      });
      
      if (Object.keys(autoExpandState).length > 0) {
        setExpandedItems(prev => ({ ...prev, ...autoExpandState }));
        console.log('Автораскрытие элементов без контента в редакторе:', Object.keys(autoExpandState));
      }
        
        setAutoExpandInitialized(true);
      }
    }
  }, [block?.id, block?.items?.length, autoExpandInitialized]);

  // Реакция на изменение глобального активного элемента/подэлемента
  useEffect(() => {
    if (globalActiveItemId !== null) {
      // Если выбран подэлемент, автоматически разворачиваем родительский элемент
      if (globalActiveSubItemId !== null) {
        setExpandedItems(prev => ({
          ...prev,
          [globalActiveItemId]: true
        }));
        console.log(`Автораскрытие элемента ${globalActiveItemId} для отображения подэлемента ${globalActiveSubItemId}`);
      }

      // Прокручиваем к активному элементу/подэлементу
      setTimeout(() => {
        const targetId = globalActiveSubItemId
          ? `subitem-textarea-${globalActiveItemId}-${globalActiveSubItemId}`
          : `item-textarea-${globalActiveItemId}`;
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetElement.focus();
          console.log(`Фокус установлен на ${globalActiveSubItemId ? 'подэлемент' : 'элемент'}`);
        }
      }, 100);
    }
  }, [globalActiveItemId, globalActiveSubItemId]);

  // Обработчик для открытия полноэкранного редактора с активным элементом или подэлементом
  const handleOpenActiveItemEditor = () => {
    if (activeSubItemId && activeItemId && block) {
      // Если активен подэлемент, открываем его
      const activeItem = block.items.find(item => item.id === activeItemId);
      if (!activeItem || !Array.isArray(activeItem.subItems)) return;
      
      const activeSubItem = activeItem.subItems.find(subItem => subItem.id === activeSubItemId);
      if (!activeSubItem) return;
      
      console.log(`Открытие полноэкранного редактора для активного подэлемента ${activeSubItemId}`);
      handleOpenFullscreenEditor(activeItemId, activeSubItem.content || '', activeSubItem.title, activeSubItemId);
    } else if (activeItemId && block) {
      // Если активен только элемент, открываем его
      const activeItem = block.items.find(item => item.id === activeItemId);
      if (!activeItem) return;
      
      console.log(`Открытие полноэкранного редактора для активного элемента ${activeItemId}`);
      handleOpenFullscreenEditor(activeItemId, activeItem.content || '', activeItem.title);
    }
  };
  
  // Регистрация горячей клавиши Ctrl+E
  useKeyboardShortcut({
    'ctrl+e': (e) => {
      // Проверяем, содержит ли родительский элемент активный элемент
      const editorContainer = editorContainerRef.current;
      if (editorContainer && editorContainer.contains(document.activeElement)) {
        console.log('Обнаружено сочетание клавиш Ctrl+E в редакторе контекста');
        handleOpenActiveItemEditor();
      }
    }
  }, [activeItemId, activeSubItemId, block]);
  
  if (!block) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-gray-800 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-300 mb-2">{t('editor.context.noSelection.title')}</p>
          <p className="text-sm text-gray-400">{t('editor.context.noSelection.description')}</p>
        </div>
      </div>
    );
  }
  
  // Нормализация данных блока для обеспечения совместимости со старыми форматами
  const normalizedItems = Array.isArray(block.items) 
    ? block.items.map(item => ({
        ...item,
        content: item.content || '',
        chars: item.chars || 0,
        subItems: Array.isArray(item.subItems) ? item.subItems : []
      }))
    : [];
  
  // Обработчик начала добавления нового элемента
  const handleStartAddingItem = () => {
    console.log('Начало добавления элемента контекста');
    // Генерируем имя по умолчанию и устанавливаем его
    const defaultName = generateContextItemName(block.id);
    console.log('Имя по умолчанию для элемента контекста:', defaultName);
    setNewItemTitle(defaultName);
    setIsAddingItem(true);
    
    // Фокусируемся на поле ввода и выделяем текст после отрисовки компонента
    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
        newItemInputRef.current.select();
      }
    }, 50);
  };
  
  // Обработчик начала добавления нового подэлемента
  const handleStartAddingSubItem = (itemId) => {
    console.log('Начало добавления подэлемента контекста');
    // Генерируем имя по умолчанию и устанавливаем его
    const defaultName = generateContextSubItemName(block.id, itemId);
    console.log('Имя по умолчанию для подэлемента контекста:', defaultName);
    setNewSubItemTitle(defaultName);
    setParentItemId(itemId);
    setIsAddingSubItem(true);
    
    // Фокусируемся на поле ввода и выделяем текст после отрисовки компонента
    setTimeout(() => {
      if (newSubItemInputRef.current) {
        newSubItemInputRef.current.focus();
        newSubItemInputRef.current.select();
      }
    }, 50);
  };
  
  // Обработчик для открытия модального окна разделения текста элемента
  const handleOpenSplitModal = (itemId) => {
    const item = block.items.find(item => item.id === itemId);
    if (!item) return;
    
    setSplitModalState({
      isOpen: true,
      itemId,
      subItemId: null,
      content: item.content || '',
      title: item.title
    });
  };
  
  // Обработчик для открытия модального окна разделения текста подэлемента
  const handleOpenSubItemSplitModal = (itemId, subItemId) => {
    const item = block.items.find(item => item.id === itemId);
    if (!item || !Array.isArray(item.subItems)) return;
    
    const subItem = item.subItems.find(subItem => subItem.id === subItemId);
    if (!subItem) return;
    
    setSplitModalState({
      isOpen: true,
      itemId,
      subItemId,
      content: subItem.content || '',
      title: subItem.title
    });
  };
  
  // Обработчик для применения результатов разделения текста
  const handleApplySplit = (originalItemId, newContentParts, createSubItems = false, keepOriginal = true) => {
    if (!newContentParts || newContentParts.length === 0) return;
    
    // Проверяем, разделяем подэлемент или основной элемент
    if (splitModalState.subItemId) {
      const subItemId = splitModalState.subItemId;
      const item = block.items.find(item => item.id === originalItemId);
      if (!item || !Array.isArray(item.subItems)) return;
      
      const subItem = item.subItems.find(subItem => subItem.id === subItemId);
      if (!subItem) return;
      
      // Если только одна часть, просто обновляем содержимое подэлемента
      if (newContentParts.length === 1) {
        actions.updateContextSubItem(block.id, originalItemId, subItemId, { 
          content: newContentParts[0],
          chars: newContentParts[0].length
        });
        return;
      }
      
      // Если нужно сохранить оригинал, оставляем исходный текст
      if (keepOriginal) {
        // Создаем новые подэлементы для каждой части
        newContentParts.forEach((content, i) => {
          const title = `${subItem.title} (${t('editor.context.split.part')} ${i+1})`;
          actions.addContextSubItem(block.id, originalItemId, title, content);
        });
      } else {
        // Обновляем первую часть в оригинальном подэлементе
        actions.updateContextSubItem(block.id, originalItemId, subItemId, { 
          content: newContentParts[0],
          chars: newContentParts[0].length
        });
        
        // Создаем новые подэлементы для остальных частей
        newContentParts.slice(1).forEach((content, i) => {
          const title = `${subItem.title} (${t('editor.context.split.part')} ${i+2})`;
          actions.addContextSubItem(block.id, originalItemId, title, content);
        });
      }
    } else {
      // Разделяем основной элемент
      const originalItem = block.items.find(item => item.id === originalItemId);
      if (!originalItem) return;
      
      // Если только одна часть, просто обновляем содержимое элемента
      if (newContentParts.length === 1) {
        actions.updateContextItem(block.id, originalItemId, { 
          content: newContentParts[0],
          chars: newContentParts[0].length
        });
        return;
      }
      
      if (createSubItems) {
        // Создаем подэлементы вместо новых элементов
        // Если нужно сохранить оригинал, оставляем исходный текст
        if (!keepOriginal) {
          // Заменяем текст в основном элементе на первую часть
          actions.updateContextItem(block.id, originalItemId, { 
            content: newContentParts[0],
            chars: newContentParts[0].length
          });
          
          // Добавляем остальные части как подэлементы
          newContentParts.slice(1).forEach((content, i) => {
            const title = `${originalItem.title} (${t('editor.context.split.part')} ${i+2})`;
            actions.addContextSubItem(block.id, originalItemId, title, content);
          });
        } else {
          // Сохраняем исходный текст и создаем все части как подэлементы
          newContentParts.forEach((content, i) => {
            const title = `${originalItem.title} (${t('editor.context.split.part')} ${i+1})`;
            actions.addContextSubItem(block.id, originalItemId, title, content);
          });
          
          // Раскрываем элемент, чтобы показать подэлементы
          setExpandedItems(prev => ({
            ...prev,
            [originalItemId]: true
          }));
        }
      } else {
        // Создаем новые элементы
        if (!keepOriginal) {
          // Обновляем первую часть в оригинальном элементе
          actions.updateContextItem(block.id, originalItemId, { 
            content: newContentParts[0],
            chars: newContentParts[0].length
          });
          
          // Подготавливаем массив для новых элементов
          const newItems = newContentParts.slice(1).map((content, i) => ({
            title: `${originalItem.title} (${t('editor.context.split.part')} ${i+2})`,
            content,
            chars: content.length
          }));
          
          // Добавляем новые элементы
          actions.addMultipleContextItems(block.id, newItems);
        } else {
          // Сохраняем исходный текст и создаем все части как новые элементы
          const newItems = newContentParts.map((content, i) => ({
            title: `${originalItem.title} (${t('editor.context.split.part')} ${i+1})`,
            content,
            chars: content.length
          }));
          
          // Добавляем новые элементы
          actions.addMultipleContextItems(block.id, newItems);
        }
      }
    }
    
    // Закрываем модальное окно
    setSplitModalState(prev => ({ ...prev, isOpen: false }));
  };
  
  // Обработчик изменения заголовка блока
  const handleTitleChange = (e) => {
    console.log('Изменение заголовка блока:', e.target.value);
    actions.updateContextBlock(block.id, { title: e.target.value });
  };
  
  // Обработчик изменения заголовка элемента
  const handleItemTitleChange = (itemId, title) => {
    console.log(`Изменение заголовка элемента ${itemId}:`, title);
    actions.updateContextItem(block.id, itemId, { title });
  };
  
  // Обработчик изменения заголовка подэлемента
  const handleSubItemTitleChange = (itemId, subItemId, title) => {
    console.log(`Изменение заголовка подэлемента ${subItemId}:`, title);
    actions.updateContextSubItem(block.id, itemId, subItemId, { title });
  };
  
  // Обработчик изменения содержимого элемента
  const handleItemContentChange = (itemId, content) => {
    // Подсчитываем количество символов
    const chars = content.length;
    console.log(`Изменение содержимого элемента ${itemId}, количество символов:`, chars);
    actions.updateContextItem(block.id, itemId, { content, chars });
  };
  
  // Обработчик изменения содержимого подэлемента
  const handleSubItemContentChange = (itemId, subItemId, content) => {
    // Подсчитываем количество символов
    const chars = content.length;
    console.log(`Изменение содержимого подэлемента ${subItemId}, количество символов:`, chars);
    actions.updateContextSubItem(block.id, itemId, subItemId, { content, chars });
  };
  
  // Обработчик удаления элемента
  const handleDeleteItem = (itemId) => {
    console.log(`Удаление элемента ${itemId} из блока ${block.id}`);
    actions.deleteContextItem(block.id, itemId);
  };
  
  // Обработчик удаления подэлемента
  const handleDeleteSubItem = (itemId, subItemId) => {
    console.log(`Удаление подэлемента ${subItemId} из элемента ${itemId}`);
    actions.deleteContextSubItem(block.id, itemId, subItemId);
  };
  
  // Обработчик добавления нового элемента
  const handleAddItem = () => {
    if (newItemTitle.trim()) {
      console.log('Добавление нового элемента:', newItemTitle);
      actions.addContextItem(block.id, newItemTitle.trim());
      setNewItemTitle('');
    }
    setIsAddingItem(false);
  };
  
  // Обработчик добавления нового подэлемента
  const handleAddSubItem = () => {
    if (newSubItemTitle.trim() && parentItemId) {
      console.log('Добавление нового подэлемента:', newSubItemTitle);
      actions.addContextSubItem(block.id, parentItemId, newSubItemTitle.trim());
      setNewSubItemTitle('');
    }
    setIsAddingSubItem(false);
    setParentItemId(null);
  };
  
  // Обработчик отмены добавления
  const handleCancelAddingItem = () => {
    console.log('Отмена добавления элемента контекста');
    setIsAddingItem(false);
    setNewItemTitle('');
  };
  
  // Обработчик отмены добавления подэлемента
  const handleCancelAddingSubItem = () => {
    console.log('Отмена добавления подэлемента контекста');
    setIsAddingSubItem(false);
    setNewSubItemTitle('');
    setParentItemId(null);
  };
  
  // Обработчик нажатия Enter при вводе названия
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Нажата клавиша Enter в поле ввода элемента');
      handleAddItem();
    } else if (e.key === 'Escape') {
      console.log('Нажата клавиша Escape в поле ввода элемента');
      handleCancelAddingItem();
    }
  };
  
  // Обработчик нажатия Enter при вводе названия подэлемента
  const handleSubItemKeyDown = (e) => {
    if (e.key === 'Enter') {
      console.log('Нажата клавиша Enter в поле ввода подэлемента');
      handleAddSubItem();
    } else if (e.key === 'Escape') {
      console.log('Нажата клавиша Escape в поле ввода подэлемента');
      handleCancelAddingSubItem();
    }
  };
  
  // Обработчики для перемещения элементов
  const handleMoveItemUp = (itemId) => {
    console.log(`Перемещение элемента ${itemId} вверх`);
    actions.moveContextItemUp(block.id, itemId);
  };
  
  const handleMoveItemDown = (itemId) => {
    console.log(`Перемещение элемента ${itemId} вниз`);
    actions.moveContextItemDown(block.id, itemId);
  };
  
  // Обработчики для перемещения подэлементов
  const handleMoveSubItemUp = (itemId, subItemId) => {
    console.log(`Перемещение подэлемента ${subItemId} вверх`);
    actions.moveContextSubItemUp(block.id, itemId, subItemId);
  };
  
  const handleMoveSubItemDown = (itemId, subItemId) => {
    console.log(`Перемещение подэлемента ${subItemId} вниз`);
    actions.moveContextSubItemDown(block.id, itemId, subItemId);
  };
  
  // Обработчик переключения отображения подэлементов
  const toggleItemExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // Обработчики для полноэкранного редактирования
  const handleOpenFullscreenEditor = (itemId, content, title, subItemId = null) => {
    console.log(`Открытие полноэкранного редактора для ${subItemId ? 'подэлемента' : 'элемента'} ${itemId}`);
    setFullscreenEditor({
      isOpen: true,
      content,
      title: `${t('editor.context.editing')} ${title}`,
      itemId,
      subItemId
    });
  };
  
  const handleCloseFullscreenEditor = () => {
    console.log('Закрытие полноэкранного редактора без сохранения');
    setFullscreenEditor(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleSaveFullscreenEditor = (newContent) => {
    const { itemId, subItemId } = fullscreenEditor;
    if (subItemId) {
      console.log(`Сохранение контента из полноэкранного редактора для подэлемента ${subItemId}`);
      handleSubItemContentChange(itemId, subItemId, newContent);
    } else {
      console.log(`Сохранение контента из полноэкранного редактора для элемента ${itemId}`);
      handleItemContentChange(itemId, newContent);
    }
    // Закрываем редактор
    setFullscreenEditor(prev => ({ ...prev, isOpen: false }));
  };
  
  // Обработчик фокуса для отслеживания активного элемента
  const handleTextareaFocus = (itemId) => {
    console.log(`Установлен фокус на textarea элемента ${itemId}`);
    // Обновляем глобальное состояние (локальное синхронизируется через useEffect)
    actions.setActiveContextItem(block.id, itemId, null);

    // При фокусе на элементе прокручиваем к соответствующему блоку в центральной панели
    setTimeout(() => {
      actions.scrollToBlock('context', block.id);
    }, 50);
  };

  // Обработчик фокуса для отслеживания активного подэлемента
  const handleSubItemTextareaFocus = (itemId, subItemId) => {
    console.log(`Установлен фокус на textarea подэлемента ${subItemId}`);
    // Обновляем глобальное состояние (локальное синхронизируется через useEffect)
    actions.setActiveContextItem(block.id, itemId, subItemId);

    // При фокусе на подэлементе прокручиваем к соответствующему блоку в центральной панели
    setTimeout(() => {
      actions.scrollToBlock('context', block.id);
    }, 50);
  };
  
  // Обработчик потери фокуса
  const handleTextareaBlur = () => {
    // Не сбрасываем активный элемент сразу, чтобы можно было 
    // использовать его для обработки горячих клавиш
    // setTimeout(() => setActiveItemId(null), 100);
  };
  
  return (
    <div ref={editorContainerRef}>
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">{t('editor.context.title')}</label>
        <input 
          type="text" 
          value={block.title} 
          onChange={handleTitleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" 
          onClick={() => {
            // При клике на заголовок прокручиваем к соответствующему блоку в центральной панели
            setTimeout(() => {
              actions.scrollToBlock('context', block.id);
            }, 50);
          }}
        />
      </div>
      
      {normalizedItems.map((item, index) => (
        <div
          className={`mb-6 bg-gray-800 border rounded-lg transition-all duration-200 ${
            activeItemId === item.id && !activeSubItemId
              ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
              : activeItemId === item.id
                ? 'border-blue-400/50 ring-1 ring-blue-400/20'
                : 'border-gray-700'
          }`}
          key={item.id}
        >
          <div className={`flex justify-between items-center p-3 border-b transition-colors duration-200 ${
            activeItemId === item.id && !activeSubItemId
              ? 'border-blue-500/50 bg-blue-900/20'
              : 'border-gray-700'
          }`}>
            <div className="flex items-center flex-1 mr-4">
              {/* Улучшенный индикатор подэлементов с количеством */}
              {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mr-3 transition-all duration-200 ${
                    expandedItems[item.id] 
                      ? 'bg-blue-900 bg-opacity-40 text-blue-300 border border-blue-700' 
                      : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white'
                  }`}
                  onClick={() => toggleItemExpanded(item.id)}
                  title={expandedItems[item.id] ? t('editor.context.actions.collapseSubItems') : t('editor.context.actions.expandSubItems')}
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
                  <span className="font-mono">
                    {item.subItems.length}
                  </span>
                  <span className="text-xs opacity-80">
                    {t('editor.context.subItem.label')}
                  </span>
                </button>
              )}
              <input
                className="bg-transparent text-white focus:outline-none w-full font-medium"
                value={item.title}
                onChange={(e) => handleItemTitleChange(item.id, e.target.value)}
                placeholder={t('editor.context.item.placeholder')}
                onClick={() => {
                  // При клике на заголовок прокручиваем к соответствующему блоку в центральной панели
                  setTimeout(() => {
                    actions.scrollToBlock('context', block.id);
                  }, 50);
                }}
              />
            </div>
            <div className="flex items-center">
              {/* Улучшенный счетчик символов с детализацией */}
              <div className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                <span className="font-mono font-medium">{item.chars}</span>
                <span>{t('editor.context.item.chars')}</span>
                {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="font-mono text-blue-400">
                      +{item.subItems.reduce((sum, sub) => sum + (sub.chars || 0), 0)}
                    </span>
                    <span className="text-blue-400">{t('editor.context.item.inSubItems')}</span>
                  </>
                )}
              </div>
              
              {/* Кнопки для перемещения элемента */}
              <div className="flex mr-2">
                {index !== 0 && (
                  <button 
                    className="text-gray-400 hover:text-gray-300 p-1"
                    onClick={() => handleMoveItemUp(item.id)}
                    title={t('editor.context.actions.moveUp')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {index !== normalizedItems.length - 1 && (
                  <button 
                    className="text-gray-400 hover:text-gray-300 p-1"
                    onClick={() => handleMoveItemDown(item.id)}
                    title={t('editor.context.actions.moveDown')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Кнопка разделения контента (ножницы) */}
              <button 
                className="text-indigo-400 hover:text-indigo-300 p-1 mr-2"
                onClick={() => handleOpenSplitModal(item.id)}
                title={t('editor.context.actions.split')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                </svg>
              </button>
              
              {/* Кнопка полноэкранного редактирования */}
              <button 
                className="text-blue-400 hover:text-blue-300 p-1 mr-2"
                onClick={() => handleOpenFullscreenEditor(item.id, item.content, item.title)}
                title={t('editor.context.actions.edit')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              
              {/* Кнопка добавления подэлемента */}
              <button 
                className="text-green-400 hover:text-green-300 p-1 mr-2"
                onClick={() => handleStartAddingSubItem(item.id)}
                title={t('editor.context.actions.addSubItem')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button 
                className="text-red-400 hover:text-red-300 p-1"
                onClick={() => handleDeleteItem(item.id)}
                title={t('editor.context.actions.deleteItem')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Поле для ввода содержимого элемента */}
          <textarea
            id={`item-textarea-${item.id}`}
            className="w-full h-48 px-3 py-2 bg-gray-800 border-none rounded-b-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={t('editor.context.item.textPlaceholder')}
            value={item.content}
            onChange={(e) => handleItemContentChange(item.id, e.target.value)}
            onFocus={() => handleTextareaFocus(item.id)}
            onBlur={handleTextareaBlur}
          ></textarea>
          
          {/* Улучшенное отображение подэлементов */}
          {expandedItems[item.id] && Array.isArray(item.subItems) && item.subItems.length > 0 && (
            <div className="border-t border-gray-700 pt-3 pb-2 bg-gray-850">
              {/* Заголовок секции подэлементов */}
              <div className="px-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                    {t('editor.context.subItem.title')} ({item.subItems.length})
                  </span>
                  <div className="h-px bg-blue-400 opacity-30 flex-1 ml-2"></div>
                </div>
                
                {/* Кнопка добавления подэлемента */}
                <button 
                  className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition-colors"
                  onClick={() => handleAddSubItem(item.id)}
                  title={t('editor.context.actions.addSubItem')}
                >
                  {t('editor.context.subItem.addButton')}
                </button>
              </div>
              
              {item.subItems.map((subItem, subIndex) => (
                <div
                  key={subItem.id}
                  className={`p-3 mx-3 my-2 border rounded-md relative transition-all duration-200 ${
                    activeSubItemId === subItem.id && activeItemId === item.id
                      ? 'border-cyan-400 bg-cyan-900/30 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20'
                      : 'border-gray-600 bg-gray-750'
                  }`}
                >
                  {/* Декоративная линия связи */}
                  <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-blue-400 opacity-40"></div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center flex-1 mr-4">
                      {/* Индикатор позиции подэлемента */}
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-mono font-bold text-blue-300 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-full mr-2 flex-shrink-0">
                        {subIndex + 1}
                      </span>
                      <input
                        className="bg-transparent text-white focus:outline-none w-full text-sm font-medium"
                        value={subItem.title}
                        onChange={(e) => handleSubItemTitleChange(item.id, subItem.id, e.target.value)}
                        placeholder={t('editor.context.subItem.placeholder')}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2 font-mono">{subItem.chars} {t('editor.context.item.chars')}</span>
                      
                      {/* Кнопки для перемещения подэлемента */}
                      <div className="flex mr-2">
                        {subIndex !== 0 && (
                          <button 
                            className="text-gray-400 hover:text-gray-300 p-1"
                            onClick={() => handleMoveSubItemUp(item.id, subItem.id)}
                            title={t('editor.context.actions.moveUp')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {subIndex !== item.subItems.length - 1 && (
                          <button 
                            className="text-gray-400 hover:text-gray-300 p-1"
                            onClick={() => handleMoveSubItemDown(item.id, subItem.id)}
                            title={t('editor.context.actions.moveDown')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      {/* Кнопка разделения контента для подэлемента */}
                      <button 
                        className="text-indigo-400 hover:text-indigo-300 p-1 mr-2"
                        onClick={() => handleOpenSubItemSplitModal(item.id, subItem.id)}
                        title={t('editor.context.actions.split')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                        </svg>
                      </button>
                      
                      {/* Кнопка полноэкранного редактирования подэлемента */}
                      <button 
                        className="text-blue-400 hover:text-blue-300 p-1 mr-2"
                        onClick={() => handleOpenFullscreenEditor(item.id, subItem.content, subItem.title, subItem.id)}
                        title={t('editor.context.actions.edit')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      
                      {/* Кнопка удаления подэлемента */}
                      <button 
                        className="text-red-400 hover:text-red-300 p-1"
                        onClick={() => handleDeleteSubItem(item.id, subItem.id)}
                        title={t('editor.context.actions.deleteSubItem')}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  {/* Поле для ввода содержимого подэлемента */}
                  <textarea
                    id={`subitem-textarea-${item.id}-${subItem.id}`}
                    className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={t('editor.context.subItem.textPlaceholder')}
                    value={subItem.content || ''}
                    onChange={(e) => handleSubItemContentChange(item.id, subItem.id, e.target.value)}
                    onFocus={() => handleSubItemTextareaFocus(item.id, subItem.id)}
                    onBlur={handleTextareaBlur}
                  ></textarea>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Полноэкранный редактор */}
      <FullscreenEditor
        isOpen={fullscreenEditor.isOpen}
        onClose={handleCloseFullscreenEditor}
        onSave={handleSaveFullscreenEditor}
        title={fullscreenEditor.title}
        content={fullscreenEditor.content}
      />
      
      {/* Модальное окно разделения текста */}
      <SplitContentModal
        isOpen={splitModalState.isOpen}
        onClose={() => setSplitModalState(prev => ({ ...prev, isOpen: false }))}
        onApply={(contentParts, createSubItems, keepOriginal) => handleApplySplit(splitModalState.itemId, contentParts, createSubItems, keepOriginal)}
        content={splitModalState.content}
        title={splitModalState.title}
      />
      
      {/* Форма добавления нового элемента */}
      {isAddingItem ? (
        <div className="mb-4">
          <div className="flex space-x-2 mb-2">
            <input
              ref={newItemInputRef}
              type="text"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              placeholder={t('editor.context.item.newPlaceholder')}
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-600"
              onClick={handleAddItem}
            >
              {t('editor.context.buttons.create')}
            </button>
            <button 
              className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600"
              onClick={handleCancelAddingItem}
            >
              {t('editor.context.buttons.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button 
            className="px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-600 flex items-center"
            onClick={handleStartAddingItem}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('editor.context.item.addButton')}
          </button>
        </div>
      )}
      
      {/* Форма добавления нового подэлемента */}
      {isAddingSubItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-medium text-white mb-4">{t('editor.context.subItem.modalTitle')}</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">{t('editor.context.subItem.modalLabel')}</label>
              <input
                ref={newSubItemInputRef}
                type="text"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder={t('editor.context.subItem.placeholder')}
                value={newSubItemTitle}
                onChange={(e) => setNewSubItemTitle(e.target.value)}
                onKeyDown={handleSubItemKeyDown}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                onClick={handleCancelAddingSubItem}
              >
                {t('editor.context.buttons.cancel')}
              </button>
              <button 
                className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
                onClick={handleAddSubItem}
              >
                {t('editor.context.buttons.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextEditor;