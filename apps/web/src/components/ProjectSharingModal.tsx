import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ProjectShare } from '@promptozaurus/shared';
import {
  useProjectShares,
  useCreateProjectShare,
  useUpdateProjectShare,
  useDeleteProjectShare,
} from '../hooks/useProjectShares';
import { useConfirmation } from '../context/ConfirmationContext';

interface ProjectSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
}

export default function ProjectSharingModal({
  isOpen,
  onClose,
  projectId,
  projectName,
}: ProjectSharingModalProps) {
  const { t } = useTranslation('common');
  const { openConfirmation } = useConfirmation();

  const [newEmail, setNewEmail] = useState('');
  const [newPermission, setNewPermission] = useState<'view' | 'edit'>('view');

  const { data: shares = [], isLoading } = useProjectShares(projectId);
  const createShareMutation = useCreateProjectShare();
  const updateShareMutation = useUpdateProjectShare();
  const deleteShareMutation = useDeleteProjectShare();

  const handleAddShare = async () => {
    if (!newEmail.trim()) {
      alert(t('messages.enterEmail', 'Please enter an email'));
      return;
    }

    // Простая валидация email
    if (!newEmail.includes('@')) {
      alert(t('messages.invalidEmail', 'Invalid email format'));
      return;
    }

    try {
      await createShareMutation.mutateAsync({
        projectId,
        sharedWithEmail: newEmail.trim(),
        permission: newPermission,
      });
      setNewEmail('');
      setNewPermission('view');
    } catch (error: any) {
      alert(error.response?.data?.error || t('messages.failedToShare', 'Failed to share project'));
    }
  };

  const handleChangePermission = async (shareId: string, permission: 'view' | 'edit') => {
    try {
      await updateShareMutation.mutateAsync({ shareId, permission });
    } catch (error: any) {
      alert(error.response?.data?.error || t('messages.failedToUpdate', 'Failed to update permission'));
    }
  };

  const handleDeleteShare = async (share: ProjectShare) => {
    openConfirmation(
      t('messages.confirmDelete', 'Confirm deletion'),
      t('messages.confirmDeleteShareMessage', `Remove access for ${share.sharedWithEmail}?`),
      async () => {
        try {
          await deleteShareMutation.mutateAsync({ shareId: share.id, projectId });
        } catch (error: any) {
          alert(error.response?.data?.error || t('messages.failedToDelete', 'Failed to delete share'));
        }
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">
              {t('labels.shareProject', 'Share Project')}
            </h2>
            <p className="text-sm text-gray-400 mt-1">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Add new share */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('labels.shareWithEmail', 'Share with email')}
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="user@example.com"
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
              <select
                value={newPermission}
                onChange={(e) => setNewPermission(e.target.value as 'view' | 'edit')}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="view">{t('labels.canView', 'Can view')}</option>
                <option value="edit">{t('labels.canEdit', 'Can edit')}</option>
              </select>
              <button
                onClick={handleAddShare}
                disabled={createShareMutation.isPending}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {t('buttons.share', 'Share')}
              </button>
            </div>
          </div>

          {/* Existing shares list */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              {t('labels.sharedWith', 'Shared with')} ({shares.length})
            </h3>

            {isLoading ? (
              <div className="text-center text-gray-400 py-8">
                {t('messages.loading', 'Loading...')}
              </div>
            ) : shares.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                {t('messages.noShares', 'This project is not shared yet')}
              </div>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white">{share.sharedWithEmail}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t('labels.status', 'Status')}:{' '}
                        <span
                          className={
                            share.status === 'accepted'
                              ? 'text-green-400'
                              : share.status === 'rejected'
                              ? 'text-red-400'
                              : 'text-yellow-400'
                          }
                        >
                          {t(`labels.${share.status}`, share.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={share.permission}
                        onChange={(e) =>
                          handleChangePermission(share.id, e.target.value as 'view' | 'edit')
                        }
                        disabled={updateShareMutation.isPending}
                        className="px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="view">{t('labels.canView', 'Can view')}</option>
                        <option value="edit">{t('labels.canEdit', 'Can edit')}</option>
                      </select>
                      <button
                        onClick={() => handleDeleteShare(share)}
                        disabled={deleteShareMutation.isPending}
                        className="px-2 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors disabled:opacity-50"
                      >
                        {t('buttons.remove', 'Remove')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {t('buttons.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}

