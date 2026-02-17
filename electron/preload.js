// Electron preload script
// Exposes IPC bridge to the renderer via contextBridge.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isElectron: true,

  // ---- Saves ----
  scanSaves: () => ipcRenderer.invoke("saves:scan"),
  readSave: (filePath) => ipcRenderer.invoke("saves:read", { filePath }),
  patchSave: (filePath, patch) =>
    ipcRenderer.invoke("saves:patch", { filePath, patch }),
  deleteSave: (filePath) => ipcRenderer.invoke("saves:delete", { filePath }),
  bulkPatchSaves: (action, scope, groupId) =>
    ipcRenderer.invoke("saves:bulkPatch", { action, scope, groupId }),

  // ---- Backups ----
  listBackups: (filePath) => ipcRenderer.invoke("backups:list", { filePath }),
  restoreBackup: (filePath, backupPath) =>
    ipcRenderer.invoke("backups:restore", { filePath, backupPath }),

  // ---- Global settings ----
  readGlobals: (dataDir) => ipcRenderer.invoke("globals:read", { dataDir }),
  writeGlobals: (dataDir, patch) =>
    ipcRenderer.invoke("globals:write", { dataDir, patch }),
  deleteGlobals: (dataDir) => ipcRenderer.invoke("globals:delete", { dataDir }),

  // ---- Directories ----
  collectDirs: () => ipcRenderer.invoke("dirs:collect"),
  defaultDirs: () => ipcRenderer.invoke("dirs:defaults"),

  // ---- File watcher events (push from main) ----
  onSavesChanged: (callback) => {
    const handler = () => callback();
    ipcRenderer.on("saves:changed", handler);
    return () => ipcRenderer.removeListener("saves:changed", handler);
  },
});
