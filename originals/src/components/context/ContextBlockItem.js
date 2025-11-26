// src/components/context/ContextBlockItem.js - Компонент блока контекста с тайловым дизайном
import React from 'react';
import { useApp } from '../../context/AppContext';
import { useTranslation } from 'react-i18next';

/**
 * Форматирует число символов
 */
const formatChars = (num) => {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

const ContextBlockItem = ({ block, isActive }) => {
  const { t } = useTranslation();
  const { actions } = useApp();

  // Нормализация items
  const normalizedItems = Array.isArray(block.items)
    ? block.items.map(item => ({
        ...item,
        subItems: Array.isArray(item.subItems) ? item.subItems : []
      }))
    : [];

  // Вычисление общего количества символов
  const totalChars = normalizedItems.reduce((total, item) => {
    const itemChars = item.chars || 0;
    const subItemsChars = item.subItems.reduce((sum, sub) => sum + (sub.chars || 0), 0);
    return total + itemChars + subItemsChars;
  }, 0);

  // Обработчики
  const handleBlockClick = () => {
    actions.setActiveContextBlock(block.id);
  };

  const handleDeleteBlock = (e) => {
    e.stopPropagation();
    actions.deleteContextBlock(block.id);
  };

  const handleExportBlock = (e) => {
    e.stopPropagation();
    actions.exportContextBlock(block.id);
  };

  const handleAddItem = (e) => {
    e.stopPropagation();
    actions.addContextItem(block.id);
  };

  const handleDeleteItem = (itemId, e) => {
    e.stopPropagation();
    actions.deleteContextItem(block.id, itemId);
  };

  const handleAddSubItem = (itemId, e) => {
    e.stopPropagation();
    actions.addContextSubItem(block.id, itemId);
  };

  const handleDeleteSubItem = (itemId, subItemId, e) => {
    e.stopPropagation();
    actions.deleteContextSubItem(block.id, itemId, subItemId);
  };

  // Клик на элемент - активировать его в редакторе
  const handleItemClick = (itemId, e) => {
    e.stopPropagation();
    actions.setActiveContextItem(block.id, itemId, null);
  };

  // Клик на подэлемент - активировать его в редакторе
  const handleSubItemClick = (itemId, subItemId, e) => {
    e.stopPropagation();
    actions.setActiveContextItem(block.id, itemId, subItemId);
  };

  return (
    <div className={`cn-block ${isActive ? 'cn-block--active' : ''}`}>
      {/* Заголовок блока */}
      <div className="cn-block__header" onClick={handleBlockClick}>
        <span className="cn-block__title">{block.title}</span>
        <div className="cn-block__stats">
          <span>{formatChars(totalChars)} {t('blockItem.context.characters')}</span>
          <div className="cn-block__actions">
            <button
              className="cn-block__action-btn cn-block__action-btn--export"
              onClick={handleExportBlock}
              title={t('blockItem.context.export')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0L8 8m4-4v12" />
              </svg>
            </button>
            <button
              className="cn-block__action-btn cn-block__action-btn--delete"
              onClick={handleDeleteBlock}
              title={t('blockItem.context.delete')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Содержимое с элементами */}
      <div className="cn-block__content">
        {normalizedItems.length === 0 ? (
          <div className="cn-empty">{t('blockItem.context.noItems')}</div>
        ) : (
          <div className="cn-rows">
            {normalizedItems.map(item => {
              const itemChars = item.chars || 0;
              const hasSubItems = item.subItems.length > 0;

              return (
                <div key={item.id} className={`cn-row ${hasSubItems ? 'cn-row--grouped' : ''}`}>
                  {/* Основной элемент слева */}
                  <div className="cn-row__item">
                    <div
                      className="cn-tile cn-tile--item"
                      onClick={(e) => handleItemClick(item.id, e)}
                    >
                      <div className="cn-tile__content">
                        <span className="cn-tile__title" title={item.title}>
                          {item.title.length > 35 ? item.title.substring(0, 32) + '...' : item.title}
                        </span>
                        <span className="cn-tile__chars">{formatChars(itemChars)}</span>
                      </div>
                      <div className="cn-tile__actions">
                        <button
                          className="cn-tile__action cn-tile__action--delete"
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          title={t('blockItem.context.deleteItem')}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Подэлементы справа */}
                  <div className="cn-row__subitems">
                    {hasSubItems && item.subItems.map(subItem => (
                      <div
                        key={subItem.id}
                        className="cn-tile cn-tile--subitem"
                        onClick={(e) => handleSubItemClick(item.id, subItem.id, e)}
                      >
                        <div className="cn-tile__content">
                          <span className="cn-tile__title" title={subItem.title}>
                            {subItem.title.length > 20 ? subItem.title.substring(0, 17) + '...' : subItem.title}
                          </span>
                          <span className="cn-tile__chars">{formatChars(subItem.chars || 0)}</span>
                        </div>
                        <div className="cn-tile__actions">
                          <button
                            className="cn-tile__action cn-tile__action--delete"
                            onClick={(e) => handleDeleteSubItem(item.id, subItem.id, e)}
                            title={t('blockItem.context.deleteSubItem')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    {/* Кнопка добавления подэлемента справа */}
                    <button
                      className="cn-add-btn cn-add-btn--subitem"
                      onClick={(e) => handleAddSubItem(item.id, e)}
                      title={t('blockItem.context.addSubItem')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Кнопка добавления нового элемента */}
        <div className="cn-row" style={{ marginTop: '8px' }}>
          <button
            className="cn-add-btn"
            onClick={handleAddItem}
            title={t('blockItem.context.addItem')}
          >
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
