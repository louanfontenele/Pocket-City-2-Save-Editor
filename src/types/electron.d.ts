/** Type declarations for the Electron IPC bridge exposed via preload.js */

export interface ElectronAPI {
  platform: string;
  isElectron: true;

  // Saves
  scanSaves: () => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  readSave: (
    filePath: string,
  ) => Promise<{ ok: boolean; data?: any; error?: string }>;
  patchSave: (
    filePath: string,
    patch: any,
  ) => Promise<{ ok: boolean; error?: string; tolerant?: boolean }>;
  deleteSave: (
    filePath: string,
  ) => Promise<{ ok: boolean; backupPath?: string; error?: string }>;
  bulkPatchSaves: (
    action: string,
    scope?: string,
    groupId?: string,
  ) => Promise<{
    ok: boolean;
    applied?: number;
    skipped?: number;
    total?: number;
    errors?: string[];
    error?: string;
  }>;

  // Backups
  listBackups: (
    filePath: string,
  ) => Promise<{ ok: boolean; data?: any[]; error?: string }>;
  restoreBackup: (
    filePath: string,
    backupPath: string,
  ) => Promise<{ ok: boolean; error?: string }>;

  // Global settings
  readGlobals: (dataDir: string) => Promise<{
    ok: boolean;
    exists?: boolean;
    filePath?: string;
    readonly?: boolean;
    snapshot?: { editable: any };
    error?: string;
  }>;
  writeGlobals: (
    dataDir: string,
    patch: any,
  ) => Promise<{ ok: boolean; error?: string; tolerant?: boolean }>;
  deleteGlobals: (dataDir: string) => Promise<{ ok: boolean; error?: string }>;

  // Directories
  collectDirs: () => Promise<{ ok: boolean; data?: string[]; error?: string }>;
  defaultDirs: () => Promise<{ ok: boolean; data?: string[]; error?: string }>;

  // File watcher events
  onSavesChanged: (callback: () => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
