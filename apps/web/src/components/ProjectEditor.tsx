import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Project, Template } from '@promptozaurus/shared';
import { useCompilePrompt } from '../hooks/useContextPrompt';
import TemplateLibraryModal from './TemplateLibraryModal';

interface ProjectEditorProps {
  project: Project;
}

export default function ProjectEditor({ project }: ProjectEditorProps) {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<'context' | 'prompts'>('context');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  
  const compileMutation = useCompilePrompt();

  const contextBlocks = project.data.contextBlocks || [];
  const promptBlocks = project.data.promptBlocks || [];

  const handleTemplateSelect = (template: Template) => {
    // Use template content in current prompt
    console.log('Selected template:', template);
    // TODO: Implement template insertion into current prompt
  };

  const handleCompilePrompt = async (promptId: number) => {
    try {
      const result = await compileMutation.mutateAsync({
        projectId: project.id,
        promptId,
        wrapWithTags: false,
      });
      
      // Copy to clipboard
      await navigator.clipboard.writeText(result.compiled);
      alert(t('messages.copiedToClipboard', 'Copied to clipboard!'));
    } catch (_error) {
      alert(t('messages.failedToCompile', 'Failed to compile prompt'));
    }
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'context' ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                {t('labels.contextBlocks', 'Context Blocks')}
              </h2>
              <button
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
                        <button className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors">
                          {t('buttons.edit', 'Edit')}
                        </button>
                        <button className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
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
                {promptBlocks.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{prompt.title}</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCompilePrompt(prompt.id)}
                          disabled={compileMutation.isPending}
                          className="px-3 py-1 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors disabled:opacity-50"
                        >
                          {compileMutation.isPending ? t('buttons.compiling', 'Compiling...') : t('buttons.compile', 'Compile')}
                        </button>
                        <button className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors">
                          {t('buttons.edit', 'Edit')}
                        </button>
                        <button className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors">
                          {t('buttons.delete', 'Delete')}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      {prompt.selectedContexts.length} {t('labels.contextsSelected', 'contexts selected')} • 
                      {prompt.template.length} {t('labels.chars', 'chars')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

