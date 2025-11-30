import { useEditor } from '../../context/EditorContext';
import { useConfirmation } from '../../context/ConfirmationContext';
import { useProjectUpdate } from '../../hooks/useProjectUpdate';
import { useTranslation } from 'react-i18next';
import type { ContextBlock } from '@promptozaurus/shared';
import { generateDefaultContextItemName, generateDefaultContextSubItemName } from '../../utils/nameGenerators';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableContextItem } from './SortableContextItem';
import { SortableSubItem } from './SortableSubItem';
import './ContextBlockItem.css';

interface ContextBlockItemProps {
  block: ContextBlock;
  isActive: boolean;
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

const ContextBlockItem = ({ block, isActive }: ContextBlockItemProps) => {
  const { t } = useTranslation('blockItem');
  const { openConfirmation } = useConfirmation();
  const { setActiveContextItem, currentProject } = useEditor();
  const { updateProjectAndRefresh } = useProjectUpdate();

  // Нормализация items
  const normalizedItems = Array.isArray(block.items)
    ? block.items.map((item) => ({
        ...item,
        subItems: Array.isArray(item.subItems) ? item.subItems : [],
      }))
    : [];

  // Вычисление общего количества символов
  const totalChars = normalizedItems.reduce((total, item) => {
    const itemChars = item.chars || 0;
    const subItemsChars = item.subItems.reduce((sum, sub) => sum + (sub.chars || 0), 0);
    return total + itemChars + subItemsChars;
  }, 0);

  // Обработчик удаления блока
  const handleDeleteBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    openConfirmation(
      t('context.deleteTitle'),
      t('context.delete'),
      async () => {
        const newContextBlocks = currentProject.data.contextBlocks.filter((b) => b.id !== block.id);

        await updateProjectAndRefresh({
          ...currentProject.data,
          contextBlocks: newContextBlocks,
        });
      }
    );
  };

