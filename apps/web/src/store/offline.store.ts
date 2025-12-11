import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProjectData } from '../hooks/useProjects';

interface OfflineChange {
  projectId: string;
  data: ProjectData;
  timestamp: number;
}

interface OfflineStore {
  isOnline: boolean;
  pendingChanges: OfflineChange[];
  setOnline: (online: boolean) => void;
  addPendingChange: (projectId: string, data: ProjectData) => void;
  removePendingChange: (projectId: string) => void;
  clearPendingChanges: () => void;
  getPendingChange: (projectId: string) => OfflineChange | undefined;
}

export const useOfflineStore = create<OfflineStore>()(
  persist(
    (set, get) => ({
      isOnline: navigator.onLine,
      pendingChanges: [],

      setOnline: (online: boolean) => set({ isOnline: online }),

      addPendingChange: (projectId: string, data: ProjectData) =>
        set((state: OfflineStore) => {
          const existing = state.pendingChanges.findIndex(
            (change: OfflineChange) => change.projectId === projectId
          );

          if (existing >= 0) {
            const newChanges = [...state.pendingChanges];
            newChanges[existing] = {
              projectId,
              data,
              timestamp: Date.now(),
            };
            return { pendingChanges: newChanges };
          }

          return {
            pendingChanges: [
              ...state.pendingChanges,
              { projectId, data, timestamp: Date.now() },
            ],
          };
        }),

      removePendingChange: (projectId: string) =>
        set((state: OfflineStore) => ({
          pendingChanges: state.pendingChanges.filter(
            (change: OfflineChange) => change.projectId !== projectId
          ),
        })),

      clearPendingChanges: () => set({ pendingChanges: [] }),

      getPendingChange: (projectId: string) => {
        return get().pendingChanges.find(
          (change: OfflineChange) => change.projectId === projectId
        );
      },
    }),
    {
      name: 'offline-storage',
    }
  )
);

// Setup online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}

