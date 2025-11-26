import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import SplitPreviewList from './SplitPreviewList';
import { splitIntoEqualParts, splitByDelimiter, splitByParagraphs, splitByPattern } from '../../utils/splitAlgorithms';

interface SplitContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (contentParts: string[], createSubItems: boolean, keepOriginal: boolean) => void;
  content?: string;
  title?: string;
}

interface SplitSettings {
  partsCount: number;
  endingType: string;
  customDelimiter: string;
  delimiter: string;
  caseSensitive: boolean;
  includeDelimiter: boolean;
  paragraphsPerGroup: number;
  minParagraphSize: number;
  pattern: string;
  includeMatch: boolean;
  createSubItems: boolean;
  keepOriginal: boolean;
}

const SplitContentModal = ({ isOpen, onClose, onApply, content = '', title = '' }: SplitContentModalProps) => {
  const { t } = useTranslation('splitModal');

  const [splitMethod, setSplitMethod] = useState('equal');
  const [settings, setSettings] = useState<SplitSettings>({
    partsCount: 2,
    endingType: 'sentence',
    customDelimiter: 'Chapter',
    delimiter: '---',
    caseSensitive: false,
    includeDelimiter: false,
    paragraphsPerGroup: 1,
    minParagraphSize: 50,
    pattern: '(Chapter|Part|Section)\\s*(\\d+|[IVXLCDM]+)',
    includeMatch: true,
    createSubItems: false,
    keepOriginal: true,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [splitParts, setSplitParts] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<boolean[]>([]);

  useEffect(() => {
    if (isOpen) {
      setPreviewMode(false);
      setSplitParts([]);
      setSelectedParts([]);
    }
  }, [isOpen]);

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSplitMethod(e.target.value);
  };

  const handleSettingChange = <K extends keyof SplitSettings>(settingName: K, value: SplitSettings[K]) => {
    setSettings((prev) => ({
      ...prev,
      [settingName]: value,
    }));
  };

  const splitContent = (): string[] => {
    if (!content) return [];

    switch (splitMethod) {
      case 'equal':
        return splitIntoEqualParts(content, settings.partsCount, settings.endingType, settings.customDelimiter);
      case 'delimiter':
        return splitByDelimiter(content, settings.delimiter, settings.caseSensitive, settings.includeDelimiter);
      case 'paragraphs':
        return splitByParagraphs(content, settings.paragraphsPerGroup, settings.minParagraphSize);
      case 'pattern':
        return splitByPattern(content, settings.pattern, settings.includeMatch);
      default:
        return [content];
    }
  };

  const handlePreview = () => {
    const parts = splitContent();

    if (parts.length <= 1) {
      alert(t('errors.splitFailed'));
      return;
    }

    setSplitParts(parts);
    setSelectedParts(Array(parts.length).fill(true));
    setPreviewMode(true);
  };

  const handleApply = () => {
    if (previewMode && splitParts.length > 0) {
      const selectedContent = splitParts.filter((_, index) => selectedParts[index]);

      if (selectedContent.length === 0) {
        alert(t('errors.noSelection'));
        return;
      }

      onApply(selectedContent, settings.createSubItems, settings.keepOriginal);
    } else {
      const parts = splitContent();

      if (parts.length <= 1) {
        alert(t('errors.splitFailed'));
        return;
      }

      onApply(parts, settings.createSubItems, settings.keepOriginal);
    }

    onClose();
  };

  const handleTogglePart = (index: number) => {
    setSelectedParts((prev) => {
      const updated = [...prev];
      updated[index] = !updated[index];
      return updated;
    });
  };

  const handleToggleAll = (selectAll: boolean) => {
    setSelectedParts(Array(splitParts.length).fill(selectAll));
  };

  const getSelectedCount = () => {
    return selectedParts.filter(Boolean).length;
  };

  const renderSettingsForm = () => {
    return (
      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">{t('settings.methodLabel')}</label>
          <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" value={splitMethod} onChange={handleMethodChange}>
            <option value="equal">{t('settings.methods.equal')}</option>
            <option value="delimiter">{t('settings.methods.delimiter')}</option>
            <option value="paragraphs">{t('settings.methods.paragraphs')}</option>
            <option value="pattern">{t('settings.methods.pattern')}</option>
          </select>
        </div>

        {splitMethod === 'equal' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('settings.equalParts.partsCount')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('settings.equalParts.endingOn')}</label>
              <div className="space-y-1">
                <label className="inline-flex items-center">
                  <input type="radio" className="mr-2" checked={settings.endingType === 'sentence'} onChange={() => handleSettingChange('endingType', 'sentence')} />
                  <span>{t('settings.equalParts.endingSentence')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input type="radio" className="mr-2" checked={settings.endingType === 'paragraph'} onChange={() => handleSettingChange('endingType', 'paragraph')} />
                  <span>{t('settings.equalParts.endingParagraph')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input type="radio" className="mr-2" checked={settings.endingType === 'exact'} onChange={() => handleSettingChange('endingType', 'exact')} />
                  <span>{t('settings.equalParts.endingExact')}</span>
                </label>
                <br />
                <label className="inline-flex items-center">
                  <input type="radio" className="mr-2" checked={settings.endingType === 'delimiter'} onChange={() => handleSettingChange('endingType', 'delimiter')} />
                  <span>{t('settings.equalParts.endingDelimiter')}</span>
                </label>
                {settings.endingType === 'delimiter' && (
                  <div className="mt-2 pl-5">
                    <label className="block text-sm text-gray-400 mb-1">{t('settings.equalParts.delimiterLabel')}</label>
                    <input
                      id="custom-delimiter"
                      type="text"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                      value={settings.customDelimiter}
                      onChange={(e) => handleSettingChange('customDelimiter', e.target.value)}
                      placeholder={t('settings.equalParts.delimiterPlaceholder')}
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
              <label className="block text-sm text-gray-400 mb-1">{t('settings.delimiter.delimiterLabel')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={settings.delimiter}
                onChange={(e) => handleSettingChange('delimiter', e.target.value)}
                placeholder={t('settings.delimiter.delimiterPlaceholder')}
              />
            </div>
            <div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.caseSensitive} onChange={(e) => handleSettingChange('caseSensitive', e.target.checked)} />
                <span>{t('settings.delimiter.caseSensitive')}</span>
              </label>
            </div>
            <div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.includeDelimiter} onChange={(e) => handleSettingChange('includeDelimiter', e.target.checked)} />
                <span>{t('settings.delimiter.includeDelimiter')}</span>
              </label>
            </div>
          </div>
        )}

        {splitMethod === 'paragraphs' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('settings.paragraphs.paragraphsPerGroup')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('settings.paragraphs.minSize')}</label>
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
              <label className="block text-sm text-gray-400 mb-1">{t('settings.pattern.presetLabel')}</label>
              <select className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white" onChange={(e) => handleSettingChange('pattern', e.target.value)}>
                <option value="">{t('settings.pattern.selectTemplate')}</option>
                <option value="(Chapter|Part|Section)\s*(\d+|[IVXLCDM]+)">{t('settings.pattern.chaptersAndSections')}</option>
                <option value="^\s*\d+\.\s*">{t('settings.pattern.numberedItems')}</option>
                <option value="\d{1,2}[\./-]\d{1,2}([\./-]\d{2,4})?">{t('settings.pattern.datesTimestamps')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">{t('settings.pattern.patternLabel')}</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                value={settings.pattern}
                onChange={(e) => handleSettingChange('pattern', e.target.value)}
                placeholder={t('settings.pattern.patternPlaceholder')}
              />
            </div>
            <div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.includeMatch} onChange={(e) => handleSettingChange('includeMatch', e.target.checked)} />
                <span>{t('settings.pattern.includeMatch')}</span>
              </label>
            </div>
          </div>
        )}

        <div className="border-t border-gray-700 pt-3 mt-3">
          <div className="space-y-2">
            <div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.createSubItems} onChange={(e) => handleSettingChange('createSubItems', e.target.checked)} />
                <span>{t('settings.options.createSubItems')}</span>
              </label>
              <p className="text-xs text-gray-400 ml-6">{t('settings.options.createSubItemsHint')}</p>
            </div>

            <div>
              <label className="inline-flex items-center">
                <input type="checkbox" className="mr-2" checked={settings.keepOriginal} onChange={(e) => handleSettingChange('keepOriginal', e.target.checked)} />
                <span>{t('settings.options.keepOriginal')}</span>
              </label>
              <p className="text-xs text-gray-400 ml-6">{t('settings.options.keepOriginalHint')}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handlePreview}>
            {t('previewButton')}
          </button>
        </div>
      </div>
    );
  };

  const modalContent = (
    <div>
      <p className="text-gray-300 mb-2">{previewMode ? `${t('previewSection.resultsTitle')} "${title}"` : `${t('previewSection.settingsTitle')} "${title}"`}</p>

      {previewMode ? (
        <div className="mt-2">
          <SplitPreviewList parts={splitParts} selected={selectedParts} onTogglePart={handleTogglePart} onToggleAll={handleToggleAll} />
          <div className="mt-2 text-right text-sm text-gray-400">
            {t('previewSection.selected')}: {getSelectedCount()} {t('previewSection.of')} {splitParts.length}
          </div>
          <div className="flex justify-between mt-4">
            <button className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600" onClick={() => setPreviewMode(false)}>
              {t('previewSection.backToSettings')}
            </button>
            <button className="px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-600" onClick={handleApply} disabled={getSelectedCount() === 0}>
              {t('apply')}
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
      title={t('title')}
      primaryButtonText={previewMode ? t('apply') : t('previewButton')}
      onPrimaryButtonClick={previewMode ? handleApply : handlePreview}
      secondaryButtonText={t('cancel')}
    >
      {modalContent}
    </Modal>
  );
};

export default SplitContentModal;

