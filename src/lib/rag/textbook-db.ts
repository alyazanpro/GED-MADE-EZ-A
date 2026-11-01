"use client";

import type { TextbookChunk } from "./types";

const DB_NAME = "ged-textbook-rag";
const DB_VERSION = 1;
const STORE = "chunks";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("userBook", ["userId", "bookId"], { unique: false });
        store.createIndex("userSubject", ["userId", "subjectId"], { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open failed"));
  });
}

function chunkId(userId: string, bookId: string, chunkIndex: number) {
  return `${userId}::${bookId}::${chunkIndex}`;
}

export async function putChunks(chunks: TextbookChunk[]): Promise<void> {
  if (!chunks.length) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const c of chunks) store.put(c);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to store chunks"));
  });
  db.close();
}

export async function deleteChunksForBook(userId: string, bookId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const index = store.index("userBook");
    const req = index.openCursor(IDBKeyRange.only([userId, bookId]));
    req.onsuccess = () => {
      const cursor = req.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("Failed to delete chunks"));
  });
  db.close();
}

export async function getChunksForUser(
  userId: string,
  opts?: { subjectId?: string; bookIds?: string[] }
): Promise<TextbookChunk[]> {
  const db = await openDb();
  const chunks = await new Promise<TextbookChunk[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const index = store.index("userId");
    const req = index.getAll(IDBKeyRange.only(userId));
    req.onsuccess = () => resolve((req.result || []) as TextbookChunk[]);
    req.onerror = () => reject(req.error || new Error("Failed to read chunks"));
  });
  db.close();

  let filtered = chunks;
  if (opts?.subjectId) {
    filtered = filtered.filter((c) => c.subjectId === opts.subjectId);
  }
  if (opts?.bookIds?.length) {
    const set = new Set(opts.bookIds);
    filtered = filtered.filter((c) => set.has(c.bookId));
  }
  return filtered;
}

export async function countReadyBooks(userId: string): Promise<{ books: number; chunks: number }> {
  const chunks = await getChunksForUser(userId);
  const books = new Set(chunks.map((c) => c.bookId));
  return { books: books.size, chunks: chunks.length };
}

export { chunkId };
