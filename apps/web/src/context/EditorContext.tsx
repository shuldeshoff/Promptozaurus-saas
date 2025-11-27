import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Project } from '../hooks/useProjects';
import type { ContextBlock, PromptBlock } from '@promptozaurus/shared';

interface EditorContextType {
  // Active tab
  activeTab: 'context' | 'prompt';
  setActiveTab: (tab: 'context' | 'prompt') => void;

  // Active blocks
  activeContextBlockId: number | null;
  activePromptBlockId: number | null;
  setActiveContextBlock: (id: number | null) => void;
  setActivePromptBlock: (id: number | null) => void;

  // Active items (for highlighting in editor)
  activeContextItemId: number | null;
  activeContextSubItemId: number | null;
  setActiveContextItem: (itemId: number | null, subItemId?: number | null) => void;

  // Expanded items (for context editor)
  expandedItems: Record<number, boolean>;
  toggleExpandItem: (itemId: number) => void;
  setExpandedItems: (items: Record<number, boolean>) => void;

  // Adding state
  isAddingItem: boolean;
  isAddingSubItem: boolean;
  setIsAddingItem: (value: boolean) => void;
  setIsAddingSubItem: (value: boolean) => void;

  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Panel sizes (for resize)
  navPanelWidth: number;
  blocksPanelWidth: number;
  setNavPanelWidth: (width: number) => void;
  setBlocksPanelWidth: (width: number) => void;

  // Selectors (из originals/src/context/utils/selectors.js)
  getActiveContextBlock: () => ContextBlock | undefined;
  getActivePromptBlock: () => PromptBlock | undefined;
  getSelectedContextsTotalChars: (promptId: number) => number;

  // Actions (из originals/src/context/AppContext.js)
  scrollToBlock: (blockType: 'context' | 'prompt', blockId: number) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  // Загрузка сохраненного состояния из localStorage
  const [activeTab, setActiveTabState] = useState<'context' | 'prompt'>(() => {
    const saved = localStorage.getItem('activeTab');
    return (saved as 'context' | 'prompt') || 'context';
  });

