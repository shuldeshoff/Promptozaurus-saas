import { useAuthStore } from '../store/auth.store';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { user, logout } = useAuthStore();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">🦖 Promptozaurus</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors"
            >
              {i18n.language.toUpperCase()}
            </button>

            {/* User Menu */}
            {user && (
              <div className="flex items-center gap-3">
                {user.avatarUrl && (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div className="text-sm">
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-gray-400 text-xs">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  {t('common:logout', 'Logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {t('common:welcome', 'Welcome')}, {user?.name}!
          </h2>
          <p className="text-gray-400 mb-6">
            {t('dashboard.subtitle', 'Your workspace is ready')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">📁</div>
              <div className="text-2xl font-bold text-white mb-1">
                {user?.projectCount || 0} / {user?.projectLimit || 10}
              </div>
              <div className="text-sm text-gray-400">
                {t('dashboard.projects', 'Projects')}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">🌍</div>
              <div className="text-2xl font-bold text-white mb-1">
                {user?.language?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400">
                {t('dashboard.language', 'Language')}
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-6">
              <div className="text-4xl mb-3">🎨</div>
              <div className="text-2xl font-bold text-white mb-1">
                {user?.theme === 'dark' ? 'Dark' : 'Light'}
              </div>
              <div className="text-sm text-gray-400">
                {t('dashboard.theme', 'Theme')}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <p className="text-gray-500 text-sm">
              {t('dashboard.stage1complete', 'Stage 1: Authentication - Complete! ✅')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

