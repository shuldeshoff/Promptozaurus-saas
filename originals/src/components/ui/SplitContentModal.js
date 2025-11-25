// src/components/ui/SplitContentModal.js
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import SplitPreviewList from './SplitPreviewList';

// Алгоритмы разделения контента
const splitIntoEqualParts = (text, partsCount, endingType) => {
  if (!text || partsCount < 2) return [text];
  
  // Определяем примерный размер каждой части
  const avgPartSize = Math.ceil(text.length / partsCount);
  const parts = [];
  
  let startPos = 0;
  
  for (let i = 0; i < partsCount - 1; i++) {
    let endPos = startPos + avgPartSize;
    
    // Корректируем позицию конца в зависимости от выбранного типа завершения
    if (endingType === 'sentence') {
      // Ищем ближайший конец предложения
      const nextPeriod = text.indexOf('.', endPos);
      const nextExclamation = text.indexOf('!', endPos);
      const nextQuestion = text.indexOf('?', endPos);
      
      const possibleEndings = [nextPeriod, nextExclamation, nextQuestion]
        .filter(pos => pos !== -1);
      
      if (possibleEndings.length > 0) {
        endPos = Math.min(...possibleEndings) + 1;
      }
    } else if (endingType === 'paragraph') {
      // Ищем ближайший конец абзаца
      const nextParagraph = text.indexOf('\n\n', endPos);
      if (nextParagraph !== -1) {
        endPos = nextParagraph + 2;
      } else {
        const nextLineBreak = text.indexOf('\n', endPos);
        if (nextLineBreak !== -1) {
          endPos = nextLineBreak + 1;
        }
      }
    } else if (endingType === 'delimiter') {
      // Ищем ближайший разделитель
      const delimiter = document.getElementById('custom-delimiter').value || 'Chapter';
      const delimiterRegex = new RegExp(`(${delimiter}\\s*\\d*|${delimiter})`, 'i');
      const textAfterPos = text.substring(endPos);
      const match = textAfterPos.match(delimiterRegex);
      
      if (match && match.index !== -1) {
        endPos = endPos + match.index;
      }
    }
    // Для 'exact' не нужно корректировать позицию
    
    parts.push(text.substring(startPos, endPos));
    startPos = endPos;
  }
  
  // Добавляем последнюю часть
  parts.push(text.substring(startPos));
  
  return parts;
};

const splitByDelimiter = (text, delimiter, caseSensitive, includeDelimiter) => {
  if (!text || !delimiter) return [text];
  
  // Создаем регулярное выражение для разделения
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(delimiter, flags);
  
  if (includeDelimiter) {
    // Сохраняем разделитель в начале каждой части (кроме первой)
    const parts = [];
    let lastIndex = 0;
    let match;
    
    const plainText = text;
    const regexObj = new RegExp(delimiter, flags);
    
    while ((match = regexObj.exec(plainText)) !== null) {
      parts.push(plainText.substring(lastIndex, match.index));
      lastIndex = match.index + match[0].length;
    }
    
    // Добавляем последнюю часть
    if (lastIndex < plainText.length) {
      parts.push(plainText.substring(lastIndex));
    }
    
    return parts.filter(part => part.length > 0);
  } else {
    // Просто разделяем текст
    return text.split(regex).filter(part => part.length > 0);
  }
};

const splitByParagraphs = (text, paragraphsPerGroup, minParagraphSize) => {
  if (!text) return [text];
  
  // Разделяем текст на абзацы
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Фильтруем слишком маленькие абзацы
  const filteredParagraphs = paragraphs
    .filter(p => p.trim().length >= minParagraphSize);
  
  if (paragraphsPerGroup <= 1 || filteredParagraphs.length <= 1) {
    return filteredParagraphs.length > 0 ? filteredParagraphs : [text];
  }
  
  // Группируем абзацы
  const groups = [];
  for (let i = 0; i < filteredParagraphs.length; i += paragraphsPerGroup) {
    const group = filteredParagraphs
      .slice(i, i + paragraphsPerGroup)
      .join('\n\n');
    groups.push(group);
  }
  
  return groups;
};

