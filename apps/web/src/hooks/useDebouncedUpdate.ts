// useDebouncedUpdate.ts - Debounced обновление проекта (2 сек задержка)
// Аналог поведения originals - сохранение через 2 секунды после изменения
import { useRef, useCallback, useEffect } from 'react';
import { useUpdateProject } from './useProjects';
import type { ProjectData } from './useProjects';

interface UseDebouncedUpdateOptions {
  projectId: string;
  delay?: number;
}

/**
 * Хук для debounced обновления проекта
 * Сохраняет изменения автоматически через delay мс после последнего изменения
 */
export function useDebouncedUpdate({ projectId, delay = 2000 }: UseDebouncedUpdateOptions) {
  const updateProjectMutation = useUpdateProject();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<ProjectData | null>(null);

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Debounced обновление данных проекта
   * Откладывает сохранение на delay мс, отменяя предыдущий таймер
   */
  const debouncedUpdate = useCallback(
    (data: ProjectData) => {
      // Сохраняем данные для последующей отправки
      pendingDataRef.current = data;

      // Отменяем предыдущий таймер
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Устанавливаем новый таймер
      timeoutRef.current = setTimeout(() => {
        if (pendingDataRef.current) {
          console.log(`Debounced save triggered after ${delay}ms`);
          updateProjectMutation.mutate({
            id: projectId,
            data: pendingDataRef.current,
          });
          pendingDataRef.current = null;
        }
      }, delay);
    },
    [projectId, delay, updateProjectMutation]
  );

  /**
   * Немедленное сохранение (без debounce)
   * Отменяет ожидающий таймер и сохраняет сразу
   */
  const saveNow = useCallback(async () => {
    // Отменяем таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Сохраняем немедленно
    if (pendingDataRef.current) {
      console.log('Immediate save triggered');
      await updateProjectMutation.mutateAsync({
        id: projectId,
        data: pendingDataRef.current,
      });
      pendingDataRef.current = null;
    }
  }, [projectId, updateProjectMutation]);

  return {
    debouncedUpdate,
    saveNow,
    isSaving: updateProjectMutation.isPending,
    error: updateProjectMutation.error,
  };
}

