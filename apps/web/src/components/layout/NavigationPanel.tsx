import { useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';
import { useProjectUpdate } from '../../hooks/useProjectUpdate';
import type { ContextBlock, PromptBlock } from '@promptozaurus/shared';
import {
  generateDefaultContextBlockName,
  generateDefaultPromptBlockName,
} from '../../utils/nameGenerators';

const NavigationPanel = () => {
  const { t } = useTranslation('navigation');
  const {
    activeTab,
    setActiveTab,
    activeContextBlockId,
    activePromptBlockId,
    setActiveContextBlock,
    setActivePromptBlock,
    currentProject,
  } = useEditor();

  const { updateProjectAndRefresh } = useProjectUpdate();

  // Get blocks from current project
  const contextBlocks = currentProject?.data?.contextBlocks || [];
  const promptBlocks = currentProject?.data?.promptBlocks || [];

  // Функция для форматирования числа с разделителями разрядов
  const formatNumberWithSeparators = (num: number) =>
    num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  // Функция для подсчета общего количества символов в блоке контекста
  const calculateTotalChars = (block: ContextBlock) => {
    if (!Array.isArray(block.items)) return 0;

    return block.items.reduce((total, item) => {
      let itemTotal = item.chars || 0;

      if (Array.isArray(item.subItems)) {
        itemTotal += item.subItems.reduce((subTotal, subItem) => subTotal + (subItem.chars || 0), 0);
      }

      return total + itemTotal;
    }, 0);
  };

  // Вычисляем количество символов для каждого блока контекста
  const contextBlocksWithChars = useMemo(
    () =>
      contextBlocks.map((block) => ({
        ...block,
        totalChars: calculateTotalChars(block),
      })),
    [contextBlocks]
  );

  // Обработчики для добавления новых блоков
  const handleAddContextBlock = async () => {
    if (!currentProject) {
      console.error('Нет текущего проекта для создания блока контекста');
      return;
    }

    console.log('Создание нового блока контекста для проекта:', currentProject.name);
    const defaultTitle = generateDefaultContextBlockName(contextBlocks);
    const newBlock: ContextBlock = {
      id: Date.now(),
      title: defaultTitle,
      items: [],
    };

    try {
      await updateProjectAndRefresh({
        ...currentProject.data,
        contextBlocks: [...contextBlocks, newBlock],
      });

      // Активируем новый блок контекста
      setActiveTab('context');
      setActiveContextBlock(newBlock.id);
      console.log('Блок контекста создан и активирован:', newBlock.id);
    } catch (error) {
      console.error('Ошибка создания блока контекста:', error);
    }
  };

  const handleAddPromptBlock = async () => {
    if (!currentProject) {
      console.error('Нет текущего проекта для создания блока промпта');
      return;
    }

    console.log('Создание нового блока промпта для проекта:', currentProject.name);
    const defaultTitle = generateDefaultPromptBlockName(promptBlocks);
    const newBlock: PromptBlock = {
      id: Date.now(),
      title: defaultTitle,
      template: '',
      selectedContexts: [],
    };

    try {
      await updateProjectAndRefresh({
        ...currentProject.data,
        promptBlocks: [...promptBlocks, newBlock],
      });

      // Активируем новый блок промпта
      setActiveTab('prompt');
      setActivePromptBlock(newBlock.id);
      console.log('Блок промпта создан и активирован:', newBlock.id);
    } catch (error) {
      console.error('Ошибка создания блока промпта:', error);
    }
  };

  // Обработчики для перемещения контекстных блоков
  const handleMoveContextBlockUp = async (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const index = contextBlocks.findIndex((b) => b.id === blockId);
    if (index <= 0) return;

    const newBlocks = [...contextBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newBlocks,
    });
  };

  const handleMoveContextBlockDown = async (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const index = contextBlocks.findIndex((b) => b.id === blockId);
    if (index === -1 || index >= contextBlocks.length - 1) return;

    const newBlocks = [...contextBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newBlocks,
    });
  };

  // Обработчики для перемещения промптов
  const handleMovePromptBlockUp = async (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const index = promptBlocks.findIndex((b) => b.id === blockId);
    if (index <= 0) return;

    const newBlocks = [...promptBlocks];
    [newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]];

    await updateProjectAndRefresh({
      ...currentProject.data,
      promptBlocks: newBlocks,
    });
  };

  const handleMovePromptBlockDown = async (blockId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const index = promptBlocks.findIndex((b) => b.id === blockId);
    if (index === -1 || index >= promptBlocks.length - 1) return;

    const newBlocks = [...promptBlocks];
    [newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]];

    await updateProjectAndRefresh({
      ...currentProject.data,
      promptBlocks: newBlocks,
    });
  };

  // Обработчики кликов
  const handleContextBlockClick = (blockId: number) => {
    setActiveContextBlock(blockId);
  };

  const handlePromptBlockClick = (blockId: number) => {
    setActivePromptBlock(blockId);
  };

  return (
    <nav className="w-full h-full bg-gray-800 p-3 overflow-y-auto">
      {/* Контексты */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3
            className={`text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === 'context' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('context')}
          >
            {t('contexts.title')}
          </h3>
          <button
            className={`p-1 rounded-full transition-colors ${
              currentProject 
                ? 'bg-blue-700 hover:bg-blue-600 text-white cursor-pointer' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleAddContextBlock}
            disabled={!currentProject}
            title={currentProject ? t('contexts.add') : t('contexts.noProjectSelected', 'Выберите проект')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <ul>
          {contextBlocksWithChars.map((block, index) => (
            <li
              key={block.id}
              className={`px-2 py-1 rounded cursor-pointer flex items-center justify-between group ${
                activeTab === 'context' && activeContextBlockId === block.id ? 'bg-blue-800 text-white' : 'hover:bg-gray-700'
              }`}
            >
              <div className="flex-grow flex items-center justify-between mr-2" onClick={() => handleContextBlockClick(block.id)}>
                <span className="truncate">{block.title}</span>
                <span className="text-xs text-gray-400 ml-2">{formatNumberWithSeparators(block.totalChars)}</span>
              </div>
              <div
                className={`flex space-x-1 ${
                  activeTab === 'context' && activeContextBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}
              >
                <button
                  className={`p-1 text-xs rounded hover:bg-gray-600 ${
                    index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={index !== 0 ? (e) => handleMoveContextBlockUp(block.id, e) : undefined}
                  disabled={index === 0}
                  title={index === 0 ? t('contexts.alreadyTop') : t('contexts.moveUp')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  className={`p-1 text-xs rounded hover:bg-gray-600 ${
                    index === contextBlocksWithChars.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={index !== contextBlocksWithChars.length - 1 ? (e) => handleMoveContextBlockDown(block.id, e) : undefined}
                  disabled={index === contextBlocksWithChars.length - 1}
                  title={index === contextBlocksWithChars.length - 1 ? t('contexts.alreadyBottom') : t('contexts.moveDown')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Промпты */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3
            className={`text-xs uppercase tracking-wider cursor-pointer ${
              activeTab === 'prompt' ? 'text-blue-400 font-semibold' : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('prompt')}
          >
            {t('prompts.title')}
          </h3>
          <button
            className={`p-1 rounded-full transition-colors ${
              currentProject 
                ? 'bg-green-700 hover:bg-green-600 text-white cursor-pointer' 
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            onClick={handleAddPromptBlock}
            disabled={!currentProject}
            title={currentProject ? t('prompts.add') : t('prompts.noProjectSelected', 'Выберите проект')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
        <ul>
          {promptBlocks.map((block, index) => (
            <li
              key={block.id}
              className={`px-2 py-1 rounded cursor-pointer flex items-center justify-between group ${
                activeTab === 'prompt' && activePromptBlockId === block.id ? 'bg-blue-800 text-white' : 'hover:bg-gray-700'
              }`}
            >
              <span className="flex-grow truncate mr-2" onClick={() => handlePromptBlockClick(block.id)}>
                {block.title}
              </span>
              <div
                className={`flex space-x-1 ${
                  activeTab === 'prompt' && activePromptBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                } transition-opacity`}
              >
                <button
                  className={`p-1 text-xs rounded hover:bg-gray-600 ${
                    index === 0 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={index !== 0 ? (e) => handleMovePromptBlockUp(block.id, e) : undefined}
                  disabled={index === 0}
                  title={index === 0 ? t('prompts.alreadyTop') : t('prompts.moveUp')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  className={`p-1 text-xs rounded hover:bg-gray-600 ${
                    index === promptBlocks.length - 1 ? 'text-gray-600 cursor-not-allowed' : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={index !== promptBlocks.length - 1 ? (e) => handleMovePromptBlockDown(block.id, e) : undefined}
                  disabled={index === promptBlocks.length - 1}
                  title={index === promptBlocks.length - 1 ? t('prompts.alreadyBottom') : t('prompts.moveDown')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default NavigationPanel;
