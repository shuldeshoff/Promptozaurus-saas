import { useTranslation } from 'react-i18next';

interface EmptyProjectStateProps {
  isProjectsPanelCollapsed: boolean;
  onOpenProjectsPanel: () => void;
}

const EmptyProjectState = ({ isProjectsPanelCollapsed, onOpenProjectsPanel }: EmptyProjectStateProps) => {
  const { t } = useTranslation('dashboard');

  return (
    <div className="flex items-center justify-center h-full bg-gray-900">
      <div className="text-center max-w-md px-6">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-24 w-24 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-300 mb-3">
          {t('emptyState.title', 'Не выбран или не создан ни один проект')}
        </h2>

        {/* Description */}
        <p className="text-gray-500 mb-6">
          {t('emptyState.description', 'Выберите существующий проект или создайте новый, чтобы начать работу с контекстами и промптами')}
        </p>

        {/* Action Button */}
        {isProjectsPanelCollapsed && (
          <button
            onClick={onOpenProjectsPanel}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            {t('emptyState.openProjectsPanel', 'Открыть панель проектов')}
          </button>
        )}

        {!isProjectsPanelCollapsed && (
          <p className="text-sm text-gray-600">
            {t('emptyState.hint', 'Используйте панель слева для создания или выбора проекта')}
          </p>
        )}
      </div>
    </div>
  );
};

export default EmptyProjectState;

