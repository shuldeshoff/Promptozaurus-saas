import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeModalProps {
  userName: string;
}

export default function WelcomeModal({ userName }: WelcomeModalProps) {
  const { t } = useTranslation('common');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has seen welcome modal before
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('hasSeenWelcome', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl border border-gray-800 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 md:p-8 text-center">
          <div className="text-6xl mb-4">🦖</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {t('welcome.title', 'Welcome to Promptozaurus')}!
          </h2>
          <p className="text-blue-100">
            {t('welcome.greeting', 'Hi')}, {userName}! {t('welcome.subtitle', "Let's get started")}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-2xl">
                📁
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t('welcome.feature1Title', 'Organize Your Prompts')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t(
                    'welcome.feature1Desc',
                    'Create projects and organize your context blocks and prompts efficiently.'
                  )}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center text-2xl">
                🤖
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t('welcome.feature2Title', 'AI Integration')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t(
                    'welcome.feature2Desc',
                    'Connect with OpenAI, Anthropic, Gemini, and more AI providers.'
                  )}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center text-2xl">
                📚
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  {t('welcome.feature3Title', 'Template Library')}
                </h3>
                <p className="text-gray-400 text-sm">
                  {t(
                    'welcome.feature3Desc',
                    'Save and reuse your favorite prompt templates.'
                  )}
                </p>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-gray-800 rounded-lg p-4 mt-6">
              <h4 className="text-sm font-semibold text-white mb-2">
                💡 {t('welcome.quickTipsTitle', 'Quick Tips')}:
              </h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• {t('welcome.tip1', 'Start by creating your first project')}</li>
                <li>
                  • {t('welcome.tip2', 'Configure your AI API keys in settings (🔑 button)')}
                </li>
                <li>• {t('welcome.tip3', 'All changes are auto-saved')}</li>
                <li>
                  • {t('welcome.tip4', 'Free plan includes up to 10 projects')}
                </li>
              </ul>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-8">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all font-semibold text-lg"
            >
              {t('welcome.getStarted', "Let's Get Started")} 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

