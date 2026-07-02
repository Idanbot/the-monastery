import { useEffect, useRef } from 'react';
import { getTaskNotifications, sendBrowserNotification } from '../domain/notifications';
import type { Task } from '../domain/types';
import { apiPaths } from '../../shared/apiContracts';
import { apiRequest } from '../lib/api';

export const useTaskNotifications = ({
  enabled,
  webhookEnabled = false,
  tasks,
  now,
  onOpenTask
}: {
  enabled: boolean;
  webhookEnabled?: boolean;
  tasks: Task[];
  now: number;
  onOpenTask: (taskId: string) => void;
}) => {
  const sentKeys = useRef(new Set<string>());

  useEffect(() => {
    const browserReady =
      enabled && typeof Notification !== 'undefined' && Notification.permission === 'granted';
    if (!browserReady && !webhookEnabled) return;

    getTaskNotifications(tasks, now).forEach((candidate) => {
      const browserKey = `browser:${candidate.key}`;
      if (browserReady && !sentKeys.current.has(browserKey)) {
        const sent = sendBrowserNotification(
          candidate.title,
          { body: candidate.body, tag: candidate.key },
          () => onOpenTask(candidate.taskId)
        );
        if (sent) sentKeys.current.add(browserKey);
      }

      const webhookKey = `webhook:${candidate.key}`;
      if (webhookEnabled && !sentKeys.current.has(webhookKey)) {
        sentKeys.current.add(webhookKey);
        void apiRequest(apiPaths.integrationAlerts, {
          method: 'POST',
          body: JSON.stringify({ title: candidate.title, body: candidate.body })
        }).catch(() => sentKeys.current.delete(webhookKey));
      }
    });
  }, [enabled, webhookEnabled, now, onOpenTask, tasks]);
};
