/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

/**
 * Servicio de Cache Local usando IndexedDB
 * Evita reprocesar datasets ya cargados
 */

interface CachedDataset {
  filename: string;
  timestamp: number;
  candles: any[];
  metadata: {
    totalLines: number;
    validCandles: number;
    duplicates: number;
  };
}

const DB_NAME = 'carvipix_datasets';
const STORE_NAME = 'cached_datasets';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export class LocalDatasetCache {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = typeof window !== 'undefined' ? this.initDB() : Promise.reject(new Error('IndexedDB not available'));
  }

  private initDB(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
      return Promise.reject(new Error('IndexedDB not available'));
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'filename' });
        }
      };
    });
  }

  async get(filename: string): Promise<CachedDataset | null> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(filename);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const cached = request.result as CachedDataset | undefined;

          // Verificar si está expirado
          if (cached && Date.now() - cached.timestamp < CACHE_EXPIRY_MS) {
            resolve(cached);
          } else {
            resolve(null);
          }
        };
      });
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  async set(dataset: Omit<CachedDataset, 'timestamp'>): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({
          ...dataset,
          timestamp: Date.now(),
        } as CachedDataset);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.dbPromise;
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }
}

let instance: LocalDatasetCache | null = null;

export function getDatasetCache(): LocalDatasetCache {
  if (!instance) {
    instance = new LocalDatasetCache();
  }
  return instance;
}

export const datasetCache = {
  get: async (filename: string) => getDatasetCache().get(filename),
  set: async (dataset: Omit<CachedDataset, 'timestamp'>) => getDatasetCache().set(dataset),
  clear: async () => getDatasetCache().clear(),
};

