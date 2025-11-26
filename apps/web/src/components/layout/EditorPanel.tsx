import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';
import ContextEditor from '../context/ContextEditor';

const EditorPanel = () => {
  const { t } = useTranslation();
  const { activeTab, activePromptBlockId, currentProject } = useEditor();

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center text-gray-400">
          <p className="text-lg">{t('editor.noProject', 'No project selected')}</p>
          <p className="text-sm mt-2">{t('editor.selectOrCreate', 'Select or create a project to start')}</p>
        </div>
      </div>
    );
  }

  if (activeTab === 'context') {
    return (
      <div className="w-full h-full overflow-y-auto">
        <ContextEditor />
      </div>
    );
  }

  // Prompt tab
  const activeBlock = currentProject.data.promptBlocks?.find(
    (b) => b.id === activePromptBlockId
  );

  if (!activeBlock) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center text-gray-400">
          <p className="text-lg">{t('editor.prompt.noSelection.title', 'No prompt selected')}</p>
          <p className="text-sm mt-2">
            {t('editor.prompt.noSelection.description', 'Select an existing prompt or create a new one')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full p-6 overflow-y-auto">
      <h2 className="text-xl font-semibold text-white mb-4">{activeBlock.title}</h2>
      <div className="text-gray-300">
        <p>{t('editor.prompt.placeholder', 'Prompt editor will be here')}</p>
        <p className="text-sm mt-2">Template: {activeBlock.template?.length || 0} chars</p>
      </div>
    </div>
  );
};

export default EditorPanel;

