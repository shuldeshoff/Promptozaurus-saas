// PromptEditor - Полный редактор промптов (1:1 из originals - 621 строка)
// originals/src/components/prompt/PromptEditor.js
import { useState, useEffect, useRef, useMemo } from 'react';
import { useEditor } from '../../context/EditorContext';
import { useTranslation } from 'react-i18next';
import { useTemplates, useTemplate } from '../../hooks/useTemplates';
import { useCompilePrompt } from '../../hooks/useProjects';
import FullscreenEditor from '../ui/FullscreenEditor';
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut';
import { useUpdateProject } from '../../hooks/useProjects';

const PromptEditor = () => {
  const { t } = useTranslation('editor');
  const {
    activePromptBlockId,
    currentProject,
  } = useEditor();
  const updateProjectMutation = useUpdateProject();

  // Get active prompt block
  const block = currentProject?.data?.promptBlocks?.find((b) => b.id === activePromptBlockId);

  const [wrapWithTags, setWrapWithTags] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyTemplateSuccess, setCopyTemplateSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Template management
  const { data: templateFiles = [], isLoading: isLoadingTemplates } = useTemplates();
  const { data: templateContent, refetch: fetchTemplateContent } = useTemplate(previewFile || '');

  // Current template filename (можно хранить в block.templateFilename, но в оригинале это расширение)
  const currentFile = (block as any)?.templateFilename || '';

  // Ref для выпадающего меню
  const menuRef = useRef<HTMLDivElement>(null);

  // Горячая клавиша Ctrl+E => полноэкранный редактор
  const [activeTextarea, setActiveTextarea] = useState<'template' | 'result' | null>(null);

  // Фильтрованный список файлов на основе поискового запроса (строки 52-58)
  const filteredTemplateFiles = useMemo(() => {
    if (!searchQuery.trim()) return templateFiles;
    return templateFiles.filter((file) =>
      file.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templateFiles, searchQuery]);

  // Компиляция промпта с контекстом (строки 60-69)
  const { data: compiledPromptData } = useCompilePrompt(
    block?.id || 0,
    wrapWithTags
  );
  const compiledPrompt = compiledPromptData?.compiledPrompt || '';

  // Обработчик клика вне меню (строки 78-94)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Закрываем меню, если клик был вне его
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setPreviewFile(null);
        setPreviewContent(null);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Синхронизация previewContent при hover (строки 135-147)
  useEffect(() => {
    if (previewFile && templateContent) {
      setPreviewContent(templateContent);
    }
  }, [previewFile, templateContent]);

  // Вызывается при выборе файла из выпадающего меню (строки 108-133)
  const handleSelectTemplate = async (filename: string) => {
    if (!filename || !currentProject || !block) return;

    try {
      // Загружаем содержимое шаблона
      const { data: content } = await fetchTemplateContent();
      if (content) {
        // Сохраняем текст и запоминаем выбранный файл
        const updatedBlocks = currentProject.data.promptBlocks.map((b) =>
          b.id === block.id
            ? { ...b, template: content, templateFilename: filename }
            : b
        );

        await updateProjectMutation.mutateAsync({
          id: currentProject.id,
          data: {
            ...currentProject.data,
            promptBlocks: updatedBlocks,
          },
        });
      }
      // Закрываем меню после выбора шаблона
      setIsMenuOpen(false);
      setPreviewFile(null);
      setPreviewContent(null);
      setSearchQuery('');
    } catch (error) {
      console.error('Error handleSelectTemplate:', error);
      setIsMenuOpen(false);
      setPreviewFile(null);
      setPreviewContent(null);
      setSearchQuery('');
    }
  };

  // Загрузка превью шаблона (строки 135-147)
  const handleShowPreview = (filename: string) => {
    if (previewFile === filename) return; // Уже загружен
    setPreviewFile(filename);
  };

  // Открыть или закрыть меню (строки 149-161)
  const toggleMenu = () => {
    if (isMenuOpen) {
      setPreviewFile(null);
      setPreviewContent(null);
      setSearchQuery('');
    }
    setIsMenuOpen(!isMenuOpen);
  };

  // Обработчик изменения template (строки 163-167)
  const handleTemplateChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!currentProject || !block) return;
    const updatedBlocks = currentProject.data.promptBlocks.map((b) =>
      b.id === block.id ? { ...b, template: e.target.value } : b
    );

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: {
        ...currentProject.data,
        promptBlocks: updatedBlocks,
      },
    });
  };

  // Обработчик изменения заголовка (строки 169-171)
  const handleTitleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentProject || !block) return;
    const updatedBlocks = currentProject.data.promptBlocks.map((b) =>
      b.id === block.id ? { ...b, title: e.target.value } : b
    );

    await updateProjectMutation.mutateAsync({
      id: currentProject.id,
      data: {
        ...currentProject.data,
        promptBlocks: updatedBlocks,
      },
    });
  };

  // Сохранить текущий шаблон .txt (строки 173-181)
  const handleSaveTemplateFile = () => {
    if (!block?.template) return;
    if (!currentFile) {
      // Если нет названия файла, предлагаем "Сохранить как"
      return handleSaveTemplateFileAs();
    }
    doSaveTemplate(currentFile);
  };

  // «Сохранить как» => спрашиваем новое имя (строки 183-202)
  const handleSaveTemplateFileAs = () => {
    if (!block?.template) return;
    // В SaaS версии используем простой prompt (позже заменим на ConfirmationModal)
    const txtName = window.prompt(
      t('editor.prompt.saveTemplate.message'),
      currentFile.replace(/\.txt$/, '') || block.title
    );
    if (txtName !== null) {
      let name = txtName || '';
      if (!name.trim()) {
        name = block.title || 'my_template';
      }
      // Превратим в файл (добавляем .txt если нет)
      const filename = name.endsWith('.txt') ? name : `${name}.txt`;
      doSaveTemplate(filename);
    }
  };

  // Фактическая запись файла (строки 204-223)
  const doSaveTemplate = async (filename: string) => {
    if (!currentProject || !block) return;
    try {
      // В SaaS версии: POST /api/templates
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename,
          content: block.template || '',
        }),
      });

      if (response.ok) {
        // Запоминаем выбранный файл
        const updatedBlocks = currentProject.data.promptBlocks.map((b) =>
          b.id === block.id ? { ...b, templateFilename: filename } : b
        );

        await updateProjectMutation.mutateAsync({
          id: currentProject.id,
          data: {
            ...currentProject.data,
            promptBlocks: updatedBlocks,
          },
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  // Копирование скомпилированного промпта (строки 239-248)
  const copyPrompt = () => {
    if (!compiledPrompt) return;
    navigator.clipboard
      .writeText(compiledPrompt)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Copy error:', err));
  };

  // Копирование только шаблона промпта без контекста (строки 250-259)
  const copyTemplate = () => {
    if (!block?.template) return;
    navigator.clipboard
      .writeText(block.template)
      .then(() => {
        setCopyTemplateSuccess(true);
        setTimeout(() => setCopyTemplateSuccess(false), 2000);
      })
      .catch((err) => console.error('Template copy error:', err));
  };

  // Полноэкранный редактор (строки 261-296)
  const [fullscreenEditor, setFullscreenEditor] = useState({
    isOpen: false,
    content: '',
    title: '',
    isTemplate: false,
  });

  const openTemplateFullscreen = () => {
    setFullscreenEditor({
      isOpen: true,
      content: block?.template || '',
      title: `${t('editor.prompt.editing.template')}: ${block?.title || ''}`,
      isTemplate: true,
    });
  };

  const openResultFullscreen = () => {
    setFullscreenEditor({
      isOpen: true,
      content: compiledPrompt,
      title: `${t('editor.prompt.editing.result')}: ${block?.title || ''}`,
      isTemplate: false,
    });
  };

  const handleCloseFullscreen = () => {
    setFullscreenEditor((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveFullscreen = async (newContent: string) => {
    if (fullscreenEditor.isTemplate && currentProject && block) {
      const updatedBlocks = currentProject.data.promptBlocks.map((b) =>
        b.id === block.id ? { ...b, template: newContent } : b
      );

      await updateProjectMutation.mutateAsync({
        id: currentProject.id,
        data: {
          ...currentProject.data,
          promptBlocks: updatedBlocks,
        },
      });
    }
    setFullscreenEditor((prev) => ({ ...prev, isOpen: false }));
  };

  // Обработчик отправки в ИИ (строки 298-315)
  const handleSendToAI = () => {
    if (!compiledPrompt || !compiledPrompt.trim()) {
      alert(t('editor.prompt.ai.noContent')); // Позже заменим на уведомление
      return;
    }

    // TODO: Открыть AIResponseModal (когда будет портирован)
    console.log('Send to AI:', compiledPrompt);
    alert('AI integration coming soon!');
  };

  // Горячая клавиша Ctrl+E (строки 317-325)
  useKeyboardShortcut(
    {
      'ctrl+e': () => {
        if (activeTextarea === 'template') {
          openTemplateFullscreen();
        } else if (activeTextarea === 'result') {
          openResultFullscreen();
        }
      },
    },
    [activeTextarea, block, compiledPrompt]
  );

  // Если блок не выбран (строки 327-335)
  if (!block) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-gray-800 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 text-gray-500 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-300 mb-2">
            {t('editor.prompt.noSelection.title')}
          </p>
          <p className="text-sm text-gray-400">
            {t('editor.prompt.noSelection.description')}
          </p>
        </div>
      </div>
    );
  }

  // Статистика символов (строки 337-339)
  const totalContextChars = compiledPromptData?.totalChars || 0;
  const totalTemplateChars = block.template ? block.template.length : 0;
  const totalPromptChars = compiledPrompt ? compiledPrompt.length : 0;

  return (
    <div className="animate-fadeIn h-full flex flex-col overflow-hidden">
      {/* Фиксированная верхняя часть с заголовком и полем ввода шаблона (строки 343-529) */}
      <div className="sticky top-0 z-10 bg-gray-900 pt-1 pb-2">
        {/* Заголовок блока (строки 345-353) */}
        <div className="mb-3 flex justify-between items-center">
          <label className="block text-sm text-gray-400">{t('editor.prompt.title')}</label>
        </div>
        <input
          type="text"
          value={block.title || ''}
          onChange={handleTitleChange}
          className="w-full mb-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />

        {/* Dropdown шаблонов и кнопки (строки 355-487) */}
        <div className="flex justify-between items-center mb-2">
          <div className="relative" ref={menuRef} style={{ zIndex: 100 }}>
            <button
              onClick={toggleMenu}
              className="px-2 py-1 bg-purple-700 text-xs text-white rounded hover:bg-purple-600"
            >
              {isLoadingTemplates
                ? t('editor.prompt.template.loading')
                : currentFile
                ? `${t('editor.prompt.template.file')}: ${currentFile}`
                : t('editor.prompt.template.select')}
            </button>
            {isMenuOpen && (
              <div
                className="absolute mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 flex"
                style={{ width: '800px', height: '500px' }}
              >
                {/* Левая панель - список файлов (строки 366-405) */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col">
                  {/* Строка поиска (строки 368-377) */}
                  <div className="p-2 border-b border-gray-700">
                    <input
                      type="text"
                      placeholder={t('editor.prompt.template.searchPlaceholder')}
                      className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* Список файлов (строки 379-404) */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredTemplateFiles.length === 0 && !isLoadingTemplates && (
                      <div className="p-2 text-sm text-gray-400 text-center">
                        {searchQuery
                          ? t('editor.prompt.template.notFound')
                          : t('editor.prompt.template.noFiles')}
                      </div>
                    )}
                    {isLoadingTemplates && (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-r-2 border-blue-500 border-b-2 border-transparent"></div>
                        <p className="mt-2 text-sm text-gray-400">
                          {t('editor.prompt.template.loadingFiles')}
                        </p>
                      </div>
                    )}
                    {filteredTemplateFiles.map((f) => (
                      <div
                        key={f}
                        className={`relative py-2 px-3 hover:bg-gray-700 cursor-pointer ${
                          f === currentFile ? 'bg-gray-700 font-medium' : ''
                        } ${f === previewFile ? 'border-l-4 border-blue-500 pl-2' : 'pl-3'}`}
                        onClick={() => handleSelectTemplate(f)}
                        onMouseEnter={() => handleShowPreview(f)}
                      >
                        <span className="text-sm text-white">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Правая панель - превью (строки 407-438) */}
                <div className="w-2/3 flex flex-col">
                  {previewFile && previewContent ? (
                    <>
                      <div className="flex justify-between items-center p-3 border-b border-gray-700">
                        <div>
                          <h3 className="text-md font-medium text-blue-400">{previewFile}</h3>
                          <p className="text-xs text-gray-400">
                            {previewContent.length} {t('editor.prompt.chars')}
                          </p>
                        </div>
                        <button
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-500"
                          onClick={() => handleSelectTemplate(previewFile)}
                        >
                          {t('editor.prompt.template.selectButton')}
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-3 bg-gray-900">
                        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                          {previewContent}
                        </pre>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 text-gray-500 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="text-gray-400 mb-2">
                        {t('editor.prompt.template.previewHint')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t('editor.prompt.template.hoverHint')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Кнопки справа (строки 443-486) */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400">
              {(block.template || '').length} {t('editor.prompt.chars')}
            </span>
            <button
              className="p-1 text-blue-400 hover:text-blue-300"
              onClick={openTemplateFullscreen}
              onFocus={() => setActiveTextarea('template')}
              title={t('editor.prompt.actions.editFullscreen')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>

            {/* Кнопки "Сохранить" / "Сохранить как" (строки 463-478) */}
            <button
              className={`px-2 py-1 text-xs ${
                saveSuccess ? 'bg-green-600' : 'bg-purple-700 hover:bg-purple-600'
              } text-white rounded`}
              onClick={handleSaveTemplateFile}
              disabled={!block.template}
            >
              {saveSuccess ? t('editor.prompt.buttons.saved') : t('editor.prompt.buttons.save')}
            </button>
            <button
              className="px-2 py-1 bg-purple-700 hover:bg-purple-600 text-xs text-white rounded"
              onClick={handleSaveTemplateFileAs}
              disabled={!block.template}
            >
              {t('editor.prompt.buttons.saveAs')}
            </button>
          </div>
        </div>

        {/* Текстовое поле для ввода шаблона - высота 40vh (строки 489-496) */}
        <textarea
          className="w-full h-[40vh] mb-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white resize-y"
          placeholder={t('editor.prompt.template.placeholder')}
          value={block.template || ''}
          onChange={handleTemplateChange}
          onFocus={() => setActiveTextarea('template')}
        />

        {/* Checkbox и статистика (строки 498-528) */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center">
            <label className="inline-flex items-center text-sm text-gray-400 mr-4">
              <input
                type="checkbox"
                className="mr-1"
                checked={wrapWithTags}
                onChange={(e) => setWrapWithTags(e.target.checked)}
              />
              {t('editor.prompt.wrapWithTags')}
            </label>
            <div className="px-3 py-1 bg-gray-800 rounded border border-gray-700 text-xs text-gray-300">
              <span className="mr-2">
                {t('editor.prompt.stats.template')}: {totalTemplateChars}
              </span>
              |
              <span className="mx-2">
                {t('editor.prompt.stats.context')}: {totalContextChars}
              </span>
              |
              <span className="ml-2">
                {t('editor.prompt.stats.total')}: {totalPromptChars}
              </span>
            </div>
          </div>
          <button
            onClick={copyTemplate}
            className={`flex items-center px-3 py-1 text-xs ${
              copyTemplateSuccess ? 'bg-green-600' : 'bg-purple-600 hover:bg-purple-500'
            } text-white rounded`}
            disabled={!block.template}
            title={t('editor.prompt.actions.copyTemplateTooltip')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2"
              />
            </svg>
            {copyTemplateSuccess
              ? t('editor.prompt.buttons.copied')
              : t('editor.prompt.buttons.copyTemplate')}
          </button>
        </div>
      </div>

      {/* Прокручиваемая нижняя часть с готовым промптом (строки 531-600) */}
      <div className="flex-1 overflow-y-auto">
        {/* Скомпилированный промпт (строки 533-586) */}
        <div className="mb-2 flex justify-between items-center">
          <div className="flex items-center">
            <label className="text-sm text-gray-400">{t('editor.prompt.readyPrompt')}</label>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openResultFullscreen}
              className="p-1 text-blue-400 hover:text-blue-300"
              onFocus={() => setActiveTextarea('result')}
              disabled={!compiledPrompt}
              title={t('editor.prompt.actions.viewFullscreen')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={copyPrompt}
              className={`flex items-center px-3 py-1 text-xs ${
                copySuccess ? 'bg-green-600' : 'bg-blue-700 hover:bg-blue-600'
              } text-white rounded`}
              disabled={!compiledPrompt}
              title={t('editor.prompt.actions.copyFullTooltip')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copySuccess
                ? t('editor.prompt.buttons.copiedFull')
                : t('editor.prompt.buttons.copyFull')}
            </button>

            {/* Кнопка отправки в ИИ (строки 573-584) */}
            <button
              onClick={handleSendToAI}
              className="flex items-center px-3 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded transition-colors"
              disabled={!compiledPrompt || !compiledPrompt.trim()}
              title={t('editor.prompt.actions.sendAITooltip')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              {t('editor.prompt.buttons.sendAI')}
            </button>
          </div>
        </div>
        <div className="w-full h-48 bg-gray-800 border border-gray-700 rounded text-white overflow-y-auto p-3">
          {compiledPrompt ? (
            <pre
              tabIndex={0}
              onFocus={() => setActiveTextarea('result')}
              className="whitespace-pre-wrap text-gray-300"
            >
              {compiledPrompt}
            </pre>
          ) : (
            <p className="text-gray-500 text-sm text-center">
              {t('editor.prompt.noReadyText')}
            </p>
          )}
        </div>
      </div>

      {/* Полноэкранный редактор (строки 602-609) */}
      <FullscreenEditor
        isOpen={fullscreenEditor.isOpen}
        onClose={handleCloseFullscreen}
        onSave={handleSaveFullscreen}
        title={fullscreenEditor.title}
        content={fullscreenEditor.content}
      />
    </div>
  );
};

export default PromptEditor;

