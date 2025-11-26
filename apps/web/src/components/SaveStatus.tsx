import { useTranslation } from 'react-i18next';

interface SaveStatusProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  isOffline?: boolean;
}

export default function SaveStatus({ isSaving, lastSaved, error, isOffline }: SaveStatusProps) {
  const { t } = useTranslation('common');

  const getStatusText = () => {
    if (isOffline) {
      return t('messages.offlineMode', 'Offline - changes saved locally');
    }
    if (error) {
      return t('messages.saveFailed', 'Failed to save');
    }
    if (isSaving) {
      return t('messages.saving', 'Saving...');
    }
    if (lastSaved) {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      
      if (diff < 5000) {
        return t('messages.saved', 'Saved');
      }
      
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes < 1) {
        return t('messages.savedSecondsAgo', 'Saved {{seconds}}s ago', { seconds });
      }
      
      return t('messages.savedMinutesAgo', 'Saved {{minutes}}m ago', { minutes });
    }
    return '';
  };

  const getStatusColor = () => {
    if (isOffline) return 'text-orange-400';
    if (error) return 'text-red-400';
    if (isSaving) return 'text-yellow-400';
    if (lastSaved) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (isOffline) return '';
    if (error) return '';
    if (isSaving) return '...';
    if (lastSaved) return '✓';
    return '';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${getStatusColor()}`}>
      <span>{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
}

