export const tasksStorageKey = 'the-monastery_tasks_v1';
export const settingsStorageKey = 'the-monastery_settings_v1';
export const activeProfileStorageKey = 'the-monastery_active_profile_id_v1';
export const backupHistoryStorageKey = 'the-monastery_backup_history_v1';

const theMonasteryDbName = 'the-monastery_app';
const theMonasteryStoreName = 'kv';
const theMonasteryDbVersion = 1;

export const hasIndexedDb = () => typeof window !== 'undefined' && 'indexedDB' in window;

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

export const getIndexedDbValue = async (key) => {
  const db = await openTheMonasteryDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(theMonasteryStoreName, 'readonly');
    const request = transaction.objectStore(theMonasteryStoreName).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => db.close();
  });
};

export const setIndexedDbValue = async (key, value) => {
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

export const parseStoredJson = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
};
