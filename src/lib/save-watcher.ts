import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import { invalidateSaveCache } from "./pc2-saves";

const emitter = new EventEmitter();
emitter.setMaxListeners(50); // prevent silent leak warnings
const watchers = new Map<string, fs.FSWatcher>();
let debounceTimer: NodeJS.Timeout | null = null;

function scheduleChange(): void {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    invalidateSaveCache();
    emitter.emit("change");
  }, 200);
}

function handleWatcherEvent(
  eventType: string,
  filename: string | Buffer | undefined,
): void {
  if (typeof filename === "string") {
    const lower = filename.toLowerCase();
    if (!lower.endsWith(".es3")) return;
  }
  scheduleChange();
}

function attachWatcher(dir: string): void {
  if (watchers.has(dir)) return;
  try {
    const watcher = fs.watch(
      dir,
      { persistent: false },
      (eventType, filename) => {
        handleWatcherEvent(eventType, filename ?? undefined);
      },
    );
    watcher.on("error", () => {
      watcher.close();
      watchers.delete(dir);
    });
    watchers.set(dir, watcher);
  } catch {
    // ignore directories that cannot be watched
  }
}

export async function ensureSaveWatchers(dirs: string[]): Promise<void> {
  const unique = Array.from(new Set(dirs.filter(Boolean)));
  for (const dir of unique) {
    attachWatcher(dir);
  }
  for (const [dir, watcher] of watchers.entries()) {
    if (!unique.includes(dir)) {
      watcher.close();
      watchers.delete(dir);
    }
  }
}

export function onSaveChange(listener: () => void): () => void {
  emitter.on("change", listener);
  return () => {
    emitter.off("change", listener);
  };
}