const splitByPattern = (text, pattern, includeMatch) => {
  if (!text || !pattern) return [text];
  
  try {
    const regex = new RegExp(pattern, 'gm');
    const matches = [];
    let match;
    
    // Находим все совпадения
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        text: match[0]
      });
    }
    
    if (matches.length === 0) return [text];
    
    // Формируем части на основе найденных совпадений
    const parts = [];
    let lastIndex = 0;
    
    for (let i = 0; i < matches.length; i++) {
      const currentMatch = matches[i];
      
      // Добавляем текст до текущего совпадения
      if (currentMatch.index > lastIndex) {
        parts.push(text.substring(lastIndex, currentMatch.index));
      }
      
      // Определяем начало следующей части
      lastIndex = currentMatch.index;
      if (!includeMatch) {
        lastIndex += currentMatch.length;
      }
      
      // Если это не последнее совпадение, определяем конец текущей части
      if (i < matches.length - 1) {
        const endIndex = matches[i + 1].index;
        parts.push(text.substring(lastIndex, endIndex));
        lastIndex = endIndex;
      }
    }
    
    // Добавляем последнюю часть
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.filter(part => part.trim().length > 0);
  } catch (error) {
    console.error('Regular expression error:', error);
    return [text]; // В случае ошибки возвращаем исходный текст
  }
};

