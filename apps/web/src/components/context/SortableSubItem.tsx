import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';

interface SortableSubItemProps {
  id: number;
  parentId: number;
  title: string;
  chars: number;
  onDelete: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

/**
 * Форматирует число символов (1000 → 1.0k)
 */
const formatChars = (num: number): string => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export const SortableSubItem = ({
  id,
  parentId,
  title,
  chars,
  onDelete,
  onClick,
}: SortableSubItemProps) => {
  const { t } = useTranslation('blockItem');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `${parentId}-${id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="cn-tile cn-tile--subitem"
      {...attributes}
    >
      <div
        {...listeners}
        className="cn-tile__drag-handle"
        style={{ cursor: 'grab', padding: '4px', marginRight: '4px' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8h16M4 16h16"
          />
        </svg>
      </div>
      <div className="cn-tile__content" onClick={onClick}>
        <span className="cn-tile__title" title={title}>
          {title.length > 20 ? title.substring(0, 17) + '...' : title}
        </span>
        <span className="cn-tile__chars">{formatChars(chars || 0)}</span>
      </div>
      <div className="cn-tile__actions">
        <button
          className="cn-tile__action cn-tile__action--delete"
          onClick={onDelete}
          title={t('context.deleteSubItem')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

