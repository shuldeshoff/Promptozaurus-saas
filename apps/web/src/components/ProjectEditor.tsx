import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Project as SharedProject, PromptBlock, SelectedContext, ContextBlock } from '@promptozaurus/shared';
import { useCompilePrompt } from '../hooks/useContextPrompt';
import { useUpdateProject } from '../hooks/useProjects';
import TemplateLibraryModal from './TemplateLibraryModal';
import CreateBlockModal from './CreateBlockModal';
import { ContextSelectionPanel, ContextSelectionPanelRef } from './context-selection';

interface Project extends Omit<SharedProject, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

interface ProjectEditorProps {
  project: Project;
}

export default function ProjectEditor({ project }: ProjectEditorProps) {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'context' | 'prompts'>('context');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreateContextModalOpen, setIsCreateContextModalOpen] = useState(false);
  const [isCreatePromptModalOpen, setIsCreatePromptModalOpen] = useState(false);
  const [expandedPromptId, setExpandedPromptId] = useState<number | null>(null);
  
  const compileMutation = useCompilePrompt();
  const updateProjectMutation = useUpdateProject();
  const selectionPanelRef = useRef<ContextSelectionPanelRef>(null);

  const contextBlocks = project.data.contextBlocks || [];
  const promptBlocks = project.data.promptBlocks || [];

  const handleTemplateSelect = (filename: string) => {
    console.log('Selected template:', filename);
    // TODO: Implement template insertion into current prompt
  };

  const handleCompilePrompt = async (promptId: number) => {
    try {
      const result = await compileMutation.mutateAsync({
        projectId: project.id,
        promptId,
        wrapWithTags: false,
      });
      
      await navigator.clipboard.writeText(result.compiled);
      alert(t('messages.copiedToClipboard', 'Copied to clipboard!'));
    } catch {
      alert(t('messages.failedToCompile', 'Failed to compile prompt'));
    }
  };

  const handleSelectionChange = async (promptId: number, selectedContexts: SelectedContext[], selectionOrder: string[]) => {
    const updatedPromptBlocks = promptBlocks.map(p =>
      p.id === promptId
        ? { ...p, selectedContexts, selectionOrder }
        : p
    );

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks,
          promptBlocks: updatedPromptBlocks,
        },
      });
    } catch (error) {
      console.error('Failed to update selection:', error);
    }
  };

  const togglePromptExpansion = (promptId: number) => {
    setExpandedPromptId(expandedPromptId === promptId ? null : promptId);
  };

  const handleAddContextBlock = async () => {
    setIsCreateContextModalOpen(true);
  };

  const handleConfirmCreateContextBlock = async (title: string) => {
    const newBlock: ContextBlock = {
      id: Date.now(),
      title: title.trim(),
      items: [],
    };

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks: [...contextBlocks, newBlock],
          promptBlocks,
        },
      });
    } catch (error) {
      console.error('Failed to add context block:', error);
      alert(t('messages.failedToAddBlock', 'Failed to add block'));
    }
  };

  const handleEditContextBlock = async (blockId: number) => {
    const block = contextBlocks.find(b => b.id === blockId);
    if (!block) return;

    const newTitle = prompt(t('messages.enterBlockName', 'Enter block name:'), block.title);
    if (!newTitle || !newTitle.trim() || newTitle === block.title) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks: contextBlocks.map(b => 
            b.id === blockId ? { ...b, title: newTitle.trim() } : b
          ),
          promptBlocks,
        },
      });
    } catch (error) {
      console.error('Failed to edit context block:', error);
      alert(t('messages.failedToEditBlock', 'Failed to edit block'));
    }
  };

  const handleDeleteContextBlock = async (blockId: number) => {
    if (!confirm(t('messages.confirmDeleteBlock', 'Are you sure you want to delete this block?'))) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks: contextBlocks.filter(b => b.id !== blockId),
          promptBlocks,
        },
      });
    } catch (error) {
      console.error('Failed to delete context block:', error);
      alert(t('messages.failedToDeleteBlock', 'Failed to delete block'));
    }
  };

  const handleAddPrompt = async () => {
    setIsCreatePromptModalOpen(true);
  };

  const handleConfirmCreatePrompt = async (title: string) => {
    const newPrompt: PromptBlock = {
      id: Date.now(),
      title: title.trim(),
      template: '',
      selectedContexts: [],
      selectionOrder: [],
    };

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks,
          promptBlocks: [...promptBlocks, newPrompt],
        },
      });
    } catch (error) {
      console.error('Failed to add prompt:', error);
      alert(t('messages.failedToAddPrompt', 'Failed to add prompt'));
    }
  };

  const handleEditPrompt = async (promptId: number) => {
    const prompt = promptBlocks.find(p => p.id === promptId);
    if (!prompt) return;

    const newTitle = window.prompt(t('messages.enterPromptName', 'Enter prompt name:'), prompt.title);
    if (!newTitle || !newTitle.trim() || newTitle === prompt.title) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks,
          promptBlocks: promptBlocks.map(p => 
            p.id === promptId ? { ...p, title: newTitle.trim() } : p
          ),
        },
      });
    } catch (error) {
      console.error('Failed to edit prompt:', error);
      alert(t('messages.failedToEditPrompt', 'Failed to edit prompt'));
    }
  };

  const handleDeletePrompt = async (promptId: number) => {
    if (!confirm(t('messages.confirmDeletePrompt', 'Are you sure you want to delete this prompt?'))) return;

    try {
      await updateProjectMutation.mutateAsync({
        id: project.id,
        data: {
          contextBlocks,
          promptBlocks: promptBlocks.filter(p => p.id !== promptId),
        },
      });
    } catch (error) {
      console.error('Failed to delete prompt:', error);
      alert(t('messages.failedToDeletePrompt', 'Failed to delete prompt'));
    }
  };

  const calculateTotalChars = (prompt: PromptBlock): number => {
    let total = 0;
    
    prompt.selectedContexts.forEach(sel => {
      const block = contextBlocks.find(b => b.id === sel.blockId);
      if (!block) return;

      sel.itemIds.forEach(itemId => {
        const item = block.items.find(i => i.id === itemId);
        if (item) total += item.chars;
      });

      sel.subItemIds.forEach(subItemKey => {
        const [itemId, subItemId] = subItemKey.split('.').map(Number);
        const item = block.items.find(i => i.id === itemId);
        const subItem = item?.subItems?.find(s => s.id === subItemId);
        if (subItem) total += subItem.chars;
      });
    });

    return total;
  };

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('context')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'context'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {t('labels.contextBlocks', 'Context Blocks')} ({contextBlocks.length})
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'prompts'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          {t('labels.prompts', 'Prompts')} ({promptBlocks.length})
        </button>
        <div className="flex-1"></div>
        <button
          onClick={() => setIsTemplateModalOpen(true)}
          className="px-6 py-3 font-medium text-gray-400 hover:text-gray-300 transition-colors"
        >
          📚 {t('labels.templates', 'Templates')}
        </button>
      </div>

      {/* Template Library Modal */}
      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onSelectTemplate={handleTemplateSelect}
      />

      {/* Create Context Block Modal */}
      <CreateBlockModal
        isOpen={isCreateContextModalOpen}
        onClose={() => setIsCreateContextModalOpen(false)}
        onConfirm={handleConfirmCreateContextBlock}
        type="context"
        defaultNumber={contextBlocks.length + 1}
      />

      {/* Create Prompt Block Modal */}
      <CreateBlockModal
        isOpen={isCreatePromptModalOpen}
        onClose={() => setIsCreatePromptModalOpen(false)}
        onConfirm={handleConfirmCreatePrompt}
        type="prompt"
        defaultNumber={promptBlocks.length + 1}
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'context' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {t('labels.contextBlocks', 'Context Blocks')}
              </h2>
              <button
                onClick={handleAddContextBlock}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + {t('buttons.addBlock', 'Add Block')}
              </button>
            </div>

            {contextBlocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-xl mb-2">
                  {t('messages.noContextBlocks', 'No context blocks yet')}
                </p>
                <p className="text-sm">
                  {t('messages.createFirstContext', 'Create your first context block to get started')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {contextBlocks.map((block) => (
                  <div
                    key={block.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{block.title}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEditContextBlock(block.id)}
                          className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                        >
                          {t('buttons.edit', 'Edit')}
                        </button>
                        <button 
                          onClick={() => handleDeleteContextBlock(block.id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                        >
                          {t('buttons.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {block.items.length} {t('labels.items', 'items')} • 
                      {block.items.reduce((sum, item) => sum + item.chars, 0)} {t('labels.chars', 'chars')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {t('labels.prompts', 'Prompts')}
              </h2>
              <button
                onClick={handleAddPrompt}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + {t('buttons.addPrompt', 'Add Prompt')}
              </button>
            </div>

            {promptBlocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-xl mb-2">
                  {t('messages.noPrompts', 'No prompts yet')}
                </p>
                <p className="text-sm">
                  {t('messages.createFirstPrompt', 'Create your first prompt to get started')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {promptBlocks.map((prompt) => {
                  const isExpanded = expandedPromptId === prompt.id;
                  const totalChars = calculateTotalChars(prompt);
                  
                  return (
                    <div
                      key={prompt.id}
                      className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white">{prompt.title}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePromptExpansion(prompt.id)}
                            className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
                          >
                            {isExpanded ? '🔼 Hide' : '🔽 Select Contexts'}
                          </button>
                          <button
                            onClick={() => handleCompilePrompt(prompt.id)}
                            disabled={compileMutation.isPending}
                            className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                          >
                            {compileMutation.isPending ? t('buttons.compiling', 'Compiling...') : t('buttons.compile', 'Compile')}
                          </button>
                          <button 
                            onClick={() => handleEditPrompt(prompt.id)}
                            className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
                          >
                            {t('buttons.edit', 'Edit')}
                          </button>
                          <button 
                            onClick={() => handleDeletePrompt(prompt.id)}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            {t('buttons.delete', 'Delete')}
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 mb-3">
                        {prompt.selectedContexts.length} {t('labels.contextsSelected', 'contexts selected')} • 
                        {totalChars} {t('labels.chars', 'chars')} • 
                        Template: {prompt.template.length} {t('labels.chars', 'chars')}
                      </div>

                      {/* Context Selection Panel */}
                      {isExpanded && contextBlocks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-800">
                          <ContextSelectionPanel
                            ref={selectionPanelRef}
                            contextBlocks={contextBlocks}
                            selectedContexts={prompt.selectedContexts || []}
                            selectionOrder={prompt.selectionOrder || []}
                            onSelectionChange={(selectedContexts, selectionOrder) => 
                              handleSelectionChange(prompt.id, selectedContexts, selectionOrder)
                            }
                            totalChars={totalChars}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
