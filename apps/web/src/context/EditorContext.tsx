import React, { createContext, useContext, useState, useCallback } from 'react';
import type { Project } from '../hooks/useProjects';

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
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<'context' | 'prompt'>('context');
  const [activeContextBlockId, setActiveContextBlockId] = useState<number | null>(null);
  const [activePromptBlockId, setActivePromptBlockId] = useState<number | null>(null);
  const [activeContextItemId, setActiveContextItemId] = useState<number | null>(null);
  const [activeContextSubItemId, setActiveContextSubItemId] = useState<number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingSubItem, setIsAddingSubItem] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

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

  const setActiveContextBlock = useCallback((id: number | null) => {
    setActiveContextBlockId(id);
    if (id !== null) {
      setActiveTab('context');
    }
  }, []);

  const setActivePromptBlock = useCallback((id: number | null) => {
    setActivePromptBlockId(id);
    if (id !== null) {
      setActiveTab('prompt');
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

