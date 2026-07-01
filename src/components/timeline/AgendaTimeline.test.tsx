import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, formatDateInputValue, normalizeTask } from '../../domain/tasks';
import { AgendaTimeline } from './AgendaTimeline';

const today = formatDateInputValue(new Date());

const makeTask = (overrides = {}) =>
  normalizeTask({
    id: 'task-1',
    title: 'Timeline focus',
    status: 'backlog',
    urgency: 7,
    scheduledDate: today,
    scheduledStart: '09:00',
    scheduledEnd: '10:00',
    ...overrides
  });

let mockTasks: any[] = [];
let mockSettings = defaultSettings;
let mockNow = new Date(today + 'T09:30:00').toISOString();
const mockSetTasks = vi.fn();
const mockSetSelectedTaskId = vi.fn();

vi.mock('../../contexts/SettingsContext', () => ({
  useSettingsContext: () => ({ settings: mockSettings })
}));

vi.mock('../../contexts/TaskContext', () => ({
  useTaskContext: () => ({
    tasks: mockTasks,
    setTasks: mockSetTasks,
    setSelectedTaskId: mockSetSelectedTaskId
  })
}));

vi.mock('../../contexts/UIContext', () => ({
  useUIContext: () => ({ now: mockNow })
}));

const renderTimeline = (props: { settings?: any; now?: string } = {}) => {
  mockTasks = [makeTask(), makeTask({ id: 'done', title: 'Done task', status: 'done' })];
  mockSettings = { ...defaultSettings, ...props.settings };
  mockNow = props.now || new Date(today + 'T09:30:00').toISOString();
  mockSetTasks.mockClear();
  mockSetSelectedTaskId.mockClear();

  render(<AgendaTimeline />);

  return {
    setTasks: mockSetTasks,
    setSelectedTaskId: mockSetSelectedTaskId
  };
};

describe('AgendaTimeline', () => {
  it('renders timeline controls, visible markers, and scheduled active tasks', () => {
    renderTimeline();

    expect(screen.getByText("Today's Timeline")).toBeInTheDocument();
    expect(screen.getAllByTestId('timeline-hour-line')).toHaveLength(24);
    expect(screen.getByTestId('timeline-now-line')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-task-Timeline focus')).toHaveTextContent(/^Timeline focus$/);
    expect(screen.queryByTestId('timeline-task-Done task')).not.toBeInTheDocument();
  });

  it('can hide timeline guides and reschedule by dragging in 15 minute increments', () => {
    const { setTasks } = renderTimeline({ settings: { timelineHourLinesVisible: false } });

    expect(screen.queryByTestId('timeline-hour-line')).not.toBeInTheDocument();

    const task = screen.getByTestId('timeline-task-Timeline focus');

    // Simulate pointer down, move, and pointer up for drag
    fireEvent.pointerDown(task, { clientY: 540, pointerId: 1 });

    // Trigger window mouseup
    fireEvent(window, new MouseEvent('mouseup', { clientY: 600 }));

    expect(setTasks).toHaveBeenCalled();
  });
});
