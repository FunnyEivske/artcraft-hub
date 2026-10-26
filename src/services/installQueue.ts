import { useState, useCallback, useEffect, useRef } from 'react';
import { AppReleaseInfo } from '../types';

export interface QueueItem {
  id: string;
  appId: string;
  app: AppReleaseInfo;
  targetType: 'native' | 'web';
  status: 'queued' | 'installing' | 'completed' | 'error';
  error?: string;
  enqueuedAt: number;
}

export interface UseInstallQueueOptions {
  onPerformInstall: (app: AppReleaseInfo, targetType: 'native' | 'web') => Promise<void>;
  onRefreshCatalog: () => Promise<void>;
  onShowToast: (msg: string, type: 'success' | 'info' | 'error') => void;
}

export const isHubApp = (appId: string): boolean => {
  return appId === 'openart-hub' || appId === 'artcraft-hub';
};

export function useInstallQueue({
  onPerformInstall,
  onRefreshCatalog,
  onShowToast,
}: UseInstallQueueOptions) {
  const [waitingQueue, setWaitingQueue] = useState<QueueItem[]>([]);
  const [activeItem, setActiveItem] = useState<QueueItem | null>(null);

  // Keep ref to avoid stale closures inside worker effect
  const isRunningRef = useRef(false);
  const onPerformInstallRef = useRef(onPerformInstall);
  const onRefreshCatalogRef = useRef(onRefreshCatalog);
  const onShowToastRef = useRef(onShowToast);

  onPerformInstallRef.current = onPerformInstall;
  onRefreshCatalogRef.current = onRefreshCatalog;
  onShowToastRef.current = onShowToast;

  // Enqueue a single app
  const enqueue = useCallback(
    (app: AppReleaseInfo, targetType: 'native' | 'web' = 'native') => {
      const isPriority = isHubApp(app.app_id);

      // Validate availability
      if (targetType === 'native' && !app.native_download_url && !isPriority) {
        onShowToastRef.current(`Installasjonspakken for «${app.app_name}» er ikke utgitt ennå.`, 'info');
        return;
      }

      setWaitingQueue((prev) => {
        // Prevent duplicate queuing
        if (activeItem?.appId === app.app_id || prev.some((item) => item.appId === app.app_id)) {
          onShowToastRef.current(`«${app.app_name}» er allerede i installasjonskøen.`, 'info');
          return prev;
        }

        const newItem: QueueItem = {
          id: `${app.app_id}-${Date.now()}`,
          appId: app.app_id,
          app,
          targetType,
          status: 'queued',
          enqueuedAt: Date.now(),
        };

        if (isPriority) {
          // OpenArt Hub ALWAYS takes priority: insert before first non-hub item in waiting line
          const firstNonHubIdx = prev.findIndex((i) => !isHubApp(i.appId));
          const nextQueue =
            firstNonHubIdx >= 0
              ? [...prev.slice(0, firstNonHubIdx), newItem, ...prev.slice(firstNonHubIdx)]
              : [...prev, newItem];

          if (activeItem || isRunningRef.current) {
            onShowToastRef.current(
              `OpenArt Hub har høyeste prioritet og er flyttet fremst i oppdateringskøen.`,
              'info'
            );
          } else {
            onShowToastRef.current(
              `Starter oppdatering av OpenArt Hub (høyeste prioritet)...`,
              'info'
            );
          }
          return nextQueue;
        }

        const nextQueue = [...prev, newItem];
        if (activeItem || isRunningRef.current) {
          onShowToastRef.current(
            `Lagt til i installasjonskø: ${app.app_name} (plass ${nextQueue.length})`,
            'info'
          );
        }

        return nextQueue;
      });
    },
    [activeItem]
  );

  // Enqueue multiple apps (e.g. Update All)
  const enqueueBatch = useCallback(
    (apps: AppReleaseInfo[], targetType: 'native' | 'web' = 'native') => {
      if (apps.length === 0) return;

      setWaitingQueue((prev) => {
        const existingIds = new Set<string>();
        if (activeItem) existingIds.add(activeItem.appId);
        prev.forEach((item) => existingIds.add(item.appId));

        const priorityToAdd: QueueItem[] = [];
        const regularToAdd: QueueItem[] = [];

        for (const app of apps) {
          if (existingIds.has(app.app_id)) continue;
          const isPriority = isHubApp(app.app_id);
          if (targetType === 'native' && !app.native_download_url && !isPriority) {
            continue;
          }

          existingIds.add(app.app_id);
          const item: QueueItem = {
            id: `${app.app_id}-${Date.now()}-${Math.random()}`,
            appId: app.app_id,
            app,
            targetType,
            status: 'queued',
            enqueuedAt: Date.now(),
          };

          if (isPriority) {
            priorityToAdd.push(item);
          } else {
            regularToAdd.push(item);
          }
        }

        const totalAdded = priorityToAdd.length + regularToAdd.length;
        if (totalAdded === 0) {
          onShowToastRef.current('Ingen nye apper å legge til i køen.', 'info');
          return prev;
        }

        // Always place Hub items ahead of regular items
        const firstNonHubIdx = prev.findIndex((i) => !isHubApp(i.appId));
        let updatedQueue: QueueItem[];

        if (priorityToAdd.length > 0) {
          if (firstNonHubIdx >= 0) {
            updatedQueue = [
              ...prev.slice(0, firstNonHubIdx),
              ...priorityToAdd,
              ...prev.slice(firstNonHubIdx),
              ...regularToAdd,
            ];
          } else {
            updatedQueue = [...prev, ...priorityToAdd, ...regularToAdd];
          }
          onShowToastRef.current(
            `Lagt til ${totalAdded} oppdateringer (OpenArt Hub prioritert først).`,
            'info'
          );
        } else {
          updatedQueue = [...prev, ...regularToAdd];
          onShowToastRef.current(
            `Lagt til ${totalAdded} ${totalAdded === 1 ? 'app' : 'apper'} i installasjonskøen.`,
            'info'
          );
        }

        return updatedQueue;
      });
    },
    [activeItem]
  );

  // Remove an item from the waiting queue
  const cancelQueued = useCallback((appId: string) => {
    setWaitingQueue((prev) => {
      const target = prev.find((i) => i.appId === appId);
      if (target) {
        onShowToastRef.current(`Fjernet «${target.app.app_name}» fra installasjonskøen.`, 'info');
      }
      return prev.filter((i) => i.appId !== appId);
    });
  }, []);

  // Queue position lookup (1-indexed for waiting items, 0 if not waiting)
  const getQueuePosition = useCallback(
    (appId: string): number => {
      const idx = waitingQueue.findIndex((i) => i.appId === appId);
      return idx >= 0 ? idx + 1 : 0;
    },
    [waitingQueue]
  );

  const isQueued = useCallback(
    (appId: string): boolean => {
      return waitingQueue.some((i) => i.appId === appId);
    },
    [waitingQueue]
  );

  const isActivelyInstalling = useCallback(
    (appId: string): boolean => {
      return activeItem?.appId === appId;
    },
    [activeItem]
  );

  // Sequential queue processor
  useEffect(() => {
    if (isRunningRef.current || activeItem !== null || waitingQueue.length === 0) {
      return;
    }

    const nextItem = waitingQueue[0];
    isRunningRef.current = true;
    setActiveItem({ ...nextItem, status: 'installing' });
    setWaitingQueue((prev) => prev.slice(1));

    (async () => {
      try {
        await onPerformInstallRef.current(nextItem.app, nextItem.targetType);
      } catch {
        // Errors are already toasted and handled in onPerformInstall
      } finally {
        try {
          await onRefreshCatalogRef.current();
        } catch {
          // ignore
        }
        isRunningRef.current = false;
        setActiveItem(null);
      }
    })();
  }, [activeItem, waitingQueue]);

  return {
    waitingQueue,
    activeItem,
    totalPending: (activeItem ? 1 : 0) + waitingQueue.length,
    enqueue,
    enqueueBatch,
    cancelQueued,
    getQueuePosition,
    isQueued,
    isActivelyInstalling,
  };
}
