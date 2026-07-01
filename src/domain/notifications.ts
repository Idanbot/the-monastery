import type { Task } from './types';

export type TaskNotification = {
  key: string;
  taskId: string;
  title: string;
  body: string;
};

const scheduledDateTime = (date: string, time: string) => {
  const value = new Date(`${date}T${time}:00`).getTime();
  return Number.isFinite(value) ? value : null;
};

export const getTaskNotifications = (tasks: Task[], now: number): TaskNotification[] =>
  tasks.flatMap((task) => {
    if (task.status === 'done' || task.status === 'rejected') return [];
    const notifications: TaskNotification[] = [];
    const taskTitle = task.title || 'Untitled task';

    if (task.scheduledDate && task.scheduledStart) {
      const start = scheduledDateTime(task.scheduledDate, task.scheduledStart);
      if (start !== null && now >= start && now < start + 60_000) {
        notifications.push({
          key: `start:${task.id}:${task.scheduledDate}:${task.scheduledStart}`,
          taskId: task.id,
          title: 'Task starting now',
          body: taskTitle
        });
      }
    }

    if (task.scheduledDate && task.scheduledEnd) {
      const end = scheduledDateTime(task.scheduledDate, task.scheduledEnd);
      if (end !== null && now >= end) {
        notifications.push({
          key: `overdue:${task.id}:${task.scheduledDate}:${task.scheduledEnd}`,
          taskId: task.id,
          title: 'Task overdue',
          body: taskTitle
        });
      }
    }

    if (task.activeLogStart) {
      const timerStart = new Date(task.activeLogStart).getTime();
      if (Number.isFinite(timerStart) && now - timerStart >= 60 * 60_000) {
        notifications.push({
          key: `timer:${task.id}:${task.activeLogStart}:60`,
          taskId: task.id,
          title: 'Timer running for one hour',
          body: taskTitle
        });
      }
    }

    return notifications;
  });

export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
};

export const sendBrowserNotification = (
  title: string,
  options: NotificationOptions = {},
  onClick?: () => void
) => {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const notification = new Notification(title, options);
  if (onClick) {
    notification.onclick = () => {
      window.focus();
      onClick();
      notification.close();
    };
  }
  return true;
};
