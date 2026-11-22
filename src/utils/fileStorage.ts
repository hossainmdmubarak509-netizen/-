/**
 * Lightweight IndexedDB key-value store for large uploaded file data URLs (PDF, images, docs)
 * so file uploads persist reliably across reloads even when exceeding localStorage's ~5MB quota.
 */
const DB_NAME = 'bd_telecom_portal_files_db';
const STORE_NAME = 'file_blobs';

function openFileDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveFileBlob(key: string, dataUrl: string): Promise<void> {
  try {
    const db = await openFileDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(dataUrl, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore storage errors silently in restricted environments
  }
}

export async function getAllFileBlobs(): Promise<Record<string, string>> {
  try {
    const db = await openFileDb();
    const result = await new Promise<Record<string, string>>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const keysReq = store.getAllKeys();
      const valsReq = store.getAll();
      tx.oncomplete = () => {
        const map: Record<string, string> = {};
        const keys = keysReq.result || [];
        const vals = valsReq.result || [];
        for (let i = 0; i < keys.length; i++) {
          if (typeof vals[i] === 'string') {
            map[String(keys[i])] = vals[i];
          }
        }
        resolve(map);
      };
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return result;
  } catch {
    return {};
  }
}
