import { useState, useRef, useEffect } from 'react';
import { useEditor } from '../../context/EditorContext';
import NavigationPanel from './NavigationPanel';
import BlocksPanel from './BlocksPanel';
import EditorPanel from './EditorPanel';
import QuickHelp from '../ui/QuickHelp';

const MainLayout = () => {
  const {
    navPanelWidth,
    blocksPanelWidth,
    setNavPanelWidth,
    setBlocksPanelWidth,
  } = useEditor();

  const [isDraggingNav, setIsDraggingNav] = useState(false);
  const [isDraggingBlocks, setIsDraggingBlocks] = useState(false);
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Начало изменения размера навигационной панели
  const startNavResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingNav(true);
  };

  // Начало изменения размера панели блоков
  const startBlocksResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingBlocks(true);
  };

  // Завершение изменения размера
  const stopResize = () => {
    setIsDraggingNav(false);
    setIsDraggingBlocks(false);
  };

  // Изменение размера при перемещении мыши
  const resize = (e: MouseEvent) => {
    if (isDraggingNav || isDraggingBlocks) {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const mouseX = e.clientX - containerRect.left;

      if (isDraggingNav) {
        // Изменяем ширину навигационной панели (10-30%)
        const newNavWidth = Math.max(10, Math.min(30, (mouseX / containerWidth) * 100));
        setNavPanelWidth(newNavWidth);
      } else if (isDraggingBlocks) {
        // Изменяем ширину панели блоков
        const newCombinedWidth = Math.max(
          navPanelWidth + 20, // Минимум: навпанель + 20%
          Math.min(
            navPanelWidth + 60, // Максимум: навпанель + 60%
            (mouseX / containerWidth) * 100
          )
        );
        setBlocksPanelWidth(newCombinedWidth - navPanelWidth);
      }
    }
  };

  // Подписка на события мыши
  useEffect(() => {
    if (isDraggingNav || isDraggingBlocks) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);

      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isDraggingNav, isDraggingBlocks, navPanelWidth, blocksPanelWidth]);

  // Глобальные горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S - сохранение (автоматически через React Query)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.log('Ctrl+S pressed - Auto-save handled by React Query');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Стили панелей
  const navPanelStyle = {
    width: `${navPanelWidth}%`,
    minWidth: '120px',
  };

  const blocksPanelStyle = {
    width: `${blocksPanelWidth}%`,
    minWidth: '200px',
  };

  const editorPanelStyle = {
    width: `${100 - navPanelWidth - blocksPanelWidth}%`,
    minWidth: '200px',
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-200">
      {/* Основной контент - трёхпанельный layout */}
      <div className="flex flex-1 overflow-hidden" ref={containerRef}>
        {/* Навигационная панель (левая) */}
        <div style={navPanelStyle} className="nav-panel-container">
          <NavigationPanel />
        </div>

        {/* Разделитель для навигационной панели */}
        <div
          className="resize-handle resize-handle-x"
          onMouseDown={startNavResize}
          title="Изменить ширину навигационной панели"
        />

        {/* Панель блоков (центральная) */}
        <div style={blocksPanelStyle} className="blocks-panel-container">
          <BlocksPanel />
        </div>

        {/* Разделитель для панели блоков */}
        <div
          className="resize-handle resize-handle-x"
          onMouseDown={startBlocksResize}
          title="Изменить ширину панели блоков"
        />

        {/* Панель редактора (правая) */}
        <div style={editorPanelStyle} className="editor-panel-container">
          <EditorPanel />
        </div>
      </div>

      {/* QuickHelp Modal */}
      <QuickHelp isOpen={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
};

export default MainLayout;

