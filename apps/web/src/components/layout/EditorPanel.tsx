import { useEditor } from '../../context/EditorContext';
import ContextEditor from '../context/ContextEditor';
import PromptEditor from '../prompt/PromptEditor';

const EditorPanel = () => {
  const { activeTab } = useEditor();

  return (
    <div className="flex-1 p-4 bg-gray-900 overflow-y-auto">
      {/* Отображение редактора для контекстных блоков */}
      {activeTab === 'context' && <ContextEditor />}
      
      {/* Отображение редактора для блоков промптов */}
      {activeTab === 'prompt' && <PromptEditor />}
    </div>
  );
};

export default EditorPanel;

