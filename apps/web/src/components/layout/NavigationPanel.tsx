import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';
import type { ContextBlock, PromptBlock } from '@promptozaurus/shared';

interface NavigationPanelProps {
  contextBlocks?: ContextBlock[];
  promptBlocks?: PromptBlock[];
}

const NavigationPanel = ({ contextBlocks = [], promptBlocks = [] }: NavigationPanelProps = {}) => {
  const { t } = useTranslation();
  const {
    activeTab,
    setActiveTab,
    activeContextBlockId,
    activePromptBlockId,
    setActiveContextBlock,
    setActivePromptBlock,
    currentProject,
  } = useEditor();

  // Get blocks from current project if available
  const contexts = contextBlocks.length > 0 ? contextBlocks : (currentProject?.data?.contextBlocks || []);
  const prompts = promptBlocks.length > 0 ? promptBlocks : (currentProject?.data?.promptBlocks || []);

  const handleAddContextBlock = () => {
    console.log('Add context block - will be implemented');
    // TODO: implement
  };

  const handleAddPromptBlock = () => {
    console.log('Add prompt block - will be implemented');
    // TODO: implement
  };

  const formatNumberWithSeparators = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  const calculateTotalChars = (block: ContextBlock) => {
    if (!Array.isArray(block.items)) return 0;
    
    return block.items.reduce((total, item) => {
      let itemTotal = item.chars || 0;
      
      if (Array.isArray(item.subItems)) {
        itemTotal += item.subItems.reduce((subTotal, subItem) => 
          subTotal + (subItem.chars || 0), 0);
      }
      
      return total + itemTotal;
    }, 0);
  };

  return (
    <nav className="w-full h-full bg-gray-800 p-3 overflow-y-auto">
      {/* Contexts section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3
            className={`text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === 'context' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('context')}
          >
            {t('navigation.contexts.title', 'Contexts')}
          </h3>
          <button
            className="p-1 rounded-full bg-blue-700 hover:bg-blue-600 text-white"
            onClick={handleAddContextBlock}
            title={t('navigation.contexts.add', 'Add context')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <ul>
          {contexts.map((block) => {
            const totalChars = calculateTotalChars(block);
            return (
              <li
                key={block.id}
                className={`px-2 py-1 rounded cursor-pointer flex items-center justify-between ${
                  activeTab === 'context' && activeContextBlockId === block.id
                    ? 'bg-blue-800 text-white'
                    : 'hover:bg-gray-700'
                }`}
                onClick={() => setActiveContextBlock(block.id)}
              >
                <span className="truncate flex-1">{block.title}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {formatNumberWithSeparators(totalChars)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Prompts section */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3
            className={`text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === 'prompt' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('prompt')}
          >
            {t('navigation.prompts.title', 'Prompts')}
          </h3>
          <button
            className="p-1 rounded-full bg-green-700 hover:bg-green-600 text-white"
            onClick={handleAddPromptBlock}
            title={t('navigation.prompts.add', 'Add prompt')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <ul>
          {prompts.map((block) => (
            <li
              key={block.id}
              className={`px-2 py-1 rounded cursor-pointer truncate ${
                activeTab === 'prompt' && activePromptBlockId === block.id
                  ? 'bg-blue-800 text-white'
                  : 'hover:bg-gray-700'
              }`}
              onClick={() => setActivePromptBlock(block.id)}
            >
              {block.title}
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavigationPanel;

