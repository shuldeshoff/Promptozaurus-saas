import { useMemo, useCallback, useRef } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useUpdateProject } from '../../hooks/useProjects';
import { useTranslation } from 'react-i18next';
import type { PromptBlock, SelectedContext } from '@promptozaurus/shared';
import { ContextSelectionPanel, type ContextSelectionPanelRef } from '../context-selection';
import { calculateSelectedContextsChars } from '../../utils/contextCalculations';

interface PromptBlockItemProps {
  block: PromptBlock;
  isActive: boolean;
}

const PromptBlockItem = ({ block, isActive }: PromptBlockItemProps) => {
  const { t } = useTranslation('blockItem');
  const { currentProject } = useEditor();
  const updateProjectMutation = useUpdateProject();
  const selectionPanelRef = useRef<ContextSelectionPanelRef>(null);

  // Get context blocks from current project
  const contextBlocks = currentProject?.data?.contextBlocks || [];

  // Подсчёт символов в выбранных контекстах
  const totalChars = useMemo(() => {
    try {
      return calculateSelectedContextsChars(block.selectedContexts || [], contextBlocks);
    } catch (error) {
      console.error('Error counting characters:', error);
      return 0;
    }
  }, [block.selectedContexts, contextBlocks]);

  // Удаление промпт-блока
  const handleDeleteBlock = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!currentProject) return;

      if (!window.confirm(t('prompt.delete'))) return;

      const newPromptBlocks = currentProject.data.promptBlocks.filter((b) => b.id !== block.id);

      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data: {
          ...currentProject.data,
          promptBlocks: newPromptBlocks,
        },
      });
    },
    [currentProject, block.id, updateProjectMutation, t]
  );

  // Обработчик изменения выбора контекста
  const handleSelectionChange = useCallback(
    async (newSelectedContexts: SelectedContext[], newSelectionOrder: string[]) => {
      if (!currentProject) return;

      const updatedBlock = {
        ...block,
        selectedContexts: newSelectedContexts,
        selectionOrder: newSelectionOrder,
      };

      const newPromptBlocks = currentProject.data.promptBlocks.map((b) => (b.id === block.id ? updatedBlock : b));

      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data: {
          ...currentProject.data,
          promptBlocks: newPromptBlocks,
        },
      });
    },
    [currentProject, block, updateProjectMutation]
  );

  // Обработчики для кнопок выбора
  const handleSelectAll = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectionPanelRef.current?.selectAll();
  }, []);

  const handleClearSelection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    selectionPanelRef.current?.clearSelection();
  }, []);

  // Проверка есть ли выбранные элементы
  const hasSelection = block.selectedContexts && block.selectedContexts.length > 0;

  return (
    <div
      className={`mb-6 p-4 border rounded-md cursor-pointer transition-all duration-300 ${
        isActive
          ? 'border-green-500 shadow-lg bg-green-900 bg-opacity-20 active-prompt-block'
          : 'border-green-900 hover:border-green-700 bg-gray-800 hover:bg-gray-750'
      }`}
      data-block-type="prompt"
      data-block-id={block.id}
    >
      {/* Заголовок блока */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-3">
          <h3 className={`font-medium text-lg ${isActive ? 'text-green-300' : 'text-green-400'}`}>{block.title}</h3>
          {/* Кнопки выбора контекста */}
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
              onClick={handleSelectAll}
              title={t('prompt.selectAllTooltip')}
            >
              {t('prompt.selectAll')}
            </button>
            {hasSelection && (
              <button
                className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                onClick={handleClearSelection}
                title={t('prompt.deselectAllTooltip')}
              >
                {t('prompt.deselectAll')}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Кнопка удаления */}
          <button className="p-1 text-xs text-red-400 hover:text-red-300 rounded" onClick={handleDeleteBlock} title={t('prompt.deleteTooltip')}>
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

      {/* Панель выбора контекста с drag-select */}
      <div onClick={(e) => e.stopPropagation()}>
        <ContextSelectionPanel
          ref={selectionPanelRef}
          contextBlocks={contextBlocks}
          selectedContexts={block.selectedContexts || []}
          selectionOrder={block.selectionOrder}
          onSelectionChange={handleSelectionChange}
          totalChars={totalChars}
        />
      </div>
    </div>
  );
};

export default PromptBlockItem;
