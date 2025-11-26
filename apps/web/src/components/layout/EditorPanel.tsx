import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';
import ContextEditor from '../context/ContextEditor';
import PromptEditor from '../prompt/PromptEditor';

const EditorPanel = () => {
  const { t } = useTranslation();
  const { activeTab, currentProject } = useEditor();

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
  return (
    <div className="w-full h-full p-6">
      <PromptEditor />
    </div>
  );
};

export default EditorPanel;