  // Обработчик экспорта блока
  const handleExportBlock = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Формируем JSON для экспорта
    const exportData = {
      title: block.title,
      items: block.items,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${block.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Обработчик добавления нового item
  const handleAddItem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const defaultTitle = generateDefaultContextItemName(block);
    const newItem = {
      id: Date.now(),
      title: defaultTitle,
      content: '',
      chars: 0,
      subItems: [],
    };

    const updatedBlock = {
      ...block,
      items: [...block.items, newItem],
    };

    const newContextBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? updatedBlock : b));

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newContextBlocks,
    });

    // Активируем новый item в редакторе
    setActiveContextItem(newItem.id, null);
  };

  // Обработчик удаления item
  const handleDeleteItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    openConfirmation(
      t('context.deleteItemTitle'),
      t('context.deleteItem'),
      async () => {
        const updatedBlock = {
          ...block,
          items: block.items.filter((item) => item.id !== itemId),
        };

        const newContextBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? updatedBlock : b));

        await updateProjectAndRefresh({
          ...currentProject.data,
          contextBlocks: newContextBlocks,
        });
      }
    );
  };

  // Обработчик добавления sub-item
  const handleAddSubItem = async (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    const item = block.items.find((i) => i.id === itemId);
    if (!item) return;

    const defaultTitle = generateDefaultContextSubItemName(item);
    const newSubItem = {
      id: Date.now(),
      title: defaultTitle,
      content: '',
      chars: 0,
    };

    const updatedBlock = {
      ...block,
      items: block.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              subItems: [...(i.subItems || []), newSubItem],
            }
          : i
      ),
    };

    const newContextBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? updatedBlock : b));

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newContextBlocks,
    });

    // Активируем новый sub-item в редакторе
    setActiveContextItem(itemId, newSubItem.id);
  };

  // Обработчик удаления sub-item
  const handleDeleteSubItem = async (itemId: number, subItemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProject) return;

    openConfirmation(
      t('context.deleteSubItemTitle'),
      t('context.deleteSubItem'),
      async () => {
        const updatedBlock = {
          ...block,
          items: block.items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  subItems: (i.subItems || []).filter((sub) => sub.id !== subItemId),
                }
              : i
          ),
        };

        const newContextBlocks = currentProject.data.contextBlocks.map((b) => (b.id === block.id ? updatedBlock : b));

        await updateProjectAndRefresh({
          ...currentProject.data,
          contextBlocks: newContextBlocks,
        });
      }
    );
  };

  // Клик на элемент - активировать его в редакторе
  const handleItemClick = (itemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveContextItem(itemId, null);
  };

  // Клик на подэлемент - активировать его в редакторе
  const handleSubItemClick = (itemId: number, subItemId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveContextItem(itemId, subItemId);
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Обработчик окончания перетаскивания основных элементов
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !currentProject) return;

    const activeId = Number(active.id);
    const overId = Number(over.id);

    const oldIndex = block.items.findIndex((item) => item.id === activeId);
    const newIndex = block.items.findIndex((item) => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = arrayMove(block.items, oldIndex, newIndex);

    const updatedBlock = {
      ...block,
      items: newItems,
    };

    const newContextBlocks = currentProject.data.contextBlocks.map((b) =>
      b.id === block.id ? updatedBlock : b
    );

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newContextBlocks,
    });
  };

  // Обработчик окончания перетаскивания подэлементов
  const handleSubItemDragEnd = async (itemId: number, event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !currentProject) return;

    const item = block.items.find((i) => i.id === itemId);
    if (!item) return;

    // Извлекаем ID из составного ключа "parentId-subItemId"
    const activeSubId = Number(active.id.toString().split('-')[1]);
    const overSubId = Number(over.id.toString().split('-')[1]);

    const oldIndex = item.subItems.findIndex((sub) => sub.id === activeSubId);
    const newIndex = item.subItems.findIndex((sub) => sub.id === overSubId);

    if (oldIndex === -1 || newIndex === -1) return;

    const newSubItems = arrayMove(item.subItems, oldIndex, newIndex);

    const updatedBlock = {
      ...block,
      items: block.items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              subItems: newSubItems,
            }
          : i
      ),
    };

    const newContextBlocks = currentProject.data.contextBlocks.map((b) =>
      b.id === block.id ? updatedBlock : b
    );

    await updateProjectAndRefresh({
      ...currentProject.data,
      contextBlocks: newContextBlocks,
    });
  };

  return (
    <div className={`cn-block ${isActive ? 'cn-block--active' : ''}`}>
      {/* Заголовок блока */}
      <div className="cn-block__header">
        <span className="cn-block__title">{block.title}</span>
        <div className="cn-block__stats">
          <span>
            {formatChars(totalChars)} {t('context.characters')}
          </span>
          <div className="cn-block__actions">
            <button className="cn-block__action-btn cn-block__action-btn--export" onClick={handleExportBlock} title={t('context.export')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0L8 8m4-4v12"
                />
              </svg>
            </button>
            <button className="cn-block__action-btn cn-block__action-btn--delete" onClick={handleDeleteBlock} title={t('context.delete')}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Содержимое с элементами */}
      <div className="cn-block__content">
        {normalizedItems.length === 0 ? (
          <div className="cn-empty">{t('context.noItems')}</div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={normalizedItems.map((item) => item.id.toString())} strategy={verticalListSortingStrategy}>
              <div className="cn-rows">
                {normalizedItems.map((item) => {
                  const itemChars = item.chars || 0;
                  const hasSubItems = item.subItems.length > 0;

                  return (
                    <div key={item.id} className={`cn-row ${hasSubItems ? 'cn-row--grouped' : ''}`}>
                      {/* Основной элемент слева с drag-and-drop */}
                      <div className="cn-row__item">
                        <SortableContextItem
                          id={item.id}
                          title={item.title}
                          chars={itemChars}
                          onDelete={(e) => handleDeleteItem(item.id, e)}
                          onClick={(e) => handleItemClick(item.id, e)}
                        />
                      </div>

                      {/* Подэлементы справа с drag-and-drop */}
                      <div className="cn-row__subitems">
                        {hasSubItems && (
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={(event) => handleSubItemDragEnd(item.id, event)}
                          >
                            <SortableContext
                              items={item.subItems.map((sub) => `${item.id}-${sub.id}`)}
                              strategy={verticalListSortingStrategy}
                            >
                              {item.subItems.map((subItem) => (
                                <SortableSubItem
                                  key={subItem.id}
                                  id={subItem.id}
                                  parentId={item.id}
                                  title={subItem.title}
                                  chars={subItem.chars || 0}
                                  onDelete={(e) => handleDeleteSubItem(item.id, subItem.id, e)}
                                  onClick={(e) => handleSubItemClick(item.id, subItem.id, e)}
                                />
                              ))}
                            </SortableContext>
                          </DndContext>
                        )}
                        {/* Кнопка добавления подэлемента справа */}
                        <button className="cn-add-btn cn-add-btn--subitem" onClick={(e) => handleAddSubItem(item.id, e)} title={t('context.addSubItem')}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Кнопка добавления нового элемента */}
        <div className="cn-row" style={{ marginTop: '8px' }}>
          <button className="cn-add-btn" onClick={handleAddItem} title={t('context.addItem')}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContextBlockItem;
