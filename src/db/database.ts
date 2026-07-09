import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Category, Settings, Sound } from '../types';

/**
 * Offline-first persistence.
 *
 * Metadata (sounds, categories, settings) lives in structured stores; the raw
 * audio bytes live in a dedicated `blobs` store keyed by `blobKey` so large
 * binaries never bloat the metadata reads that drive the UI.
 */
interface SoundboardDB extends DBSchema {
  sounds: { key: string; value: Sound };
  categories: { key: string; value: Category };
  blobs: { key: string; value: ArrayBuffer };
  meta: { key: string; value: unknown };
}

const DB_NAME = 'soundboard';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<SoundboardDB>> | null = null;

function db(): Promise<IDBPDatabase<SoundboardDB>> {
  if (!dbPromise) {
    dbPromise = openDB<SoundboardDB>(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains('sounds'))
          database.createObjectStore('sounds', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('categories'))
          database.createObjectStore('categories', { keyPath: 'id' });
        if (!database.objectStoreNames.contains('blobs'))
          database.createObjectStore('blobs');
        if (!database.objectStoreNames.contains('meta'))
          database.createObjectStore('meta');
      },
    });
  }
  return dbPromise;
}

export const storage = {
  async getSounds(): Promise<Sound[]> {
    return (await db()).getAll('sounds');
  },
  async putSound(sound: Sound): Promise<void> {
    await (await db()).put('sounds', sound);
  },
  async deleteSound(id: string): Promise<void> {
    await (await db()).delete('sounds', id);
  },

  async getCategories(): Promise<Category[]> {
    return (await db()).getAll('categories');
  },
  async putCategory(category: Category): Promise<void> {
    await (await db()).put('categories', category);
  },
  async deleteCategory(id: string): Promise<void> {
    await (await db()).delete('categories', id);
  },

  async getBlob(key: string): Promise<ArrayBuffer | undefined> {
    return (await db()).get('blobs', key);
  },
  async putBlob(key: string, data: ArrayBuffer): Promise<void> {
    await (await db()).put('blobs', data, key);
  },
  async deleteBlob(key: string): Promise<void> {
    await (await db()).delete('blobs', key);
  },

  async getSettings(): Promise<Settings | undefined> {
    return (await db()).get('meta', 'settings') as Promise<Settings | undefined>;
  },
  async putSettings(settings: Settings): Promise<void> {
    await (await db()).put('meta', settings, 'settings');
  },

  async getFlag(key: string): Promise<boolean> {
    return Boolean(await (await db()).get('meta', key));
  },
  async setFlag(key: string, value: boolean): Promise<void> {
    await (await db()).put('meta', value, key);
  },

  async getMeta<T>(key: string): Promise<T | undefined> {
    return (await db()).get('meta', key) as Promise<T | undefined>;
  },
  async setMeta<T>(key: string, value: T): Promise<void> {
    await (await db()).put('meta', value, key);
  },

  async clearAll(): Promise<void> {
    const database = await db();
    await Promise.all([
      database.clear('sounds'),
      database.clear('categories'),
      database.clear('blobs'),
    ]);
  },
};
