// ContextEditor - Редактор контекста (упрощённая версия для SaaS)
// Полная версия из originals/src/components/context/ContextEditor.js (963 строки)
// Эта версия содержит core-функциональность и будет расширена в следующих итерациях

import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useUpdateProject } from '../../hooks/useProjects';
import { useTranslation } from 'react-i18next';
import FullscreenEditor from '../ui/FullscreenEditor';
import SplitContentModal from '../ui/SplitContentModal';
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut';
import { generateDefaultContextItemName, generateDefaultContextSubItemName } from '../../utils/nameGenerators';
import type { ContextItem } from '@promptozaurus/shared';

const ContextEditor = () => {
  const { t } = useTranslation();
  const { currentProject, activeContextBlockId, activeContextItemId, activeContextSubItemId, setActiveContextItem, expandedItems, toggleExpandItem, setExpandedItems } =
    useEditor();
  const updateProjectMutation = useUpdateProject();

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

  // Автораскрытие элементов без контента, но с подэлементами
  useEffect(() => {
    if (!block || !block.items || block.items.length === 0) return;

    const itemsWithoutContentButWithSubItems = block.items.filter((item) => {
      const hasContent = item.content && item.content.trim().length > 0;
      const hasSubItems = Array.isArray(item.subItems) && item.subItems.length > 0;
      return !hasContent && hasSubItems;
    });

    if (itemsWithoutContentButWithSubItems.length > 0) {
      const newExpanded: Record<number, boolean> = {};
      itemsWithoutContentButWithSubItems.forEach((item) => {
        newExpanded[item.id] = true;
      });
      setExpandedItems({ ...expandedItems, ...newExpanded });
    }
  }, [block?.id]);

  // Автопрокрутка к активному элементу
  useEffect(() => {
    if (activeContextItemId === null) return;

    setTimeout(() => {
      const targetId = activeContextSubItemId ? `subitem-textarea-${activeContextItemId}-${activeContextSubItemId}` : `item-textarea-${activeContextItemId}`;
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetElement.focus();
      }
    }, 100);
  }, [activeContextItemId, activeContextSubItemId]);

  // Горячая клавиша Ctrl+E для fullscreen
  const handleOpenActiveItemEditor = () => {
    if (!block) return;

    if (activeContextSubItemId && activeContextItemId) {
      const activeItem = block.items.find((item) => item.id === activeContextItemId);
      if (!activeItem || !Array.isArray(activeItem.subItems)) return;

      const activeSubItem = activeItem.subItems.find((subItem) => subItem.id === activeContextSubItemId);
      if (!activeSubItem) return;

      handleOpenFullscreenEditor(activeContextItemId, activeSubItem.content || '', activeSubItem.title, activeContextSubItemId);
    } else if (activeContextItemId) {
      const activeItem = block.items.find((item) => item.id === activeContextItemId);
      if (!activeItem) return;

      handleOpenFullscreenEditor(activeContextItemId, activeItem.content || '', activeItem.title);
    }
  };

  useKeyboardShortcut(
    {
      'ctrl+e': () => {
        const editorContainer = editorContainerRef.current;
        if (editorContainer && editorContainer.contains(document.activeElement)) {
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
          <p className="text-lg font-medium text-gray-300 mb-2">{t('editor.context.noSelection.title')}</p>
          <p className="text-sm text-gray-400">{t('editor.context.noSelection.description')}</p>
        </div>
      </div>
    );
  }

  const normalizedItems = Array.isArray(block.items)
    ? block.items.map((item) => ({
        ...item,
        content: item.content || '',
        chars: item.chars || 0,
        subItems: Array.isArray(item.subItems) ? item.subItems : [],
      }))
    : [];

  // Handlers
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject) return;
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? { ...b, title: e.target.value } : b));

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleItemTitleChange = async (itemId: number, title: string) => {
    if (!currentProject) return;
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => (item.id === itemId ? { ...item, title } : item)),
        };
      }
      return b;
    });

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleItemContentChange = async (itemId: number, content: string) => {
    if (!currentProject) return;
    const chars = content.length;
    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.map((item) => (item.id === itemId ? { ...item, content, chars } : item)),
        };
      }
      return b;
    });

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!currentProject) return;
    if (!window.confirm(t('editor.context.actions.deleteConfirm'))) return;

    const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
      if (b.id === block.id) {
        return {
          ...b,
          items: b.items.filter((item) => item.id !== itemId),
        };
      }
      return b;
    });

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleSubItemTitleChange = async (itemId: number, subItemId: number, title: string) => {
    if (!currentProject) return;
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

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleSubItemContentChange = async (itemId: number, subItemId: number, content: string) => {
    if (!currentProject) return;
    const chars = content.length;
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

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleDeleteSubItem = async (itemId: number, subItemId: number) => {
    if (!currentProject) return;
    if (!window.confirm(t('editor.context.actions.deleteConfirm'))) return;

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

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });
  };

  const handleStartAddingItem = () => {
    const defaultName = generateDefaultContextItemName(block);
    setNewItemTitle(defaultName);
    setIsAddingItem(true);

    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
        newItemInputRef.current.select();
      }
    }, 50);
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim() || !currentProject) return;

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

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });

    setNewItemTitle('');
    setIsAddingItem(false);
  };

  const handleStartAddingSubItem = (itemId: number) => {
    const item = block.items.find((i) => i.id === itemId);
    if (!item) return;

    const defaultName = generateDefaultContextSubItemName(item);
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

  const handleAddSubItem = async () => {
    if (!newSubItemTitle.trim() || !parentItemId || !currentProject) return;

    const newSubItem = {
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

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: { ...currentProject.data, contextBlocks: updatedBlocks },
    });

    setNewSubItemTitle('');
    setIsAddingSubItem(false);
    setParentItemId(null);

    // Раскрываем элемент, чтобы показать новый подэлемент
    if (!expandedItems[parentItemId]) {
      toggleExpandItem(parentItemId);
    }
  };

  const handleOpenFullscreenEditor = (itemId: number, content: string, title: string, subItemId: number | null = null) => {
    setFullscreenEditor({
      isOpen: true,
      content,
      title: `${t('editor.context.editing')} ${title}`,
      itemId,
      subItemId,
    });
  };

  const handleSaveFullscreenEditor = (newContent: string) => {
    const { itemId, subItemId } = fullscreenEditor;
    if (itemId === null) return;

    if (subItemId !== null) {
      handleSubItemContentChange(itemId, subItemId, newContent);
    } else {
      handleItemContentChange(itemId, newContent);
    }

    setFullscreenEditor({ ...fullscreenEditor, isOpen: false });
  };

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

  const handleApplySplit = async (contentParts: string[], createSubItems: boolean, keepOriginal: boolean) => {
    if (!currentProject || contentParts.length === 0) return;

    const { itemId } = splitModalState;
    if (itemId === null) return;

    const originalItem = block.items.find((item) => item.id === itemId);
    if (!originalItem) return;

    if (contentParts.length === 1) {
      await handleItemContentChange(itemId, contentParts[0]);
      return;
    }

    if (createSubItems) {
      // Создаём подэлементы
      const newSubItems = contentParts.map((content, i) => ({
        id: Date.now() + i,
        title: `${originalItem.title} (${t('editor.context.split.part')} ${i + 1})`,
        content,
        chars: content.length,
      }));

      const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
        if (b.id === block.id) {
          return {
            ...b,
            items: b.items.map((item) => {
              if (item.id === itemId) {
                const updatedSubItems = [...(item.subItems || []), ...newSubItems];
                return keepOriginal ? { ...item, subItems: updatedSubItems } : { ...item, content: contentParts[0], chars: contentParts[0].length, subItems: updatedSubItems.slice(1) };
              }
              return item;
            }),
          };
        }
        return b;
      });

      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data: { ...currentProject.data, contextBlocks: updatedBlocks },
      });

      toggleExpandItem(itemId);
    } else {
      // Создаём новые элементы
      const newItems: ContextItem[] = contentParts.map((content, i) => ({
        id: Date.now() + i,
        title: `${originalItem.title} (${t('editor.context.split.part')} ${i + 1})`,
        content,
        chars: content.length,
        subItems: [],
      }));

      const updatedBlocks = currentProject.data.contextBlocks.map((b) => {
        if (b.id === block.id) {
          if (keepOriginal) {
            return { ...b, items: [...b.items, ...newItems] };
          } else {
            const itemIndex = b.items.findIndex((i) => i.id === itemId);
            const beforeItems = b.items.slice(0, itemIndex);
            const afterItems = b.items.slice(itemIndex + 1);
            const updatedFirstItem = { ...b.items[itemIndex], content: contentParts[0], chars: contentParts[0].length };
            return { ...b, items: [...beforeItems, updatedFirstItem, ...newItems.slice(1), ...afterItems] };
          }
        }
        return b;
      });

      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data: { ...currentProject.data, contextBlocks: updatedBlocks },
      });
    }

    setSplitModalState({ ...splitModalState, isOpen: false });
  };

  const handleTextareaFocus = (itemId: number) => {
    setActiveContextItem(itemId, null);
  };

  const handleSubItemTextareaFocus = (itemId: number, subItemId: number) => {
    setActiveContextItem(itemId, subItemId);
  };

  return (
    <div ref={editorContainerRef} className="p-4">
      {/* Block title */}
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">{t('editor.context.title')}</label>
        <input type="text" value={block.title} onChange={handleTitleChange} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" />
      </div>

      {/* Items */}
      {normalizedItems.map((item) => (
        <div
          key={item.id}
          className={`mb-6 bg-gray-800 border rounded-lg transition-all duration-200 ${
            activeContextItemId === item.id && !activeContextSubItemId ? 'border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/20' : 'border-gray-700'
          }`}
        >
          {/* Item header */}
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <div className="flex items-center flex-1 mr-4">
              {Array.isArray(item.subItems) && item.subItems.length > 0 && (
                <button
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium mr-3 transition-all ${
                    expandedItems[item.id] ? 'bg-blue-900 text-blue-300 border border-blue-700' : 'bg-gray-700 text-gray-300 border border-gray-600'
                  }`}
                  onClick={() => toggleExpandItem(item.id)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 transition-transform ${expandedItems[item.id] ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-mono">{item.subItems.length}</span>
                </button>
              )}
              <input
                className="bg-transparent text-white focus:outline-none w-full font-medium"
                value={item.title}
                onChange={(e) => handleItemTitleChange(item.id, e.target.value)}
                placeholder={t('editor.context.item.placeholder')}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-mono">{item.chars} {t('editor.context.item.chars')}</span>
              <button className="text-indigo-400 hover:text-indigo-300 p-1" onClick={() => handleOpenSplitModal(item.id)} title={t('editor.context.actions.split')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"
                  />
                </svg>
              </button>
              <button className="text-blue-400 hover:text-blue-300 p-1" onClick={() => handleOpenFullscreenEditor(item.id, item.content, item.title)} title={t('editor.context.actions.edit')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button className="text-green-400 hover:text-green-300 p-1" onClick={() => handleStartAddingSubItem(item.id)} title={t('editor.context.actions.addSubItem')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button className="text-red-400 hover:text-red-300 p-1" onClick={() => handleDeleteItem(item.id)} title={t('editor.context.actions.deleteItem')}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Item content textarea */}
          <textarea
            id={`item-textarea-${item.id}`}
            className="w-full h-48 px-3 py-2 bg-gray-800 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder={t('editor.context.item.textPlaceholder')}
            value={item.content}
            onChange={(e) => handleItemContentChange(item.id, e.target.value)}
            onFocus={() => handleTextareaFocus(item.id)}
          />

          {/* Sub-items */}
          {expandedItems[item.id] && Array.isArray(item.subItems) && item.subItems.length > 0 && (
            <div className="border-t border-gray-700 p-3 bg-gray-850">
              <div className="px-3 mb-3 flex items-center justify-between">
                <span className="text-xs font-medium text-blue-400 uppercase">{t('editor.context.subItem.title')} ({item.subItems.length})</span>
                <button className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded hover:bg-blue-800" onClick={() => handleStartAddingSubItem(item.id)}>
                  {t('editor.context.subItem.addButton')}
                </button>
              </div>

              {item.subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className={`p-3 mx-3 my-2 border rounded-md ${activeContextSubItemId === subItem.id && activeContextItemId === item.id ? 'border-cyan-400 bg-cyan-900/30 ring-2 ring-cyan-400/40' : 'border-gray-600 bg-gray-750'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <input
                      className="bg-transparent text-white focus:outline-none w-full text-sm font-medium"
                      value={subItem.title}
                      onChange={(e) => handleSubItemTitleChange(item.id, subItem.id, e.target.value)}
                      placeholder={t('editor.context.subItem.placeholder')}
                    />
                    <div className="flex items-center gap-2 ml-4">
                      <span className="text-xs text-gray-500 font-mono">{subItem.chars} {t('editor.context.item.chars')}</span>
                      <button className="text-blue-400 hover:text-blue-300 p-1" onClick={() => handleOpenFullscreenEditor(item.id, subItem.content || '', subItem.title, subItem.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button className="text-red-400 hover:text-red-300 p-1" onClick={() => handleDeleteSubItem(item.id, subItem.id)}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <textarea
                    id={`subitem-textarea-${item.id}-${subItem.id}`}
                    className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder={t('editor.context.subItem.textPlaceholder')}
                    value={subItem.content || ''}
                    onChange={(e) => handleSubItemContentChange(item.id, subItem.id, e.target.value)}
                    onFocus={() => handleSubItemTextareaFocus(item.id, subItem.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Add item form */}
      {isAddingItem ? (
        <div className="mb-4">
          <input
            ref={newItemInputRef}
            type="text"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white mb-2"
            placeholder={t('editor.context.item.newPlaceholder')}
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddItem();
              if (e.key === 'Escape') setIsAddingItem(false);
            }}
          />
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handleAddItem}>
              {t('editor.context.buttons.create')}
            </button>
            <button className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={() => setIsAddingItem(false)}>
              {t('editor.context.buttons.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button className="px-4 py-2 bg-blue-700 text-white rounded-full hover:bg-blue-600 flex items-center" onClick={handleStartAddingItem}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {t('editor.context.item.addButton')}
          </button>
        </div>
      )}

      {/* Add subitem modal */}
      {isAddingSubItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-lg">
            <h3 className="text-lg font-medium text-white mb-4">{t('editor.context.subItem.modalTitle')}</h3>
            <input
              ref={newSubItemInputRef}
              type="text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mb-4"
              placeholder={t('editor.context.subItem.placeholder')}
              value={newSubItemTitle}
              onChange={(e) => setNewSubItemTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddSubItem();
                if (e.key === 'Escape') setIsAddingSubItem(false);
              }}
            />
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={() => setIsAddingSubItem(false)}>
                {t('editor.context.buttons.cancel')}
              </button>
              <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handleAddSubItem}>
                {t('editor.context.buttons.create')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen editor */}
      <FullscreenEditor
        isOpen={fullscreenEditor.isOpen}
        onClose={() => setFullscreenEditor({ ...fullscreenEditor, isOpen: false })}
        onSave={handleSaveFullscreenEditor}
        title={fullscreenEditor.title}
        content={fullscreenEditor.content}
      />

      {/* Split content modal */}
      <SplitContentModal isOpen={splitModalState.isOpen} onClose={() => setSplitModalState({ ...splitModalState, isOpen: false })} onApply={handleApplySplit} content={splitModalState.content} title={splitModalState.title} />
    </div>
  );
};

export default ContextEditor;

