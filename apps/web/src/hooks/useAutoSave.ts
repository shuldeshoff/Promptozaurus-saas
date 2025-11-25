import { useEffect, useRef, useCallback, useState } from 'react';
import { useUpdateProject, Project, ProjectData } from './useProjects';
import { useOfflineStore } from '../store/offline.store';

interface UseAutoSaveOptions {
  project: Project | null;
  enabled?: boolean;
  debounceMs?: number;
  onSaveStart?: () => void;
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

interface AutoSaveStatus {
  isSaving: boolean;
  lastSaved: Date | null;
  error: Error | null;
  saveNow: () => Promise<void>;
  isOffline: boolean;
}

/**
 * Hook for auto-saving project data with debouncing and offline support
 */
export function useAutoSave({
  project,
  enabled = true,
  debounceMs = 2000,
  onSaveStart,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions): AutoSaveStatus {
  const updateMutation = useUpdateProject();
  const { isOnline, addPendingChange, removePendingChange } = useOfflineStore();
  const pendingDataRef = useRef<ProjectData | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  // Save function
  const save = useCallback(async () => {
    if (!project || !pendingDataRef.current) return;

    // If offline, save to local storage
    if (!isOnline) {
      addPendingChange(project.id, pendingDataRef.current);
      pendingDataRef.current = null;
      return;
    }

    try {
      onSaveStart?.();
      
      await updateMutation.mutateAsync({
        id: project.id,
        data: pendingDataRef.current,
      });

      if (isMountedRef.current) {
        setLastSaved(new Date());
        pendingDataRef.current = null;
        removePendingChange(project.id);
        onSaveSuccess?.();
      }
    } catch (error) {
      if (isMountedRef.current) {
        // If error, might be network issue - save offline
        if (!isOnline && pendingDataRef.current) {
          addPendingChange(project.id, pendingDataRef.current);
        }
        onSaveError?.(error as Error);
      }
    }
  }, [project, updateMutation, isOnline, addPendingChange, removePendingChange, onSaveStart, onSaveSuccess, onSaveError]);

  // Debounced save function
  const debouncedSave = useCallback(
    (data: ProjectData) => {
      if (!enabled || !project) return;

      pendingDataRef.current = data;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        save();
      }, debounceMs);
    },
    [enabled, project, save, debounceMs]
  );

  // Save immediately (without debounce)
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    await save();
  }, [save]);

  // Watch for project data changes
  useEffect(() => {
    if (!project || !enabled) return;

    // Note: In real implementation, you would attach this to your editor state
    // For now, it's just the setup for the auto-save mechanism

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [project, enabled, debouncedSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save on window beforeunload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingDataRef.current) {
        e.preventDefault();
        e.returnValue = '';
        saveNow();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, saveNow]);

  return {
    isSaving: updateMutation.isPending,
    lastSaved,
    error: updateMutation.error as Error | null,
    saveNow,
    isOffline: !isOnline,
  };
}

/**
 * Hook to manually trigger auto-save for project data updates
 */
export function useProjectAutoSave(project: Project | null) {
  const updateMutation = useUpdateProject();

  const updateProjectData = useCallback(
    async (data: ProjectData) => {
      if (!project) return;

      await updateMutation.mutateAsync({
        id: project.id,
        data,
      });
    },
    [project, updateMutation]
  );

  return {
    updateProjectData,
    isSaving: updateMutation.isPending,
    error: updateMutation.error,
  };
}

