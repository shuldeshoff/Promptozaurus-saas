// src/components/prompt/PromptEditor.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';
import TemplateService from '../../services/TemplateService';
import { useConfirmation } from '../../context/ConfirmationContext';
import FullscreenEditor from '../ui/FullscreenEditor';
import AIResponseModal from '../ui/AIResponseModal';
import useKeyboardShortcut from '../../hooks/useKeyboardShortcut';

const PromptEditor = () => {
  const { t } = useTranslation();
  const { 
    state, 
    actions, 
    getActivePromptBlock, 
    getPromptWithContext, 
    getSelectedContextsTotalChars 
  } = useApp();
  const { openConfirmation } = useConfirmation();

  const block = getActivePromptBlock();

  const [wrapWithTags, setWrapWithTags] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyTemplateSuccess, setCopyTemplateSuccess] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [templateFiles, setTemplateFiles] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояние модального окна ИИ
  const [aiModalState, setAiModalState] = useState({
    isOpen: false,
    promptContent: '',
    promptTitle: ''
  });

  // Запомним, какой .txt мы «подгрузили» (можно хранить в block.templateFilename)
  const currentFile = block?.templateFilename || '';
  
  // Ref для выпадающего меню и превью окна
  const menuRef = useRef(null);
  const previewRef = useRef(null);

  // Горячая клавиша Ctrl+E => полноэкранный редактор
  const [activeTextarea, setActiveTextarea] = useState(null);

  // Фильтрованный список файлов на основе поискового запроса
  const filteredTemplateFiles = useMemo(() => {
    if (!searchQuery.trim()) return templateFiles;
    return templateFiles.filter(file => 
      file.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [templateFiles, searchQuery]);

  // Используем useMemo для вычисления compiledPrompt с учётом порядка блоков в state.contextBlocks
  const compiledPrompt = useMemo(() => {
    if (!block) return '';
    try {
      return getPromptWithContext(block.id, wrapWithTags) || '';
    } catch (error) {
      console.error('Error compiling prompt:', error);
      return '';
    }
  }, [block, wrapWithTags, getPromptWithContext, state.contextBlocks]);

  // При первом рендере — обновим список файлов
  useEffect(() => {
    if (!block) return;
    loadTemplatesList();
    // eslint-disable-next-line
  }, [block?.id, state.templateFolder]);
  
  // Обработчик клика вне меню
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Закрываем меню, если клик был вне его
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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

  // Загружаем список файлов .txt из папки state.templateFolder
  const loadTemplatesList = async () => {
    setIsLoading(true);
    try {
      const files = await TemplateService.getTemplatesList(true, state.templateFolder);
      setTemplateFiles(files);
    } catch (err) {
      console.error('Error loading template list:', err);
    }
    setIsLoading(false);
  };

  // Вызывается при выборе файла из выпадающего меню
  const handleSelectTemplate = async (filename) => {
    if (!filename) return;
    
    try {
      const content = await TemplateService.getTemplateContent(state.templateFolder, filename);
      if (content !== null) {
        // Сохраняем текст и запоминаем выбранный файл
        await actions.updatePromptBlock(block.id, {
          template: content,
          templateFilename: filename
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
  
  // Загрузка превью шаблона
  const handleShowPreview = async (filename) => {
    if (previewFile === filename) return; // Уже загружен
    
    setPreviewFile(filename);
    try {
      const content = await TemplateService.getTemplateContent(state.templateFolder, filename);
      setPreviewContent(content);
    } catch (error) {
      console.error('Error loading template preview:', error);
      setPreviewContent(null);
    }
  };

  // Открыть или закрыть меню
  const toggleMenu = () => {
    if (isMenuOpen) {
      setPreviewFile(null);
      setPreviewContent(null);
      setSearchQuery('');
    }
    
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      loadTemplatesList();
    }
  };

  const handleTemplateChange = async (e) => {
    await actions.updatePromptBlock(block.id, {
      template: e.target.value
    });
  };

  const handleTitleChange = (e) => {
    actions.updatePromptBlock(block.id, { title: e.target.value });
  };

  // Сохранить текущий шаблон .txt (перезаписать) с именем currentFile
  const handleSaveTemplateFile = () => {
    if (!block.template) return;
    if (!currentFile) {
      // Если нет названия файла, предлагаем "Сохранить как"
      return handleSaveTemplateFileAs();
    }
    doSaveTemplate(currentFile);
  };

  // «Сохранить как» => спрашиваем новое имя
  const handleSaveTemplateFileAs = () => {
    if (!block.template) return;
    openConfirmation(
      t('editor.prompt.saveTemplate.title'),
      t('editor.prompt.saveTemplate.message'),
      async (txtName) => {
        let name = txtName || '';
        if (!name.trim()) {
          name = block.title || 'my_template';
        }
        // Превратим в файл
        const filename = TemplateService.titleToFilename(name);
        doSaveTemplate(filename);
      },
      t('editor.prompt.buttons.save'),
      true,
      currentFile.replace(/\.txt$/, '') || block.title
    );
  };

  // Фактическая запись файла
  const doSaveTemplate = async (filename) => {
    try {
      const success = await TemplateService.saveTemplate(
        state.templateFolder,
        filename,
        block.template || ''
      );
      if (success) {
        // Запоминаем выбранный файл
        await actions.updatePromptBlock(block.id, {
          templateFilename: filename
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Error saving template:', err);
    }
  };

  // Кнопка «Выбрать папку шаблонов»
  const handleChooseTemplatesFolder = async () => {
    try {
      const folder = await window.electronAPI.selectDirectory();
      if (folder) {
        actions.setTemplateFolder(folder);
        // Перезагрузим список файлов
        setTimeout(() => loadTemplatesList(), 500);
      }
    } catch (error) {
      console.error('Error selecting template folder:', error);
    }
  };

  // Копирование скомпилированного промпта
  const copyPrompt = () => {
    if (!compiledPrompt) return;
    navigator.clipboard.writeText(compiledPrompt)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(err => console.error('Copy error:', err));
  };

  // Копирование только шаблона промпта без контекста
  const copyTemplate = () => {
    if (!block?.template) return;
    navigator.clipboard.writeText(block.template)
      .then(() => {
        setCopyTemplateSuccess(true);
        setTimeout(() => setCopyTemplateSuccess(false), 2000);
      })
      .catch(err => console.error('Template copy error:', err));
  };

  // Полноэкранный редактор
  const [fullscreenEditor, setFullscreenEditor] = useState({
    isOpen: false,
    content: '',
    title: '',
    isTemplate: false
  });

  const openTemplateFullscreen = () => {
    setFullscreenEditor({
      isOpen: true,
      content: block?.template || '',
      title: `${t('editor.prompt.editing.template')}: ${block?.title || ''}`,
      isTemplate: true
    });
  };

  const openResultFullscreen = () => {
    setFullscreenEditor({
      isOpen: true,
      content: compiledPrompt,
      title: `${t('editor.prompt.editing.result')}: ${block?.title || ''}`,
      isTemplate: false
    });
  };

  const handleCloseFullscreen = () => {
    setFullscreenEditor(prev => ({ ...prev, isOpen: false }));
  };

  const handleSaveFullscreen = (newContent) => {
    if (fullscreenEditor.isTemplate) {
      actions.updatePromptBlock(block.id, { template: newContent });
    }
    setFullscreenEditor(prev => ({ ...prev, isOpen: false }));
  };

  // Обработчик отправки в ИИ
  const handleSendToAI = () => {
    if (!compiledPrompt || !compiledPrompt.trim()) {
      actions.showNotification(t('editor.prompt.ai.noContent'), 'warning');
      return;
    }

    setAiModalState({
      isOpen: true,
      promptContent: compiledPrompt,
      promptTitle: block?.title || t('editor.prompt.ai.untitled')
    });
  };

  // Закрытие модального окна ИИ
  const handleCloseAIModal = () => {
    setAiModalState(prev => ({ ...prev, isOpen: false }));
  };

  useKeyboardShortcut({
    'ctrl+e': () => {
      if (activeTextarea === 'template') {
        openTemplateFullscreen();
      } else if (activeTextarea === 'result') {
        openResultFullscreen();
      }
    }
  }, [activeTextarea, block, compiledPrompt]);

  if (!block) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-gray-800 rounded-lg">
          <p className="text-gray-400">{t('editor.prompt.noSelection.title')}</p>
        </div>
      </div>
    );
  }

  const totalContextChars = getSelectedContextsTotalChars(block.id);
  const totalTemplateChars = block.template ? block.template.length : 0;
  const totalPromptChars = compiledPrompt ? compiledPrompt.length : 0;

  return (
    <div className="animate-fadeIn h-full flex flex-col overflow-hidden">
      {/* Фиксированная верхняя часть с заголовком и полем ввода шаблона */}
      <div className="sticky top-0 z-10 bg-gray-900 pt-1 pb-2">
        <div className="mb-3 flex justify-between items-center">
          <label className="block text-sm text-gray-400">{t('editor.prompt.title')}</label>
        </div>
        <input
          type="text"
          value={block.title || ''}
          onChange={handleTitleChange}
          className="w-full mb-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
        />

        <div className="flex justify-between items-center mb-2">
          <div className="relative" ref={menuRef} style={{ zIndex: 100 }}>
            <button
              onClick={toggleMenu}
              className="px-2 py-1 bg-purple-700 text-xs text-white rounded hover:bg-purple-600"
            >
              {isLoading ? t('editor.prompt.template.loading') : currentFile ? `${t('editor.prompt.template.file')}: ${currentFile}` : t('editor.prompt.template.select')}
            </button>
            {isMenuOpen && (
              <div className="absolute mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 flex" 
                   style={{ width: '800px', height: '500px' }}>
                {/* Левая панель - список файлов */}
                <div className="w-1/3 border-r border-gray-700 flex flex-col">
                  {/* Строка поиска */}
                  <div className="p-2 border-b border-gray-700">
                    <input
                      type="text"
                      placeholder={t('editor.prompt.template.searchPlaceholder')}
                      className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {/* Список файлов */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredTemplateFiles.length === 0 && !isLoading && (
                      <div className="p-2 text-sm text-gray-400 text-center">
                        {searchQuery ? t('editor.prompt.template.notFound') : t('editor.prompt.template.noFiles')}
                      </div>
                    )}
                    {isLoading && (
                      <div className="p-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500 border-r-2 border-blue-500 border-b-2 border-transparent"></div>
                        <p className="mt-2 text-sm text-gray-400">{t('editor.prompt.template.loadingFiles')}</p>
                      </div>
                    )}
                    {filteredTemplateFiles.map(f => (
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
                
                {/* Правая панель - превью */}
                <div className="w-2/3 flex flex-col">
                  {previewFile && previewContent ? (
                    <>
                      <div className="flex justify-between items-center p-3 border-b border-gray-700">
                        <div>
                          <h3 className="text-md font-medium text-blue-400">{previewFile}</h3>
                          <p className="text-xs text-gray-400">{previewContent.length} {t('editor.prompt.chars')}</p>
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
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-400 mb-2">{t('editor.prompt.template.previewHint')}</p>
                      <p className="text-sm text-gray-500">{t('editor.prompt.template.hoverHint')}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400">{(block.template || '').length} {t('editor.prompt.chars')}</span>
            <button
              className="p-1 text-blue-400 hover:text-blue-300"
              onClick={openTemplateFullscreen}
              onFocus={() => setActiveTextarea('template')}
              title={t('editor.prompt.actions.editFullscreen')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"
                   fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036
                         a2.5 2.5 0 113.536 3.536
                         L6.5 21.036H3v-3.572
                         L16.732 3.732z" />
              </svg>
            </button>

            {/* Кнопки "Сохранить" / "Сохранить как" и "Выбрать папку шаблонов" */}
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
            <button
              className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-600 text-xs"
              onClick={handleChooseTemplatesFolder}
              title={t('editor.prompt.buttons.selectFolderTooltip')}
            >
              {t('editor.prompt.buttons.selectFolder')}
            </button>
          </div>
        </div>

        {/* Текстовое поле для ввода шаблона - высота 40vh (40% высоты окна) */}
        <textarea
          className="w-full h-[40vh] mb-3 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white resize-y"
          placeholder={t('editor.prompt.template.placeholder')}
          value={block.template || ''}
          onChange={handleTemplateChange}
          onFocus={() => setActiveTextarea('template')}
        />

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
              <span className="mr-2">{t('editor.prompt.stats.template')}: {totalTemplateChars}</span>|
              <span className="mx-2">{t('editor.prompt.stats.context')}: {totalContextChars}</span>|
              <span className="ml-2">{t('editor.prompt.stats.total')}: {totalPromptChars}</span>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2" />
            </svg>
            {copyTemplateSuccess ? t('editor.prompt.buttons.copied') : t('editor.prompt.buttons.copyTemplate')}
          </button>
        </div>
      </div>

      {/* Прокручиваемая нижняя часть с готовым промптом */}
      <div className="flex-1 overflow-y-auto">
        {/* Скомпилированный промпт */}
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4"
                   fill="none" viewBox="0 0 24 24"
                   stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536
                         m-2.036-5.036
                         a2.5 2.5 0
                         113.536 3.536
                         L6.5 21.036H3
                         v-3.572L16.732
                         3.732z" />
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copySuccess ? t('editor.prompt.buttons.copiedFull') : t('editor.prompt.buttons.copyFull')}
            </button>
            
            {/* Кнопка отправки в ИИ */}
            <button
              onClick={handleSendToAI}
              className="flex items-center px-3 py-1 text-xs bg-purple-700 hover:bg-purple-600 text-white rounded transition-colors"
              disabled={!compiledPrompt || !compiledPrompt.trim()}
              title={t('editor.prompt.actions.sendAITooltip')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t('editor.prompt.buttons.sendAI')}
            </button>
          </div>
        </div>
        <div className="w-full h-48 bg-gray-800 border border-gray-700 rounded text-white overflow-y-auto p-3">
          {compiledPrompt ? (
            <pre
              tabIndex="0"
              onFocus={() => setActiveTextarea('result')}
              className="whitespace-pre-wrap text-gray-300"
            >
              {compiledPrompt}
            </pre>
          ) : (
            <p className="text-gray-500 text-sm text-center">{t('editor.prompt.noReadyText')}</p>
          )}
        </div>
      </div>

      {/* Полноэкранный редактор */}
      <FullscreenEditor
        isOpen={fullscreenEditor.isOpen}
        onClose={handleCloseFullscreen}
        onSave={handleSaveFullscreen}
        title={fullscreenEditor.title}
        content={fullscreenEditor.content}
      />

      {/* Модальное окно ИИ */}
      <AIResponseModal
        isOpen={aiModalState.isOpen}
        onClose={handleCloseAIModal}
        promptContent={aiModalState.promptContent}
        promptTitle={aiModalState.promptTitle}
      />
    </div>
  );
};

export default PromptEditor;