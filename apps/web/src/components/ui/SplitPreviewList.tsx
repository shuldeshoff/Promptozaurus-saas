import { useTranslation } from 'react-i18next';

interface SplitPreviewListProps {
  parts?: string[];
  selected?: boolean[];
  onTogglePart: (index: number) => void;
  onToggleAll: (selectAll: boolean) => void;
}

const SplitPreviewList = ({ parts = [], selected = [], onTogglePart, onToggleAll }: SplitPreviewListProps) => {
  const { t } = useTranslation('splitModal');

  // Функция для получения предпросмотра текста (первые N символов)
  const getPreview = (text: string, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
      <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-2 flex justify-between items-center">
        <div className="flex items-center">
          <input type="checkbox" className="mr-2" checked={selected.every(Boolean)} onChange={(e) => onToggleAll(e.target.checked)} />
          <span className="text-sm font-medium">{t('splitModal.previewList.selectAll')}</span>
        </div>
        <div>
          <button className="text-xs px-2 py-1 bg-blue-800 text-blue-200 rounded hover:bg-blue-700 mr-2" onClick={() => onToggleAll(true)}>
            {t('splitModal.previewList.selectAll')}
          </button>
          <button className="text-xs px-2 py-1 bg-gray-700 text-gray-200 rounded hover:bg-gray-600" onClick={() => onToggleAll(false)}>
            {t('splitModal.previewList.deselectAll')}
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-700">
        {parts.map((part, index) => (
          <div key={index} className={`p-3 hover:bg-gray-750 ${selected[index] ? 'bg-blue-900 bg-opacity-20' : ''}`}>
            <div className="flex items-start">
              <div className="flex items-center mr-2">
                <input type="checkbox" checked={selected[index] || false} onChange={() => onTogglePart(index)} className="mr-2" />
                <span className="text-sm font-medium text-gray-300">#{index + 1}</span>
              </div>
              <div className="flex-grow">
                <div className="text-sm font-mono whitespace-pre-wrap overflow-hidden text-gray-300">{getPreview(part)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {part.length} {t('splitModal.previewList.characters')}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {parts.length === 0 && (
        <div className="p-4 text-center text-gray-500">{t('splitModal.previewList.noItems')}</div>
      )}
    </div>
  );
};

export default SplitPreviewList;

