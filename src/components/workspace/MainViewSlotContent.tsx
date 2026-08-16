import type { ComponentType } from 'react';
import { useSettingsContext } from '../../contexts/SettingsContext';
import { useTaskContext } from '../../contexts/TaskContext';
import { useUIContext } from '../../contexts/UIContext';
import { mainViewContentCompositions, type MainViewLeafContentId } from '../../domain/mainView';
import { sendBrowserNotification } from '../../domain/notifications';
import type { MainViewSlotContentId, MainViewSlotId } from '../../domain/types';
import { ActivityGraph } from '../dashboard/ActivityGraph';
import { AgendaTimeline } from '../timeline/AgendaTimeline';
import { ClockWidget } from '../ClockWidget';
import { CurrentTaskPin } from '../CurrentTaskPin';
import { MainCalendarModule } from './modules/MainCalendarModule';
import { MainFocusModule } from './modules/MainFocusModule';
import { MainMediaModule } from './modules/MainMediaModule';

type RendererId = MainViewLeafContentId | 'focus-current';
type RendererProps = { slot: MainViewSlotId; mediaSlot?: MainViewSlotId };

function FocusRenderer({ slot, showCurrent = false }: RendererProps & { showCurrent?: boolean }) {
  const { settings, setSettings } = useSettingsContext();
  const { currentTask, addTask, updateTaskTimer, completeTask, setSelectedTaskId, recordFocusSession } =
    useTaskContext();
  const { now, setMonkMode } = useUIContext();
  return (
    <MainFocusModule
      slot={slot}
      showCurrent={showCurrent}
      settings={settings}
      now={now}
      currentTask={currentTask}
      onOpenTask={setSelectedTaskId}
      onAddTask={() => addTask('backlog')}
      onToggleTimer={updateTaskTimer}
      onCompleteTask={completeTask}
      onEnterMonkMode={() => setMonkMode(true)}
      onUpdateDailyGoal={(dailyGoal) => setSettings((previous) => ({ ...previous, dailyGoal }))}
      onPomodoroComplete={(minutes) => {
        if (settings.notificationsEnabled) {
          sendBrowserNotification('Pomodoro complete', {
            body: 'Focus session complete. Time for a short break.',
            tag: 'pomodoro-complete'
          });
        }
        if (currentTask) recordFocusSession(currentTask.id, minutes);
      }}
    />
  );
}

function FocusCurrentRenderer(props: RendererProps) {
  return <FocusRenderer {...props} showCurrent />;
}

function ActivityRenderer({ slot }: RendererProps) {
  const { settings } = useSettingsContext();
  const { tasks } = useTaskContext();
  const { now } = useUIContext();
  return (
    <div data-testid="main-activity-module" data-slot={slot} className="h-full min-h-0">
      <ActivityGraph
        tasks={tasks}
        now={now}
        compact
        fill
        petId={settings.activityPetId}
        showPet={settings.activityPetVisible}
        animateFlame={settings.activityFlameAnimationEnabled && settings.animationsEnabled}
        animatePet={settings.animationsEnabled}
        clearedBefore={settings.activityClearedBefore}
      />
    </div>
  );
}

function CurrentRenderer() {
  const { currentTask, addTask, updateTaskTimer, completeTask, setSelectedTaskId } = useTaskContext();
  const { now } = useUIContext();
  return (
    <div className="custom-scrollbar min-h-0 overflow-y-auto">
      <CurrentTaskPin
        task={currentTask}
        now={now}
        onOpen={setSelectedTaskId}
        onAdd={() => addTask('backlog')}
        onToggleTimer={updateTaskTimer}
        onComplete={completeTask}
      />
    </div>
  );
}

function CalendarRenderer({ slot }: RendererProps) {
  const { tasks, setSelectedTaskId } = useTaskContext();
  const { now, setView } = useUIContext();
  return (
    <MainCalendarModule
      slot={slot}
      tasks={tasks}
      now={now}
      onOpenCalendar={() => setView('calendar')}
      onOpenTask={setSelectedTaskId}
    />
  );
}

function MediaRenderer({ slot, mediaSlot }: RendererProps) {
  const { settings } = useSettingsContext();
  const { isMediaPlayerActive, isMediaPlayerExpanded, openMediaPlayer } = useUIContext();
  return (
    <MainMediaModule
      slot={slot}
      url={settings.focusMediaUrl}
      active={isMediaPlayerActive}
      expanded={isMediaPlayerExpanded}
      isDockHost={slot === mediaSlot}
      onOpen={openMediaPlayer}
    />
  );
}

function TimelineRenderer({ slot }: RendererProps) {
  return (
    <div data-testid="main-timeline-module" data-slot={slot} className="h-full min-h-0">
      <AgendaTimeline />
    </div>
  );
}

function ClockRenderer({ slot }: RendererProps) {
  const { settings, openSettings } = useSettingsContext();
  const { now } = useUIContext();
  return (
    <div data-testid="main-clock-module" data-slot={slot} className="h-full min-h-0">
      <ClockWidget settings={settings} now={now} onOpenSettings={openSettings} fill />
    </div>
  );
}

const mainViewModuleRenderers: Record<RendererId, ComponentType<RendererProps>> = {
  focus: FocusRenderer,
  'focus-current': FocusCurrentRenderer,
  activity: ActivityRenderer,
  calendar: CalendarRenderer,
  media: MediaRenderer,
  clock: ClockRenderer,
  timeline: TimelineRenderer,
  current: CurrentRenderer
};

export function MainViewSlotContent({
  content,
  slot,
  mediaSlot
}: {
  content: MainViewSlotContentId | MainViewLeafContentId;
  slot: MainViewSlotId;
  mediaSlot?: MainViewSlotId;
}) {
  const composition = mainViewContentCompositions[content as MainViewSlotContentId];
  if (composition) {
    return (
      <div className="grid h-full min-h-0 gap-3" style={{ gridTemplateRows: composition.rowTemplate }}>
        {composition.children.map((child) => (
          <MainViewSlotContent key={child} content={child} slot={slot} mediaSlot={mediaSlot} />
        ))}
      </div>
    );
  }

  const Renderer = mainViewModuleRenderers[content as RendererId];
  return Renderer ? <Renderer slot={slot} mediaSlot={mediaSlot} /> : null;
}
