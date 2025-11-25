// src/components/layout/MainLayout.js - Основной макет приложения с изменяемыми размерами панелей
import React, { useState, useRef, useEffect } from 'react';
import Header from './Header';
import NavigationPanel from './NavigationPanel';
import BlocksPanel from './BlocksPanel';
import EditorPanel from './EditorPanel';
import QuickHelp from '../ui/QuickHelp';
import { useApp } from '../../context/AppContext';

// Основной компонент макета приложения
const MainLayout = () => {
  const { state, actions } = useApp();
  
  // Начальные размеры панелей в процентах
  const [navPanelWidth, setNavPanelWidth] = useState(16); // 16% по умолчанию (примерно 1/6)
  const [blocksPanelWidth, setBlocksPanelWidth] = useState(40); // 40% по умолчанию (примерно 2/5)
  
  // Флаги для отслеживания перетаскивания
  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [isDraggingBlocks, setIsDraggingBlocks] = useState(false);
  
  // Ссылки на DOM-элементы для расчетов
  const containerRef = useRef(null);
  
  // Состояние для показа справки
  const [showHelp, setShowHelp] = useState(false);
  
  // Функции для начала перетаскивания
  const startNavResize = (e) => {
    e.preventDefault();
    setIsDraggingNav(true);
  };
  
  const startBlocksResize = (e) => {
    e.preventDefault();
    setIsDraggingBlocks(true);
  };
  
  // Функция для завершения перетаскивания
  const stopResize = () => {
    setIsDraggingNav(false);
    setIsDraggingBlocks(false);
  };
  
  // Обработчик для изменения размера при перемещении мыши
  const resize = (e) => {
    if (isDraggingNav || isDraggingBlocks) {
      if (!containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;
      
      if (isDraggingNav) {
        // Изменяем ширину навигационной панели
        const newNavWidth = Math.max(10, Math.min(30, (mouseX / containerWidth) * 100));
        setNavPanelWidth(newNavWidth);
      } else if (isDraggingBlocks) {
        // Изменяем ширину панели блоков
        // Сохраняем пропорцию: навигационная панель + панель блоков
        const newCombinedWidth = Math.max(
          navPanelWidth + 20, // Минимум: навпанель + 20%
          Math.min(
            navPanelWidth + 60, // Максимум: навпанель + 60%
            (mouseX / containerWidth) * 100 // Фактическая позиция мыши
          )
        );
        setBlocksPanelWidth(newCombinedWidth - navPanelWidth);
      }
    }
  };
  
  // Подписываемся на события мыши для перетаскивания
  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);
    
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isDraggingNav, isDraggingBlocks, navPanelWidth, blocksPanelWidth]);
  
  // Обработчик горячих клавиш для всего приложения
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Проверяем клавишу F1 для вызова справки
      if (e.key === 'F1') {
        e.preventDefault();
        console.log('Обнаружено нажатие F1, открываем справку...');
        setShowHelp(true);
        return;
      }
      
      // Проверяем сочетание клавиш Ctrl+S (работает для любой раскладки)
      if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyS' || e.key.toLowerCase() === 's' || e.key.toLowerCase() === 'ы')) {
        e.preventDefault(); // Предотвращаем стандартное поведение браузера
        console.log('Обнаружено сочетание клавиш Ctrl+S, сохранение проекта...');
        
        // Вызываем функцию сохранения проекта
        actions.saveProject()
          .then(success => {
            if (success) {
              console.log('Проект успешно сохранен через горячие клавиши');
            } else {
              console.error('Не удалось сохранить проект через горячие клавиши');
            }
          })
          .catch(error => {
            console.error('Ошибка при сохранении проекта через горячие клавиши:', error);
          });
      }
    };
    
    // Добавляем обработчик
    window.addEventListener('keydown', handleKeyDown);
    
    // Удаляем обработчик при размонтировании компонента
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [actions]); // Зависимость от actions для корректного обновления функции при изменении контекста
  
  // Вычисляем фактические стили для панелей
  const navPanelStyle = {
    width: `${navPanelWidth}%`,
    minWidth: '120px'
  };
  
  const blocksPanelStyle = {
    width: `${blocksPanelWidth}%`,
    minWidth: '200px'
  };
  
  const editorPanelStyle = {
    width: `${100 - navPanelWidth - blocksPanelWidth}%`,
    minWidth: '200px'
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200">
      {/* Верхняя панель с кнопками и информацией о проекте */}
      <Header />
      
      {/* Основной контент - трехколоночный макет */}
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Навигация */}
        <div style={navPanelStyle} className="nav-panel-container">
          <NavigationPanel />
        </div>
        
        {/* Разделитель для изменения размера навигационной панели */}
        <div 
          className="resize-handle resize-handle-x"
          onMouseDown={startNavResize}
          title="Изменить ширину навигационной панели"
        />
        
        {/* Блоки */}
        <div style={blocksPanelStyle} className="blocks-panel-container">
          <BlocksPanel />
        </div>
        
        {/* Разделитель для изменения размера панели блоков */}
        <div 
          className="resize-handle resize-handle-x"
          onMouseDown={startBlocksResize}
          title="Изменить ширину панели блоков"
        />
        
        {/* Редактор */}
        <div style={editorPanelStyle} className="editor-panel-container">
          <EditorPanel />
        </div>
      </div>
      
      {/* Quick Help Modal */}
      <QuickHelp 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </div>
  );
};

export default MainLayout;