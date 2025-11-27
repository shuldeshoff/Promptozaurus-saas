import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Template } from '@promptozaurus/shared';
import {
  useTemplates,
  useTemplate,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
} from '../hooks/useTemplates';
import { useConfirmation } from '../context/ConfirmationContext';

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
  const { openConfirmation } = useConfirmation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editName, setEditName] = useState('');
  const [editContent, setEditContent] = useState('');

  const { data: allTemplates, isLoading } = useTemplates();
  const { data: selectedTemplateData } = useTemplate(selectedTemplateId || '');
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  // Фильтрация по имени (клиентская)
  const templates = searchQuery
    ? allTemplates?.filter((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTemplates;

  // Загрузка содержимого выбранного шаблона
  useEffect(() => {
    if (selectedTemplateData && !isEditing && !isCreating) {
      setEditContent(selectedTemplateData.content);
    }
  }, [selectedTemplateData, isEditing, isCreating]);

  // Загрузка содержимого для редактирования
  useEffect(() => {
    if (isEditing && selectedTemplateData) {
      setEditName(selectedTemplateData.name);
      setEditContent(selectedTemplateData.content);
    }
  }, [isEditing, selectedTemplateData]);

  const handleCreate = async () => {
    if (!editName.trim() || !editContent.trim()) {
      toast.error(t('messages.fillAllFields', 'Please fill all fields'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: editName.trim(),
        content: editContent.trim(),
      });
      setIsCreating(false);
      setEditName('');
      setEditContent('');
      toast.success(t('messages.templateCreated', 'Template created successfully'));
    } catch {
      toast.error(t('messages.failedToCreate', 'Failed to create template'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedTemplateId || !editName.trim() || !editContent.trim()) return;

    try {
      await updateMutation.mutateAsync({
        templateId: selectedTemplateId,
        name: editName.trim(),
        content: editContent.trim(),
      });
      setIsEditing(false);
      setSelectedTemplateId(null);
      toast.success(t('messages.templateUpdated', 'Template updated successfully'));
    } catch {
      toast.error(t('messages.failedToUpdate', 'Failed to update template'));
    }
  };

  const handleDelete = async (templateId: string) => {
    openConfirmation(
      t('messages.confirmDeleteTemplate', 'Delete this template?'),
      '',
      async () => {
        try {
          await deleteMutation.mutateAsync(templateId);
          if (selectedTemplateId === templateId) {
            setSelectedTemplateId(null);
          }
          toast.success(t('messages.templateDeleted', 'Template deleted'));
        } catch {
          toast.error(t('messages.failedToDelete', 'Failed to delete template'));
        }
      }
    );
  };

  const handleSelect = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
      onClose();
    } else {
      setSelectedTemplateId(template.id);
      setEditName(template.name);
    }
  };

  const startEdit = (template: Template) => {
    setSelectedTemplateId(template.id);
    setEditName(template.name);
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
    setSelectedTemplateId(null);
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
            {t('labels.templateLibrary', 'Template Library')}
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
                      selectedTemplateId === template.id
                        ? 'bg-blue-600'
                        : 'bg-gray-800 hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelect(template)}
                  >
                    <div className="font-medium text-white truncate">{template.name}</div>
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
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {t('labels.content', 'Content')}
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white resize-none"
                  />
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={isCreating ? handleCreate : handleUpdate}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
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
            ) : selectedTemplateId && selectedTemplateData ? (
              /* Template Preview */
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{selectedTemplateData.name}</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(selectedTemplateData)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      {t('buttons.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(selectedTemplateData.id)}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50"
                    >
                      {t('buttons.delete')}
                    </button>
                  </div>
                </div>
                <div className="flex-1 bg-gray-800 border border-gray-700 rounded-lg p-4 overflow-y-auto">
                  <pre className="text-gray-300 whitespace-pre-wrap">
                    {editContent || 'Loading...'}
                  </pre>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="flex-1 flex items-center justify-center text-gray-400">
                {t('messages.selectTemplateToView', 'Select a template to view')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

