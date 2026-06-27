import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { defaultSettings, formatDateInputValue, normalizeTask } from '../../domain/tasks';
import type { AppSettings } from '../../domain/types';
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

const renderTimeline = (props: { settings?: Partial<AppSettings>; now?: string } = {}) => {
  const setTasks = vi.fn();
  const setSelectedTaskId = vi.fn();
  const agendaContainerRef = createRef<HTMLDivElement>();
  const agendaScrollTopRef = { current: 0 };
  const timelineDragRef = { current: null };
  const suppressTimelineClickRef = { current: new Set() };
  render(
    <AgendaTimeline
      tasks={[makeTask(), makeTask({ id: 'done', title: 'Done task', status: 'done' })]}
      settings={{ ...defaultSettings, ...props.settings }}
      now={props.now || new Date(today + 'T09:30:00').toISOString()}
      setTasks={setTasks}
      setSelectedTaskId={setSelectedTaskId}
      agendaContainerRef={agendaContainerRef}
      agendaScrollTopRef={agendaScrollTopRef}
      timelineDragRef={timelineDragRef}
      suppressTimelineClickRef={suppressTimelineClickRef}
    />
  );
  return {
    setTasks,
    setSelectedTaskId,
    agendaContainerRef,
    agendaScrollTopRef,
    timelineDragRef,
    suppressTimelineClickRef
  };
};

describe('AgendaTimeline', () => {
  it('renders timeline controls, visible markers, and scheduled active tasks', () => {
    const { setSelectedTaskId, agendaContainerRef, agendaScrollTopRef } = renderTimeline();

    expect(screen.getByText("Today's Timeline")).toBeInTheDocument();
    expect(screen.getAllByTestId('timeline-hour-line')).toHaveLength(24);
    expect(screen.getByTestId('timeline-now-line')).toBeInTheDocument();
    expect(screen.getByTestId('timeline-task-Timeline focus')).toBeInTheDocument();
    expect(screen.queryByTestId('timeline-task-Done task')).not.toBeInTheDocument();

    const scrollTo = vi.fn();
    agendaContainerRef.current!.scrollTo = scrollTo;
    fireEvent.click(screen.getByLabelText(/locate current time/i));
    expect(scrollTo).toHaveBeenCalledWith({ top: 420, behavior: 'smooth' });

    fireEvent.scroll(agendaContainerRef.current!, { target: { scrollTop: 123 } });
    expect(agendaScrollTopRef.current).toBe(123);

    fireEvent.click(screen.getByTestId('timeline-task-Timeline focus'));
    expect(setSelectedTaskId).toHaveBeenCalledWith('task-1');
  });

  it('can hide timeline guides and reschedule by dragging in 15 minute increments', () => {
    const { setTasks, setSelectedTaskId, timelineDragRef, suppressTimelineClickRef } = renderTimeline({
      settings: { timelineHourLinesVisible: false, timelineNowLineVisible: false }
    });
    const task = screen.getByTestId('timeline-task-Timeline focus');

    expect(screen.queryByTestId('timeline-hour-line')).not.toBeInTheDocument();
    expect(screen.queryByTestId('timeline-now-line')).not.toBeInTheDocument();

    fireEvent.mouseDown(task, { clientY: 300 });
    expect(timelineDragRef.current).toMatchObject({ taskId: 'task-1', startTop: 540, duration: 60 });
    fireEvent.mouseUp(task, { clientY: 332 });

    expect(setTasks).toHaveBeenCalledWith(expect.any(Function));
    const updated = setTasks.mock.calls[0][0]([makeTask()]);
    expect(updated[0]).toMatchObject({ scheduledStart: '09:30', scheduledEnd: '10:30' });

    fireEvent.click(task);
    expect(setSelectedTaskId).not.toHaveBeenCalled();

    suppressTimelineClickRef.current.add('task-1');
    task.dataset.dragMoved = 'false';
    fireEvent.click(task);
    expect(suppressTimelineClickRef.current.has('task-1')).toBe(false);
  });
});
