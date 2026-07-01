export const tasksStorageKey = 'the-monastery_tasks_v1';
export const settingsStorageKey = 'the-monastery_settings_v1';
export const activeProfileStorageKey = 'the-monastery_active_profile_id_v1';
export const backupHistoryStorageKey = 'the-monastery_backup_history_v1';

const theMonasteryDbName = 'the-monastery_app';
const theMonasteryStoreName = 'kv';
const theMonasteryDbVersion = 1;

export const hasIndexedDb = (): boolean => typeof window !== 'undefined' && 'indexedDB' in window;

const openTheMonasteryDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(theMonasteryDbName, theMonasteryDbVersion);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(theMonasteryStoreName)) {
        db.createObjectStore(theMonasteryStoreName);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const getIndexedDbValue = async <T = unknown>(key: string): Promise<T | undefined> => {
  const db = await openTheMonasteryDb();
  return new Promise<T | undefined>((resolve, reject) => {
    const transaction = db.transaction(theMonasteryStoreName, 'readonly');
    const request = transaction.objectStore(theMonasteryStoreName).get(key);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
};

export const setIndexedDbValue = async <T = unknown>(key: string, value: T): Promise<void> => {
  const db = await openTheMonasteryDb();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(theMonasteryStoreName, 'readwrite');
    const request = transaction.objectStore(theMonasteryStoreName).put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
};

/**
 * Read and JSON-parse a localStorage value, returning `fallback` on any error.
 * The write companion (`writeStoredJson`) swallows `QuotaExceededError` so a
 * full localStorage never crashes the app — the IndexedDB mirror keeps a copy.
 */
export const parseStoredJson = <T>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStoredJson = (key: string, value: unknown): boolean => {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // QuotaExceededError or private-mode restrictions: the IndexedDB mirror
    // in useLocalFallbackPersistence still holds the data.
    return false;
  }
};
