import { getPersistenceStatusPresentation, type PersistenceStatus } from '../domain/persistenceStatus';

export function PersistenceStatusChip({
  status,
  lastSavedAt,
  errorMessage = ''
}: {
  status: PersistenceStatus;
  lastSavedAt: Date | null;
  errorMessage?: string;
}) {
  const presentation = getPersistenceStatusPresentation(status, lastSavedAt);
  const title = errorMessage ? presentation.title + ' Error: ' + errorMessage : presentation.title;

  return (
    <div
      data-testid="persistence-status"
      data-persistence-state={status}
      aria-live="polite"
      title={title}
      className={
        'hidden 2xl:block rounded-full px-2 py-1 text-[10px] font-semibold ' + presentation.className
      }
    >
      {status === 'error' && errorMessage ? 'Save failed: ' + errorMessage : presentation.label}
    </div>
  );
}