const SplitContentModal = ({ isOpen, onClose, onApply, content = '', title = '' }) => {
  const { t } = useTranslation();
  // Состояние для метода разделения и настроек
  const [splitMethod, setSplitMethod] = useState('equal');
  const [settings, setSettings] = useState({
    // Для разделения на равные части
    partsCount: 2,
    endingType: 'sentence',
    customDelimiter: 'Chapter', // Custom delimiter field
    
    // Для разделения по разделителю
    delimiter: '---',
    caseSensitive: false,
    includeDelimiter: false,
    
    // Для разделения по абзацам
    paragraphsPerGroup: 1,
    minParagraphSize: 50,
    
    // Для разделения по шаблону
    pattern: '(Chapter|Part|Section)\\s*(\\d+|[IVXLCDM]+)',
    includeMatch: true,
    
    // Новые опции
    createSubItems: false, // Создавать подэлементы вместо элементов
    keepOriginal: true,    // Сохранять исходный текст
  });
  
  // Состояние для предпросмотра результатов
  const [previewMode, setPreviewMode] = useState(false);
  const [splitParts, setSplitParts] = useState([]);
  const [selectedParts, setSelectedParts] = useState([]);
  
  // Сброс состояния при открытии/закрытии модального окна
  useEffect(() => {
    if (isOpen) {
      setPreviewMode(false);
      setSplitParts([]);
      setSelectedParts([]);
    }
  }, [isOpen]);
  
  // Обработчик изменения метода разделения
  const handleMethodChange = (e) => {
    setSplitMethod(e.target.value);
  };
  
  // Обработчик изменения настроек
  const handleSettingChange = (settingName, value) => {
    setSettings(prev => ({
      ...prev,
      [settingName]: value
    }));
  };
  
  // Обработчик для предпросмотра результатов
  const handlePreview = () => {
    const parts = splitContent();
    
    if (parts.length <= 1) {
      alert(t('splitModal.errors.splitFailed'));
      return;
    }
    
    setSplitParts(parts);
    setSelectedParts(Array(parts.length).fill(true)); // По умолчанию выбираем все части
    setPreviewMode(true);
  };
  
  // Функция для разделения контента на основе выбранного метода и настроек
  const splitContent = () => {
    if (!content) return [];
    
    switch (splitMethod) {
      case 'equal':
        return splitIntoEqualParts(
          content, 
          settings.partsCount, 
          settings.endingType
        );
      case 'delimiter':
        return splitByDelimiter(
          content, 
          settings.delimiter, 
          settings.caseSensitive, 
          settings.includeDelimiter
        );
      case 'paragraphs':
        return splitByParagraphs(
          content, 
          settings.paragraphsPerGroup, 
          settings.minParagraphSize
        );
      case 'pattern':
        return splitByPattern(
          content, 
          settings.pattern, 
          settings.includeMatch
        );
      default:
        return [content];
    }
  };
  
  // Обработчик для применения результатов разделения
  const handleApply = () => {
    // Если в режиме предпросмотра, применяем только выбранные части
    if (previewMode && splitParts.length > 0) {
      const selectedContent = splitParts
        .filter((_, index) => selectedParts[index]);
      
      if (selectedContent.length === 0) {
        alert(t('splitModal.errors.noSelection'));
        return;
      }
      
      onApply(selectedContent, settings.createSubItems, settings.keepOriginal);
    } else {
      // Если нет предпросмотра, применяем результаты разделения напрямую
      const parts = splitContent();
      
      if (parts.length <= 1) {
        alert(t('splitModal.errors.splitFailed'));
        return;
      }
      
      onApply(parts, settings.createSubItems, settings.keepOriginal);
    }
    
    onClose();
  };
  
  // Обработчик для изменения выбора частей в предпросмотре
  const handleTogglePart = (index) => {
    setSelectedParts(prev => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };
  
  // Обработчик для выбора/отмены выбора всех частей
  const handleToggleAll = (selectAll) => {
    setSelectedParts(Array(splitParts.length).fill(selectAll));
  };
  
  // Функция для определения количества выбранных частей
  const getSelectedCount = () => {
    return selectedParts.filter(Boolean).length;
  };
  
  // Рендер формы настроек разделения
  const renderSettingsForm = () => {
    return (
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.methodLabel')}</label>
          <select
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
            value={splitMethod}
            onChange={handleMethodChange}
          >
            <option value="equal">{t('splitModal.settings.methods.equal')}</option>
            <option value="delimiter">{t('splitModal.settings.methods.delimiter')}</option>
            <option value="paragraphs">{t('splitModal.settings.methods.paragraphs')}</option>
            <option value="pattern">{t('splitModal.settings.methods.pattern')}</option>
          </select>
        </div>
        
        {splitMethod === 'equal' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.equalParts.partsCount')}</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                min="2"
                max="100"
                value={settings.partsCount}
                onChange={(e) => handleSettingChange('partsCount', parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.equalParts.endingOn')}</label>
              <div className="space-y-1">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={settings.endingType === 'sentence'}
                    onChange={() => handleSettingChange('endingType', 'sentence')}
                  />
                  <span>{t('splitModal.settings.equalParts.endingSentence')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={settings.endingType === 'paragraph'}
                    onChange={() => handleSettingChange('endingType', 'paragraph')}
                  />
                  <span>{t('splitModal.settings.equalParts.endingParagraph')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={settings.endingType === 'exact'}
                    onChange={() => handleSettingChange('endingType', 'exact')}
                  />
                  <span>{t('splitModal.settings.equalParts.endingExact')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={settings.endingType === 'delimiter'}
                    onChange={() => handleSettingChange('endingType', 'delimiter')}
                  />
                  <span>{t('splitModal.settings.equalParts.endingDelimiter')}</span>
                </label>
                {settings.endingType === 'delimiter' && (
                  <div className="mt-2 pl-5">
                    <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.equalParts.delimiterLabel')}</label>
                    <input
                      id="custom-delimiter"
                      type="text"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                      value={settings.customDelimiter}
                      onChange={(e) => handleSettingChange('customDelimiter', e.target.value)}
                      placeholder={t('splitModal.settings.equalParts.delimiterPlaceholder')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {splitMethod === 'delimiter' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.delimiter.delimiterLabel')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={settings.delimiter}
                onChange={(e) => handleSettingChange('delimiter', e.target.value)}
                placeholder={t('splitModal.settings.delimiter.delimiterPlaceholder')}
              />
            </div>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.caseSensitive}
                  onChange={(e) => handleSettingChange('caseSensitive', e.target.checked)}
                />
                <span>{t('splitModal.settings.delimiter.caseSensitive')}</span>
              </label>
            </div>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.includeDelimiter}
                  onChange={(e) => handleSettingChange('includeDelimiter', e.target.checked)}
                />
                <span>{t('splitModal.settings.delimiter.includeDelimiter')}</span>
              </label>
            </div>
          </div>
        )}
        
        {splitMethod === 'paragraphs' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.paragraphs.paragraphsPerGroup')}</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                min="1"
                max="50"
                value={settings.paragraphsPerGroup}
                onChange={(e) => handleSettingChange('paragraphsPerGroup', parseInt(e.target.value, 10))}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.paragraphs.minSize')}</label>
              <input
                type="number"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                min="1"
                value={settings.minParagraphSize}
                onChange={(e) => handleSettingChange('minParagraphSize', parseInt(e.target.value, 10))}
              />
            </div>
          </div>
        )}
        
        {splitMethod === 'pattern' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.pattern.presetLabel')}</label>
              <select
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                onChange={(e) => handleSettingChange('pattern', e.target.value)}
              >
                <option value="">{t('splitModal.settings.pattern.selectTemplate')}</option>
                <option value="(Chapter|Part|Section)\s*(\d+|[IVXLCDM]+)">{t('splitModal.settings.pattern.chaptersAndSections')}</option>
                <option value="^\s*\d+\.\s*">{t('splitModal.settings.pattern.numberedItems')}</option>
                <option value="\d{1,2}[\./-]\d{1,2}([\./-]\d{2,4})?">{t('splitModal.settings.pattern.datesTimestamps')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('splitModal.settings.pattern.patternLabel')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={settings.pattern}
                onChange={(e) => handleSettingChange('pattern', e.target.value)}
                placeholder={t('splitModal.settings.pattern.patternPlaceholder')}
              />
            </div>
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.includeMatch}
                  onChange={(e) => handleSettingChange('includeMatch', e.target.checked)}
                />
                <span>{t('splitModal.settings.pattern.includeMatch')}</span>
              </label>
            </div>
          </div>
        )}
        
        {/* Новые опции */}
        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="space-y-2">
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.createSubItems}
                  onChange={(e) => handleSettingChange('createSubItems', e.target.checked)}
                />
                <span>{t('splitModal.settings.options.createSubItems')}</span>
              </label>
              <p className="text-xs text-gray-400 ml-6">{t('splitModal.settings.options.createSubItemsHint')}</p>
            </div>
            
            <div>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={settings.keepOriginal}
                  onChange={(e) => handleSettingChange('keepOriginal', e.target.checked)}
                />
                <span>{t('splitModal.settings.options.keepOriginal')}</span>
              </label>
              <p className="text-xs text-gray-400 ml-6">{t('splitModal.settings.options.keepOriginalHint')}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4">
          <button
            className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
            onClick={handlePreview}
          >
            {t('splitModal.previewButton')}
          </button>
        </div>
      </div>
    );
  };
  
  // Содержимое модального окна
  const modalContent = (
    <div>
      <p className="text-gray-300 mb-2">
        {previewMode 
          ? `${t('splitModal.previewSection.resultsTitle')} "${title}"`
          : `${t('splitModal.previewSection.settingsTitle')} "${title}"`
        }
      </p>
      
      {previewMode ? (
        <div className="mt-2">
          <SplitPreviewList
            parts={splitParts}
            selected={selectedParts}
            onTogglePart={handleTogglePart}
            onToggleAll={handleToggleAll}
          />
          <div className="mt-2 text-right text-sm text-gray-400">
            {t('splitModal.previewSection.selected')}: {getSelectedCount()} {t('splitModal.previewSection.of')} {splitParts.length}
          </div>
          <div className="flex justify-between mt-4">
            <button
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              onClick={() => setPreviewMode(false)}
            >
              {t('splitModal.previewSection.backToSettings')}
            </button>
            <button
              className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600"
              onClick={handleApply}
              disabled={getSelectedCount() === 0}
            >
              {t('splitModal.apply')}
            </button>
          </div>
        </div>
      ) : (
        renderSettingsForm()
      )}
    </div>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('splitModal.title')}
      primaryButtonText={previewMode ? t('splitModal.apply') : t('splitModal.previewButton')}
      onPrimaryButtonClick={previewMode ? handleApply : handlePreview}
      secondaryButtonText={t('splitModal.cancel')}
    >
      {modalContent}
    </Modal>
  );
};

export default SplitContentModal;