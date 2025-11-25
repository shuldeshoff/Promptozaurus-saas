import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useTemplates,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useSearchTemplates,
} from '../hooks/useTemplates';
import { Template } from '@promptozaurus/shared';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate?: (template: Template) => void;
}

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateLibraryModalProps) {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: allTemplates, isLoading } = useTemplates();
  const { data: searchResults } = useSearchTemplates(searchQuery);
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const templates = searchQuery ? searchResults : allTemplates;

  const handleCreate = async () => {
    if (!editName.trim() || !editContent.trim()) {
      alert(t('messages.fillAllFields', 'Please fill all fields'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: editName,
        content: editContent,
      });
      setIsCreating(false);
      setEditName('');
      setEditContent('');
    } catch {
      alert(t('messages.failedToCreate', 'Failed to create template'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplate || !editName.trim() || !editContent.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: selectedTemplate.id,
        name: editName,
        content: editContent,
      });
      setIsEditing(false);
      setSelectedTemplate(null);
    } catch {
      alert(t('messages.failedToUpdate', 'Failed to update template'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('messages.confirmDeleteTemplate', 'Delete this template?'))) return;

    try {
      await deleteMutation.mutateAsync(id);
      if (selectedTemplate?.id === id) {
        setSelectedTemplate(null);
      }
    } catch {
      alert(t('messages.failedToDelete', 'Failed to delete template'));
    }
  };

  const handleSelect = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      onClose();
    } else {
      setSelectedTemplate(template);
      setEditName(template.name);
      setEditContent(template.content);
    }
  };

  const startEdit = (template: Template) => {
    setSelectedTemplate(template);
    setEditName(template.name);
    setEditContent(template.content);
    setIsEditing(true);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditName('');
    setEditContent('');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplate(null);
    setEditName('');
    setEditContent('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl h-[80vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">
            📚 {t('labels.templateLibrary', 'Template Library')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Template List */}
          <div className="w-1/3 border-r border-gray-800 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-800">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('labels.searchTemplates', 'Search templates...')}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Create Button */}
            <div className="p-4 border-b border-gray-800">
              <button
                onClick={startCreate}
                className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                + {t('buttons.createTemplate', 'Create Template')}
              </button>
            </div>

            {/* Template List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {isLoading ? (
                <div className="text-center text-gray-400">{t('messages.loading')}</div>
              ) : !templates || templates.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  {searchQuery
                    ? t('messages.noSearchResults', 'No templates found')
                    : t('messages.noTemplates', 'No templates yet')}
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-blue-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelect(template)}
                  >
                    <div className="font-medium text-white truncate">{template.name}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {template.content.substring(0, 50)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Template Preview/Edit */}
          <div className="flex-1 flex flex-col">
            {isCreating || isEditing ? (
              /* Edit/Create Form */
              <div className="flex-1 flex flex-col p-4">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('labels.templateName', 'Template Name')}
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder={t('labels.enterName', 'Enter name...')}
                  />
                </div>

                <div className="flex-1 flex flex-col mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('labels.content', 'Content')}
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono text-sm resize-none"
                    placeholder={t('labels.enterContent', 'Enter template content...')}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={isCreating ? handleCreate : handleUpdate}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isCreating ? t('buttons.create') : t('buttons.save')}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('buttons.cancel')}
                  </button>
                </div>
              </div>
            ) : selectedTemplate ? (
              /* Preview */
              <div className="flex-1 flex flex-col p-4">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-white">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-400">
                    {new Date(selectedTemplate.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto mb-4">
                  <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono p-4 bg-gray-800 rounded-lg">
                    {selectedTemplate.content}
                  </pre>
                </div>

                <div className="flex gap-2">
                  {onSelectTemplate && (
                    <button
                      onClick={() => handleSelect(selectedTemplate)}
                      className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      {t('buttons.useTemplate', 'Use Template')}
                    </button>
                  )}
                  <button
                    onClick={() => startEdit(selectedTemplate)}
                    className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {t('buttons.edit')}
                  </button>
                  <button
                    onClick={() => handleDelete(selectedTemplate.id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {t('buttons.delete')}
                  </button>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <p>{t('messages.selectTemplate', 'Select a template or create a new one')}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

