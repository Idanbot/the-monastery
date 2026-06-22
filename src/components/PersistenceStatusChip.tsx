import { getPersistenceStatusPresentation, type PersistenceStatus } from '../domain/persistenceStatus';

export function PersistenceStatusChip({
  status,
  lastSavedAt
}: {
  status: PersistenceStatus;
  lastSavedAt: Date | null;
}) {
  const presentation = getPersistenceStatusPresentation(status, lastSavedAt);

  return (
    <div
      data-testid="persistence-status"
      data-persistence-state={status}
      aria-live="polite"
      title={presentation.title}
      className={'hidden lg:block rounded-full px-2 py-1 text-[10px] font-semibold ' + presentation.className}
    >
      {presentation.label}
    </div>
  );
}