  const [activeContextBlockId, setActiveContextBlockIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('activeContextBlockId');
    return saved ? parseInt(saved, 10) : null;
  });

  const [activePromptBlockId, setActivePromptBlockIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('activePromptBlockId');
    return saved ? parseInt(saved, 10) : null;
  });

  const [activeContextItemId, setActiveContextItemId] = useState<number | null>(null);
  const [activeContextSubItemId, setActiveContextSubItemId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingSubItem, setIsAddingSubItem] = useState(false);
  
  const [currentProject, setCurrentProjectState] = useState<Project | null>(() => {
    const saved = localStorage.getItem('currentProjectId');
    return saved ? { id: saved } as Project : null; // Временно, загрузим полные данные из API
  });

  // Load panel sizes from localStorage or use defaults
  const [navPanelWidth, setNavPanelWidthState] = useState(() => {
    const saved = localStorage.getItem('navPanelWidth');
    return saved ? parseFloat(saved) : 16;
  });

  const [blocksPanelWidth, setBlocksPanelWidthState] = useState(() => {
    const saved = localStorage.getItem('blocksPanelWidth');
    return saved ? parseFloat(saved) : 40;
  });

  const setNavPanelWidth = useCallback((width: number) => {
    setNavPanelWidthState(width);
    localStorage.setItem('navPanelWidth', width.toString());
  }, []);

  const setBlocksPanelWidth = useCallback((width: number) => {
    setBlocksPanelWidthState(width);
    localStorage.setItem('blocksPanelWidth', width.toString());
  }, []);

  // Обертки для сохранения в localStorage
  const setActiveTab = useCallback((tab: 'context' | 'prompt') => {
    setActiveTabState(tab);
    localStorage.setItem('activeTab', tab);
  }, []);

  const setActiveContextBlockId = useCallback((id: number | null) => {
    setActiveContextBlockIdState(id);
    if (id !== null) {
      localStorage.setItem('activeContextBlockId', id.toString());
    } else {
      localStorage.removeItem('activeContextBlockId');
    }
  }, []);

  const setActivePromptBlockId = useCallback((id: number | null) => {
    setActivePromptBlockIdState(id);
    if (id !== null) {
      localStorage.setItem('activePromptBlockId', id.toString());
    } else {
      localStorage.removeItem('activePromptBlockId');
    }
  }, []);

  const setActiveContextBlock = useCallback((id: number | null) => {
    setActiveContextBlockId(id);
    if (id !== null) {
      setActiveTab('context');
    }
  }, [setActiveContextBlockId, setActiveTab]);

  const setActivePromptBlock = useCallback((id: number | null) => {
    setActivePromptBlockId(id);
    if (id !== null) {
      setActiveTab('prompt');
    }
  }, [setActivePromptBlockId, setActiveTab]);

  const setCurrentProject = useCallback((project: Project | null) => {
    console.log('setCurrentProject вызван с:', project?.name);
    setCurrentProjectState(project);
    if (project) {
      localStorage.setItem('currentProjectId', project.id);
      localStorage.setItem('currentProject', JSON.stringify(project));
      // Диспатчим событие для синхронизации между компонентами
      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: project }));
    } else {
      localStorage.removeItem('currentProjectId');
      localStorage.removeItem('currentProject');
      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: null }));
    }
  }, []);

  const setActiveContextItem = useCallback((itemId: number | null, subItemId?: number | null) => {
    setActiveContextItemId(itemId);
    setActiveContextSubItemId(subItemId || null);
  }, []);

  const toggleExpandItem = useCallback((itemId: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // Восстановление проекта из localStorage при монтировании
  useEffect(() => {
    const savedProject = localStorage.getItem('currentProject');
    if (savedProject) {
      try {
        const project = JSON.parse(savedProject);
        setCurrentProjectState(project);
        console.log('Восстановлен проект из localStorage:', project.name);
      } catch (error) {
        console.error('Ошибка восстановления проекта:', error);
        localStorage.removeItem('currentProject');
        localStorage.removeItem('currentProjectId');
      }
    }

    // Подписка на события обновления проекта
    const handleProjectUpdate = (event: CustomEvent) => {
      console.log('Получено событие projectUpdated:', event.detail?.name);
      setCurrentProjectState(event.detail);
    };

    window.addEventListener('projectUpdated', handleProjectUpdate as EventListener);
    
    return () => {
      window.removeEventListener('projectUpdated', handleProjectUpdate as EventListener);
    };
  }, []);

  // Селекторы (из originals/src/context/utils/selectors.js)
  
  /**
   * Получает активный блок контекста
   * Аналог: originals/src/context/utils/selectors.js строки 9-13
   */
  const getActiveContextBlock = useCallback((): ContextBlock | undefined => {
    if (!currentProject || !activeContextBlockId) return undefined;
    const block = currentProject.data.contextBlocks?.find((b) => b.id === activeContextBlockId);
    console.log('Получение активного блока контекста:', block?.title);
    return block;
  }, [currentProject, activeContextBlockId]);

  /**
   * Получает активный блок промпта
   * Аналог: originals/src/context/utils/selectors.js строки 20-24
   */
  const getActivePromptBlock = useCallback((): PromptBlock | undefined => {
    if (!currentProject || !activePromptBlockId) return undefined;
    const block = currentProject.data.promptBlocks?.find((b) => b.id === activePromptBlockId);
    console.log('Получение активного блока промпта:', block?.title);
    return block;
  }, [currentProject, activePromptBlockId]);

  /**
   * Вычисляет общее количество символов для выбранных контекстов в промпте
   * Аналог: originals/src/context/utils/selectors.js строки 264-330
   */
  const getSelectedContextsTotalChars = useCallback((promptId: number): number => {
    if (!currentProject) return 0;

    const prompt = currentProject.data.promptBlocks?.find((b) => b.id === promptId);
    if (!prompt) {
      console.log(`Промпт с id=${promptId} не найден для подсчета символов`);
      return 0;
    }

    if (!Array.isArray(prompt.selectedContexts) || prompt.selectedContexts.length === 0) {
      console.log(`У промпта с id=${promptId} нет выбранных контекстов`);
      return 0;
    }

    const totalChars = prompt.selectedContexts.reduce((total, selection) => {
      // Проверка на корректность данных выбора
      if (!selection || !selection.blockId) {
        return total;
      }

      const block = currentProject.data.contextBlocks?.find((b) => b.id === selection.blockId);
      if (!block || !Array.isArray(block.items)) {
        console.log(`Блок контекста с id=${selection.blockId} не найден при подсчете символов`);
        return total;
      }

      // Проверка на наличие массива itemIds в selection
      const selectedItemIds = Array.isArray(selection.itemIds) ? selection.itemIds : [];

      // Подсчитываем символы в выбранных элементах
      const selectedItemsChars = block.items
        .filter((item) => selectedItemIds.includes(item.id))
        .reduce((sum, item) => sum + (item.chars || 0), 0);

      // Подсчитываем символы во всех выбранных подэлементах
      let selectedSubItemsChars = 0;
      const selectedSubItemIds = Array.isArray(selection.subItemIds) ? selection.subItemIds : [];

      if (selectedSubItemIds.length > 0) {
        // Перебираем все элементы и их подэлементы
        block.items.forEach((item) => {
          if (!Array.isArray(item.subItems)) return;

          // Фильтруем подэлементы, относящиеся к текущему элементу
          const itemSubItemIds = selectedSubItemIds
            .filter((id) => id.startsWith(`${item.id}.`))
            .map((id) => parseInt(id.split('.')[1], 10));

          // Считаем символы в выбранных подэлементах
          item.subItems.forEach((subItem) => {
            if (itemSubItemIds.includes(subItem.id)) {
              selectedSubItemsChars += subItem.chars || 0;
            }
          });
        });
      }

      return total + selectedItemsChars + selectedSubItemsChars;
    }, 0);

    console.log(`Общее количество символов для промпта ${promptId}: ${totalChars}`);
    return totalChars;
  }, [currentProject]);

  /**
   * Прокрутка к блоку с анимацией и подсветкой
   * Аналог: originals/src/context/AppContext.js строки 54-87
   */
  const scrollToBlock = useCallback((blockType: 'context' | 'prompt', blockId: number) => {
    try {
      const selector = `div[data-block-type="${blockType}"][data-block-id="${blockId}"]`;
      const blockElement = document.querySelector(selector);
      if (blockElement) {
        // Находим контейнер с прокруткой
        const panelContainer = blockElement.closest('.overflow-y-auto');
        if (panelContainer) {
          // Получаем верхнюю позицию блока
          const blockTop = (blockElement as HTMLElement).offsetTop;

          // Вычисляем высоту верхней панели (примерно 60px для Header + немного отступа)
          const headerOffset = 70;

          // Учитываем отступ для лучшей видимости
          const scrollPosition = blockTop - headerOffset;

          // Анимированная прокрутка с учетом отступа
          panelContainer.scrollTo({
            top: scrollPosition,
            behavior: 'smooth',
          });

          // Добавляем подсветку для привлечения внимания
          blockElement.classList.add('highlight-block');
          setTimeout(() => {
            blockElement.classList.remove('highlight-block');
          }, 1500);

          console.log(`Прокрутка к блоку ${blockType}:${blockId}`);
        }
      }
    } catch (error) {
      console.error('Error scrolling to block:', error);
    }
  }, []);

  const value: EditorContextType = {
    activeTab,
    setActiveTab,
    activeContextBlockId,
    activePromptBlockId,
    setActiveContextBlock,
    setActivePromptBlock,
    activeContextItemId,
    activeContextSubItemId,
    setActiveContextItem,
    expandedItems,
    toggleExpandItem,
    setExpandedItems,
    isAddingItem,
    isAddingSubItem,
    setIsAddingItem,
    setIsAddingSubItem,
    currentProject,
    setCurrentProject,
    navPanelWidth,
    blocksPanelWidth,
    setNavPanelWidth,
    setBlocksPanelWidth,
    // Селекторы
    getActiveContextBlock,
    getActivePromptBlock,
    getSelectedContextsTotalChars,
    // Actions
    scrollToBlock,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}

