import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';

const BlocksPanel = () => {
  const { t } = useTranslation();
  const { activeTab, activeContextBlockId, activePromptBlockId, currentProject } = useEditor();

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-gray-400">
          <p>{t('blocks.noProject', 'No project selected')}</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'context') {
    const activeBlock = currentProject.data.contextBlocks?.find(
      (b) => b.id === activeContextBlockId
    );

    if (!activeBlock) {
      return (
        <div className="flex items-center justify-center h-full p-4">
          <div className="text-center text-gray-400">
            <p>{t('blocks.noContextSelected', 'No context block selected')}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold text-white mb-4">{activeBlock.title}</h2>
        <div className="space-y-2">
          {activeBlock.items && activeBlock.items.length > 0 ? (
            activeBlock.items.map((item) => (
              <div key={item.id} className="p-2 bg-gray-700 rounded">
                <div className="text-sm text-white">{item.title}</div>
                <div className="text-xs text-gray-400">{item.chars || 0} chars</div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">{t('blocks.noItems', 'No items yet')}</p>
          )}
        </div>
      </div>
    );
  }

  // Prompt tab
  const activeBlock = currentProject.data.promptBlocks?.find(
    (b) => b.id === activePromptBlockId
  );

  if (!activeBlock) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <div className="text-center text-gray-400">
          <p>{t('blocks.noPromptSelected', 'No prompt block selected')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold text-white mb-4">{activeBlock.title}</h2>
      <div className="text-sm text-gray-300">
        <p>{t('blocks.template', 'Template')}: {activeBlock.template?.length || 0} chars</p>
        <p>{t('blocks.selectedContexts', 'Selected contexts')}: {activeBlock.selectedContexts?.length || 0}</p>
      </div>
    </div>
  );
};

export default BlocksPanel;

