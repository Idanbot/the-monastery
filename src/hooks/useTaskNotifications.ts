import { useEffect, useRef } from 'react';
import { getTaskNotifications, sendBrowserNotification } from '../domain/notifications';
import type { Task } from '../domain/types';

export const useTaskNotifications = ({
  enabled,
  tasks,
  now,
  onOpenTask
}: {
  enabled: boolean;
  tasks: Task[];
  now: number;
  onOpenTask: (taskId: string) => void;
}) => {
  const sentKeys = useRef(new Set<string>());

  useEffect(() => {
    if (!enabled || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

    getTaskNotifications(tasks, now).forEach((candidate) => {
      if (sentKeys.current.has(candidate.key)) return;
      const sent = sendBrowserNotification(
        candidate.title,
        { body: candidate.body, tag: candidate.key },
        () => onOpenTask(candidate.taskId)
      );
      if (sent) sentKeys.current.add(candidate.key);
    });
  }, [enabled, now, onOpenTask, tasks]);
};
