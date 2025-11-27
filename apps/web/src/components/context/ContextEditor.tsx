// ContextEditor - Полный редактор контекста (1:1 из originals - 963 строки)
// originals/src/components/context/ContextEditor.js
import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useProjectUpdate } from '../../hooks/useProjectUpdate';
import { useTranslation } from 'react-i18next';
import FullscreenEditor from '../ui/FullscreenEditor';
import SplitContentModal from '../ui/SplitContentModal';
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut';
import { generateDefaultContextItemName, generateDefaultContextSubItemName } from '../../utils/nameGenerators';
import type { ContextItem, ContextSubItem } from '@promptozaurus/shared';

const ContextEditor = () => {
  const { t } = useTranslation('editor');
  const { openConfirmation } = useConfirmation();
  const {
    currentProject,
    activeContextBlockId,
    activeContextItemId,
    activeContextSubItemId,
    setActiveContextItem,
    expandedItems,
    toggleExpandItem,
    setExpandedItems,
  } = useEditor();
  const { updateProjectAndRefresh } = useProjectUpdate();

  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingSubItem, setIsAddingSubItem] = useState(false);
  const [newSubItemTitle, setNewSubItemTitle] = useState('');
  const [parentItemId, setParentItemId] = useState<number | null>(null);

  const [fullscreenEditor, setFullscreenEditor] = useState({
    isOpen: false,
    content: '',
    title: '',
    itemId: null as number | null,
    subItemId: null as number | null,
  });

  const [splitModalState, setSplitModalState] = useState({
    isOpen: false,
    itemId: null as number | null,
    subItemId: null as number | null,
    content: '',
    title: '',
  });

  const newItemInputRef = useRef<HTMLInputElement>(null);
  const newSubItemInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Get active context block
  const block = currentProject?.data?.contextBlocks?.find((b) => b.id === activeContextBlockId);

  // Автораскрытие элементов без контента, но с подэлементами (из оригинала строки 64-93)
  useEffect(() => {
    if (!block || !block.items || block.items.length === 0) return;

    const normalizedItems = block.items.map((item) => ({
      ...item,
      subItems: Array.isArray(item.subItems) ? item.subItems : [],
    }));

    const autoExpandState: Record<number, boolean> = {};
    normalizedItems.forEach((item) => {
      const itemContent = item.content && item.content.trim() ? item.content.trim() : '';
      const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;

      // Автораскрываем элементы без основного контента, но с подэлементами
      if (itemContent.length === 0 && hasSubItems) {
        autoExpandState[item.id] = true;
      }
    });

    if (Object.keys(autoExpandState).length > 0) {
      setExpandedItems({ ...expandedItems, ...autoExpandState });
      console.log('Автораскрытие элементов без контента:', Object.keys(autoExpandState));
    }
  }, [block?.id]);

  // Реакция на изменение глобального активного элемента/подэлемента (строки 95-120)
  useEffect(() => {
    if (activeContextItemId === null) return;

    // Если выбран подэлемент, автоматически разворачиваем родительский элемент
    if (activeContextSubItemId !== null) {
      setExpandedItems({
        ...expandedItems,
        [activeContextItemId]: true,
      });
      console.log(`Автораскрытие элемента ${activeContextItemId} для отображения подэлемента ${activeContextSubItemId}`);
    }

    // Прокручиваем к активному элементу/подэлементу
    setTimeout(() => {
      const targetId = activeContextSubItemId ? `subitem-textarea-${activeContextItemId}-${activeContextSubItemId}` : `item-textarea-${activeContextItemId}`;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
        console.log(`Фокус установлен на ${activeContextSubItemId ? 'подэлемент' : 'элемент'}`);
      }
    }, 100);
  }, [activeContextItemId, activeContextSubItemId]);

  // Обработчик для открытия полноэкранного редактора с активным элементом (строки 122-142)
  const handleOpenActiveItemEditor = () => {
    if (!block) return;

    if (activeContextSubItemId && activeContextItemId) {
      const activeItem = block.items.find((item) => item.id === activeContextItemId);
      if (!activeItem || !Array.isArray(activeItem.subItems)) return;

      const activeSubItem = activeItem.subItems.find((subItem) => subItem.id === activeContextSubItemId);
      if (!activeSubItem) return;

      console.log(`Открытие полноэкранного редактора для активного подэлемента ${activeContextSubItemId}`);
      handleOpenFullscreenEditor(activeContextItemId, activeSubItem.content || '', activeSubItem.title, activeContextSubItemId);
    } else if (activeContextItemId) {
      const activeItem = block.items.find((item) => item.id === activeContextItemId);
      if (!activeItem) return;

      console.log(`Открытие полноэкранного редактора для активного элемента ${activeContextItemId}`);
      handleOpenFullscreenEditor(activeContextItemId, activeItem.content || '', activeItem.title);
    }
  };

  // Регистрация горячей клавиши Ctrl+E (строки 144-154)
  useKeyboardShortcut(
    {
      'ctrl+e': () => {
        const editorContainer = editorContainerRef.current;
        if (editorContainer && editorContainer.contains(document.activeElement)) {
          console.log('Обнаружено сочетание клавиш Ctrl+E в редакторе контекста');
          handleOpenActiveItemEditor();
        }
      },
    },
    [activeContextItemId, activeContextSubItemId, block]
  );

  if (!block) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-gray-800 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium text-gray-300 mb-2">{t('context.noSelection.title')}</p>
          <p className="text-sm text-gray-400">{t('context.noSelection.description')}</p>
        </div>
      </div>
    );
  }

  // Нормализация данных блока (строки 170-178)
  const normalizedItems = Array.isArray(block.items)
    ? block.items.map((item) => ({
        ...item,
        content: item.content || '',
        chars: item.chars || 0,
        subItems: Array.isArray(item.subItems) ? item.subItems : [],
      }))
    : [];

  // Обработчик изменения заголовка блока (строки 368-372)
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) return;
    console.log('Изменение заголовка блока:', e.target.value);
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b));

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчик изменения заголовка элемента (строки 374-378)
  const handleItemTitleChange = async (itemId: number, title: string) => {
    if (!currentProject) return;
    console.log(`Изменение заголовка элемента ${itemId}:`, title);
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => (item.id === itemId ? { ...item, title } : item)),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчик изменения заголовка подэлемента (строки 380-384)
  const handleSubItemTitleChange = async (itemId: number, subItemId: number, title: string) => {
    if (!currentProject) return;
    console.log(`Изменение заголовка подэлемента ${subItemId}:`, title);
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                subItems: item.subItems?.map((sub) => (sub.id === subItemId ? { ...sub, title } : sub)),
              };
            }
            return item;
          }),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчик изменения содержимого элемента (строки 386-392)
  const handleItemContentChange = async (itemId: number, content: string) => {
    if (!currentProject) return;
    const chars = content.length;
    console.log(`Изменение содержимого элемента ${itemId}, количество символов:`, chars);
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => (item.id === itemId ? { ...item, content, chars } : item)),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчик изменения содержимого подэлемента (строки 394-400)
  const handleSubItemContentChange = async (itemId: number, subItemId: number, content: string) => {
    if (!currentProject) return;
    const chars = content.length;
    console.log(`Изменение содержимого подэлемента ${subItemId}, количество символов:`, chars);
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id === itemId) {
              return {
                ...item,
                subItems: item.subItems?.map((sub) => (sub.id === subItemId ? { ...sub, content, chars } : sub)),
              };
            }
            return item;
          }),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчик удаления элемента (строки 402-406)
  const handleDeleteItem = async (itemId: number) => {
    if (!currentProject) return;
    console.log(`Удаление элемента ${itemId} из блока ${block.id}`);

    openConfirmation(
      t('context.actions.deleteTitle'),
      t('context.actions.deleteConfirm'),
      async () => {
        const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
          if (b.id === block.id) {
            return {
              ...b,
              items: b.items.filter((item) => item.id !== itemId),
            };
          }
          return b;
        });

        await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
      }
    );
  };

  // Обработчик удаления подэлемента (строки 408-412)
  const handleDeleteSubItem = async (itemId: number, subItemId: number) => {
    if (!currentProject) return;
    console.log(`Удаление подэлемента ${subItemId} из элемента ${itemId}`);

    openConfirmation(
      t('context.actions.deleteTitle'),
      t('context.actions.deleteConfirm'),
      async () => {
        const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
          if (b.id === block.id) {
            return {
              ...b,
              items: b.items.map((item) => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    subItems: item.subItems?.filter((sub) => sub.id !== subItemId),
                  };
                }
                return item;
              }),
            };
          }
          return b;
        });

        await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
      }
    );
  };

  // Обработчик начала добавления нового элемента (строки 180-196)
  const handleStartAddingItem = () => {
    console.log('Начало добавления элемента контекста');
    const defaultName = generateDefaultContextItemName(block);
    console.log('Имя по умолчанию для элемента контекста:', defaultName);
    setNewItemTitle(defaultName);
    setIsAddingItem(true);

    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
        newItemInputRef.current.select();
      }
    }, 50);
  };

  // Обработчик начала добавления нового подэлемента (строки 198-215)
  const handleStartAddingSubItem = (itemId: number) => {
    console.log('Начало добавления подэлемента контекста');
    const item = block.items.find((i) => i.id === itemId);
    if (!item) return;

    const defaultName = generateDefaultContextSubItemName(item);
    console.log('Имя по умолчанию для подэлемента контекста:', defaultName);
    setNewSubItemTitle(defaultName);
    setParentItemId(itemId);
    setIsAddingSubItem(true);

    setTimeout(() => {
      if (newSubItemInputRef.current) {
        newSubItemInputRef.current.focus();
        newSubItemInputRef.current.select();
      }
    }, 50);
  };

  // Обработчик добавления нового элемента (строки 414-422)
  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !currentProject) return;

    console.log('Добавление нового элемента:', newItemTitle);
    const newItem: ContextItem = {
      id: Date.now(),
      title: newItemTitle.trim(),
      content: '',
      chars: 0,
      subItems: [],
    };

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: [...b.items, newItem],
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });

    setNewItemTitle('');
    setIsAddingItem(false);
  };

  // Обработчик добавления нового подэлемента (строки 424-433)
  const handleAddSubItem = async () => {
    if (!newSubItemTitle.trim() || !parentItemId || !currentProject) return;

    console.log('Добавление нового подэлемента:', newSubItemTitle);
    const newSubItem: ContextSubItem = {
      id: Date.now(),
      title: newSubItemTitle.trim(),
      content: '',
      chars: 0,
    };

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id === parentItemId) {
              return {
                ...item,
                subItems: [...(item.subItems || []), newSubItem],
              };
            }
            return item;
          }),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });

    setNewSubItemTitle('');
    setIsAddingSubItem(false);
    setParentItemId(null);

    // Раскрываем элемент, чтобы показать новый подэлемент
    if (!expandedItems[parentItemId]) {
      toggleExpandItem(parentItemId);
    }
  };

  // Обработчики для отмены добавления (строки 435-448)
  const handleCancelAddingItem = () => {
    console.log('Отмена добавления элемента контекста');
    setIsAddingItem(false);
    setNewItemTitle('');
  };

  const handleCancelAddingSubItem = () => {
    console.log('Отмена добавления подэлемента контекста');
    setIsAddingSubItem(false);
    setNewSubItemTitle('');
    setParentItemId(null);
  };

  // Обработчики нажатия клавиш (строки 450-470)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('Нажата клавиша Enter в поле ввода элемента');
      handleAddItem();
    } else if (e.key === 'Escape') {
      console.log('Нажата клавиша Escape в поле ввода элемента');
      handleCancelAddingItem();
    }
  };

  const handleSubItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      console.log('Нажата клавиша Enter в поле ввода подэлемента');
      handleAddSubItem();
    } else if (e.key === 'Escape') {
      console.log('Нажата клавиша Escape в поле ввода подэлемента');
      handleCancelAddingSubItem();
    }
  };

  // Обработчики для перемещения элементов (строки 472-492)
  const handleMoveItemUp = async (itemId: number) => {
    if (!currentProject) return;
    console.log(`Перемещение элемента ${itemId} вверх`);

    const itemIndex = block.items.findIndex((item) => item.id === itemId);
    if (itemIndex <= 0) return;

    const newItems = [...block.items];
    [newItems[itemIndex - 1], newItems[itemIndex]] = [newItems[itemIndex], newItems[itemIndex - 1]];

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? { ...b, items: newItems } : b));

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  const handleMoveItemDown = async (itemId: number) => {
    if (!currentProject) return;
    console.log(`Перемещение элемента ${itemId} вниз`);

    const itemIndex = block.items.findIndex((item) => item.id === itemId);
    if (itemIndex < 0 || itemIndex >= block.items.length - 1) return;

    const newItems = [...block.items];
    [newItems[itemIndex], newItems[itemIndex + 1]] = [newItems[itemIndex + 1], newItems[itemIndex]];

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? { ...b, items: newItems } : b));

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчики для перемещения подэлементов (аналог строк 484-492)
  const handleMoveSubItemUp = async (itemId: number, subItemId: number) => {
    if (!currentProject) return;
    console.log(`Перемещение подэлемента ${subItemId} вверх`);

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id === itemId && item.subItems) {
              const subIndex = item.subItems.findIndex((sub) => sub.id === subItemId);
              if (subIndex <= 0) return item;

              const newSubItems = [...item.subItems];
              [newSubItems[subIndex - 1], newSubItems[subIndex]] = [newSubItems[subIndex], newSubItems[subIndex - 1]];

              return { ...item, subItems: newSubItems };
            }
            return item;
          }),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  const handleMoveSubItemDown = async (itemId: number, subItemId: number) => {
    if (!currentProject) return;
    console.log(`Перемещение подэлемента ${subItemId} вниз`);

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => {
            if (item.id === itemId && item.subItems) {
              const subIndex = item.subItems.findIndex((sub) => sub.id === subItemId);
              if (subIndex < 0 || subIndex >= item.subItems.length - 1) return item;

              const newSubItems = [...item.subItems];
              [newSubItems[subIndex], newSubItems[subIndex + 1]] = [newSubItems[subIndex + 1], newSubItems[subIndex]];

              return { ...item, subItems: newSubItems };
            }
            return item;
          }),
        };
      }
      return b;
    });

    await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
  };

  // Обработчики для полноэкранного редактирования (строки 502-530)
  const handleOpenFullscreenEditor = (itemId: number, content: string, title: string, subItemId: number | null = null) => {
    console.log(`Открытие полноэкранного редактора для ${subItemId ? 'подэлемента' : 'элемента'} ${itemId}`);
    setFullscreenEditor({
      isOpen: true,
      content,
      title: `${t('context.editing')} ${title}`,
      itemId,
      subItemId,
    });
  };

  const handleCloseFullscreenEditor = () => {
    console.log('Закрытие полноэкранного редактора без сохранения');
    setFullscreenEditor((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveFullscreenEditor = (newContent: string) => {
    const { itemId, subItemId } = fullscreenEditor;
    if (itemId === null) return;

    if (subItemId) {
      console.log(`Сохранение контента из полноэкранного редактора для подэлемента ${subItemId}`);
      handleSubItemContentChange(itemId, subItemId, newContent);
    } else {
      console.log(`Сохранение контента из полноэкранного редактора для элемента ${itemId}`);
      handleItemContentChange(itemId, newContent);
    }
    setFullscreenEditor((prev) => ({ ...prev, isOpen: false }));
  };

  // Обработчики для модального окна разделения текста (строки 217-366)
  const handleOpenSplitModal = (itemId: number) => {
    const item = block.items.find((item) => item.id === itemId);
    if (!item) return;

    setSplitModalState({
      isOpen: true,
      itemId,
      subItemId: null,
      content: item.content || '',
      title: item.title,
    });
  };

  const handleOpenSubItemSplitModal = (itemId: number, subItemId: number) => {
    const item = block.items.find((item) => item.id === itemId);
    if (!item || !Array.isArray(item.subItems)) return;

    const subItem = item.subItems.find((subItem) => subItem.id === subItemId);
    if (!subItem) return;

    setSplitModalState({
      isOpen: true,
      itemId,
      subItemId,
      content: subItem.content || '',
      title: subItem.title,
    });
  };

  const handleApplySplit = async (contentParts: string[], createSubItems: boolean, keepOriginal: boolean) => {
    if (!currentProject || contentParts.length === 0) return;

    const { itemId, subItemId } = splitModalState;
    if (itemId === null) return;

    const originalItem = block.items.find((item) => item.id === itemId);
    if (!originalItem) return;

    // Если только одна часть, просто обновляем содержимое
    if (contentParts.length === 1) {
      if (subItemId) {
        await handleSubItemContentChange(itemId, subItemId, contentParts[0]);
      } else {
        await handleItemContentChange(itemId, contentParts[0]);
      }
      setSplitModalState((prev) => ({ ...prev, isOpen: false }));
      return;
    }

    // Разделяем подэлемент (строки 252-289)
    if (subItemId) {
      const subItem = originalItem.subItems?.find((subItem) => subItem.id === subItemId);
      if (!subItem) return;

      if (keepOriginal) {
        // Создаем новые подэлементы для каждой части
        const newSubItems = contentParts.map((content, i) => ({
          id: Date.now() + i,
          title: `${subItem.title} (${t('context.split.part')} ${i + 1})`,
          content,
          chars: content.length,
        }));

        const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
          if (b.id === block.id) {
            return {
              ...b,
              items: b.items.map((item) => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    subItems: [...(item.subItems || []), ...newSubItems],
                  };
                }
                return item;
              }),
            };
          }
          return b;
        });

        await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
      } else {
        // Обновляем первую часть в оригинальном подэлементе
        await handleSubItemContentChange(itemId, subItemId, contentParts[0]);

        // Создаем новые подэлементы для остальных частей
        const newSubItems = contentParts.slice(1).map((content, i) => ({
          id: Date.now() + i + 1,
          title: `${subItem.title} (${t('context.split.part')} ${i + 2})`,
          content,
          chars: content.length,
        }));

        const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
          if (b.id === block.id) {
            return {
              ...b,
              items: b.items.map((item) => {
                if (item.id === itemId) {
                  return {
                    ...item,
                    subItems: [...(item.subItems || []), ...newSubItems],
                  };
                }
                return item;
              }),
            };
          }
          return b;
        });

        await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
      }
    } else {
      // Разделяем основной элемент (строки 290-362)
      if (createSubItems) {
        // Создаем подэлементы вместо новых элементов
        if (!keepOriginal) {
          // Заменяем текст в основном элементе на первую часть
          await handleItemContentChange(itemId, contentParts[0]);

          // Добавляем остальные части как подэлементы
          const newSubItems = contentParts.slice(1).map((content, i) => ({
            id: Date.now() + i + 1,
            title: `${originalItem.title} (${t('context.split.part')} ${i + 2})`,
            content,
            chars: content.length,
          }));

          const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
            if (b.id === block.id) {
              return {
                ...b,
                items: b.items.map((item) => {
                  if (item.id === itemId) {
                    return {
                      ...item,
                      subItems: [...(item.subItems || []), ...newSubItems],
                    };
                  }
                  return item;
                }),
              };
            }
            return b;
          });

          await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
        } else {
          // Сохраняем исходный текст и создаем все части как подэлементы
          const newSubItems = contentParts.map((content, i) => ({
            id: Date.now() + i,
            title: `${originalItem.title} (${t('context.split.part')} ${i + 1})`,
            content,
            chars: content.length,
          }));

          const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
            if (b.id === block.id) {
              return {
                ...b,
                items: b.items.map((item) => {
                  if (item.id === itemId) {
                    return {
                      ...item,
                      subItems: [...(item.subItems || []), ...newSubItems],
                    };
                  }
                  return item;
                }),
              };
            }
            return b;
          });

          await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });

          // Раскрываем элемент, чтобы показать подэлементы
          setExpandedItems({
            ...expandedItems,
            [itemId]: true,
          });
        }
      } else {
        // Создаем новые элементы
        if (!keepOriginal) {
          // Обновляем первую часть в оригинальном элементе
          await handleItemContentChange(itemId, contentParts[0]);

          // Создаем новые элементы для остальных частей
          const newItems: ContextItem[] = contentParts.slice(1).map((content, i) => ({
            id: Date.now() + i + 1,
            title: `${originalItem.title} (${t('context.split.part')} ${i + 2})`,
            content,
            chars: content.length,
            subItems: [],
          }));

          const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
            if (b.id === block.id) {
              return { ...b, items: [...b.items, ...newItems] };
            }
            return b;
          });

          await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
        } else {
          // Сохраняем исходный текст и создаем все части как новые элементы
          const newItems: ContextItem[] = contentParts.map((content, i) => ({
            id: Date.now() + i,
            title: `${originalItem.title} (${t('context.split.part')} ${i + 1})`,
            content,
            chars: content.length,
            subItems: [],
          }));

          const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
            if (b.id === block.id) {
              return { ...b, items: [...b.items, ...newItems] };
            }
            return b;
          });

          await updateProjectAndRefresh({ ...currentProject.data, contextBlocks: updatedBlocks });
        }
      }
    }

    setSplitModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Обработчики фокуса (строки 532-561)
  const handleTextareaFocus = (itemId: number) => {
    console.log(`Установлен фокус на textarea элемента ${itemId}`);
    setActiveContextItem(itemId, null);
  };

  const handleSubItemTextareaFocus = (itemId: number, subItemId: number) => {
    console.log(`Установлен фокус на textarea подэлемента ${subItemId}`);
    setActiveContextItem(itemId, subItemId);
  };

  const handleTextareaBlur = () => {
    // Не сбрасываем активный элемент сразу
  };

  return (
    <div ref={editorContainerRef}>
      {/* Заголовок блока (строки 565-579) */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">{t('context.title')}</label>
        <input
          type="text"
          value={block.title}
          onChange={handleTitleChange}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />
      </div>

      {/* Элементы контекста (строки 581-862) */}
      {normalizedItems.map((item, index) => (
        <div
          className={`mb-6 bg-gray-800 border rounded-lg transition-all duration-200 ${
            activeContextItemId === item.id && !activeContextSubItemId
              ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20'
              : activeContextItemId === item.id
              ? 'border-blue-400/50 ring-1 ring-blue-400/20'
              : 'border-gray-700'
          }`}
          key={item.id}
        >
          {/* Заголовок элемента (строки 592-724) */}
          <div
            className={`flex justify-between items-center p-3 border-b transition-colors duration-200 ${
              activeContextItemId === item.id && !activeContextSubItemId ? 'border-blue-500/50 bg-blue-900/20' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center flex-1 mr-4">
              {/* Улучшенный индикатор подэлементов с количеством (строки 598-625) */}
              {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mr-3 transition-all duration-200 ${
                    expandedItems[item.id]
                      ? 'bg-blue-900 bg-opacity-40 text-blue-300 border border-blue-700'
                      : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600 hover:text-white'
                  }`}
                  onClick={() => toggleExpandItem(item.id)}
                  title={expandedItems[item.id] ? t('context.actions.collapseSubItems') : t('context.actions.expandSubItems')}
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
                  <span className="font-mono">{item.subItems.length}</span>
                  <span className="text-xs opacity-80">{t('context.subItem.label')}</span>
                </button>
              )}
              <input
                className="bg-transparent text-white focus:outline-none w-full font-medium"
                value={item.title}
                onChange={(e) => handleItemTitleChange(item.id, e.target.value)}
                placeholder={t('context.item.placeholder')}
              />
            </div>
            <div className="flex items-center">
              {/* Улучшенный счетчик символов с детализацией (строки 640-653) */}
              <div className="text-xs text-gray-400 mr-2 flex items-center gap-1">
                <span className="font-mono font-medium">{item.chars}</span>
                <span>{t('context.item.chars')}</span>
                {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="font-mono text-blue-400">+{item.subItems.reduce((sum, sub) => sum + (sub.chars || 0), 0)}</span>
                    <span className="text-blue-400">{t('context.item.inSubItems')}</span>
                  </>
                )}
              </div>

              {/* Кнопки для перемещения элемента (строки 655-679) */}
              <div className="flex mr-2">
                {index !== 0 && (
                  <button className="text-gray-400 hover:text-gray-300 p-1" onClick={() => handleMoveItemUp(item.id)} title={t('context.actions.moveUp')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                )}
                {index !== normalizedItems.length - 1 && (
                  <button className="text-gray-400 hover:text-gray-300 p-1" onClick={() => handleMoveItemDown(item.id)} title={t('context.actions.moveDown')}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Кнопка разделения контента (строки 681-690) */}
              <button className="text-indigo-400 hover:text-indigo-300 p-1 mr-2" onClick={() => handleOpenSplitModal(item.id)} title={t('context.actions.split')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
              </button>

              {/* Кнопка полноэкранного редактирования (строки 692-701) */}
              <button className="text-blue-400 hover:text-blue-300 p-1 mr-2" onClick={() => handleOpenFullscreenEditor(item.id, item.content, item.title)} title={t('context.actions.edit')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>

              {/* Кнопка добавления подэлемента (строки 703-712) */}
              <button className="text-green-400 hover:text-green-300 p-1 mr-2" onClick={() => handleStartAddingSubItem(item.id)} title={t('context.actions.addSubItem')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>

              {/* Кнопка удаления (строки 714-723) */}
              <button className="text-red-400 hover:text-red-300 p-1" onClick={() => handleDeleteItem(item.id)} title={t('context.actions.deleteItem')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Поле для ввода содержимого элемента (строки 726-735) */}
          <textarea
            id={`item-textarea-${item.id}`}
            className="w-full h-48 px-3 py-2 bg-gray-800 border-none rounded-b-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={t('context.item.textPlaceholder')}
            value={item.content}
            onChange={(e) => handleItemContentChange(item.id, e.target.value)}
            onFocus={() => handleTextareaFocus(item.id)}
            onBlur={handleTextareaBlur}
          />

          {/* Улучшенное отображение подэлементов (строки 737-861) */}
          {expandedItems[item.id] && Array.isArray(item.subItems) && item.subItems.length > 0 && (
            <div className="border-t border-gray-700 pt-3 pb-2 bg-gray-850">
              {/* Заголовок секции подэлементов (строки 740-758) */}
              <div className="px-3 mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                  <span className="text-xs font-medium text-blue-400 uppercase tracking-wide">
                    {t('context.subItem.title')} ({item.subItems.length})
                  </span>
                  <div className="h-px bg-blue-400 opacity-30 flex-1 ml-2"></div>
                </div>

                <button className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800 transition-colors" onClick={() => handleStartAddingSubItem(item.id)} title={t('context.actions.addSubItem')}>
                  {t('context.subItem.addButton')}
                </button>
              </div>

              {item.subItems.map((subItem, subIndex) => (
                <div
                  key={subItem.id}
                  className={`p-3 mx-3 my-2 border rounded-md relative transition-all duration-200 ${
                    activeContextSubItemId === subItem.id && activeContextItemId === item.id ? 'border-cyan-400 bg-cyan-900/30 ring-2 ring-cyan-400/40 shadow-lg shadow-cyan-500/20' : 'border-gray-600 bg-gray-750'
                  }`}
                >
                  {/* Декоративная линия связи (строка 770) */}
                  <div className="absolute left-[-12px] top-1/2 w-3 h-px bg-blue-400 opacity-40"></div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center flex-1 mr-4">
                      {/* Индикатор позиции подэлемента (строки 774-776) */}
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-mono font-bold text-blue-300 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-full mr-2 flex-shrink-0">
                        {subIndex + 1}
                      </span>
                      <input
                        className="bg-transparent text-white focus:outline-none w-full text-sm font-medium"
                        value={subItem.title}
                        onChange={(e) => handleSubItemTitleChange(item.id, subItem.id, e.target.value)}
                        placeholder={t('context.subItem.placeholder')}
                      />
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs text-gray-500 mr-2 font-mono">
                        {subItem.chars} {t('context.item.chars')}
                      </span>

                      {/* Кнопки для перемещения подэлемента (строки 787-811) */}
                      <div className="flex mr-2">
                        {subIndex !== 0 && (
                          <button className="text-gray-400 hover:text-gray-300 p-1" onClick={() => handleMoveSubItemUp(item.id, subItem.id)} title={t('context.actions.moveUp')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                        )}
                        {subIndex !== item.subItems.length - 1 && (
                          <button className="text-gray-400 hover:text-gray-300 p-1" onClick={() => handleMoveSubItemDown(item.id, subItem.id)} title={t('context.actions.moveDown')}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Кнопка разделения контента для подэлемента (строки 813-822) */}
                      <button className="text-indigo-400 hover:text-indigo-300 p-1 mr-2" onClick={() => handleOpenSubItemSplitModal(item.id, subItem.id)} title={t('context.actions.split')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                          />
                        </svg>
                      </button>

                      {/* Кнопка полноэкранного редактирования подэлемента (строки 824-833) */}
                      <button className="text-blue-400 hover:text-blue-300 p-1 mr-2" onClick={() => handleOpenFullscreenEditor(item.id, subItem.content || '', subItem.title, subItem.id)} title={t('context.actions.edit')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Кнопка удаления подэлемента (строки 835-844) */}
                      <button className="text-red-400 hover:text-red-300 p-1" onClick={() => handleDeleteSubItem(item.id, subItem.id)} title={t('context.actions.deleteSubItem')}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Поле для ввода содержимого подэлемента (строки 848-857) */}
                  <textarea
                    id={`subitem-textarea-${item.id}-${subItem.id}`}
                    className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={t('context.subItem.textPlaceholder')}
                    value={subItem.content || ''}
                    onChange={(e) => handleSubItemContentChange(item.id, subItem.id, e.target.value)}
                    onFocus={() => handleSubItemTextareaFocus(item.id, subItem.id)}
                    onBlur={handleTextareaBlur}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Полноэкранный редактор (строки 865-872) */}
      <FullscreenEditor isOpen={fullscreenEditor.isOpen} onClose={handleCloseFullscreenEditor} onSave={handleSaveFullscreenEditor} title={fullscreenEditor.title} content={fullscreenEditor.content} />

      {/* Модальное окно разделения текста (строки 874-881) */}
      <SplitContentModal isOpen={splitModalState.isOpen} onClose={() => setSplitModalState((prev) => ({ ...prev, isOpen: false }))} onApply={handleApplySplit} content={splitModalState.content} title={splitModalState.title} />

      {/* Форма добавления нового элемента (строки 883-924) */}
      {isAddingItem ? (
        <div className="mb-4">
          <div className="flex space-x-2 mb-2">
            <input ref={newItemInputRef} type="text" className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" placeholder={t('context.item.newPlaceholder')} value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handleAddItem}>
              {t('context.buttons.create')}
            </button>
            <button className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={handleCancelAddingItem}>
              {t('context.buttons.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-600 flex items-center" onClick={handleStartAddingItem}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('context.item.addButton')}
          </button>
        </div>
      )}

      {/* Форма добавления нового подэлемента (строки 926-959) */}
      {isAddingSubItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-medium text-white mb-4">{t('context.subItem.modalTitle')}</h3>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">{t('context.subItem.modalLabel')}</label>
              <input
                ref={newSubItemInputRef}
                type="text"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder={t('context.subItem.placeholder')}
                value={newSubItemTitle}
                onChange={(e) => setNewSubItemTitle(e.target.value)}
                onKeyDown={handleSubItemKeyDown}
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={handleCancelAddingSubItem}>
                {t('context.buttons.cancel')}
              </button>
              <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handleAddSubItem}>
                {t('context.buttons.create')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContextEditor;
