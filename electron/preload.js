// electron/preload.js
// Expose a safe IPC bridge to the renderer.

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pc2", {
  // Theme
  getTheme: () => ipcRenderer.invoke("theme:get"),

  // Folder selection
  openDirDialog: () => ipcRenderer.invoke("dialog:openDir"),

  // Save files
  scanSaves: (customDir) => ipcRenderer.invoke("saves:scan", customDir),
  readSave: (filePath) => ipcRenderer.invoke("save:read", filePath),
  patchSave: (filePath, patch) =>
    ipcRenderer.invoke("save:patch", { filePath, patch }),
  bulkPatch: (filePaths, patch) =>
    ipcRenderer.invoke("save:bulkPatch", { filePaths, patch }),
  deleteSave: (filePath) => ipcRenderer.invoke("save:delete", { filePath }),

  // Backups
  listBackups: (filePath) => ipcRenderer.invoke("backups:list", { filePath }),
  restoreBackup: (filePath, backupPath) =>
    ipcRenderer.invoke("backups:restore", { filePath, backupPath }),

  // Shell
  revealInFolder: (fullPath) => ipcRenderer.invoke("shell:reveal", fullPath),

  // Survival Global Settings
  readGlobalSettings: (dataDir = null) =>
    ipcRenderer.invoke("globals:read", { dataDir }),
  writeGlobalSettings: (patch, dataDir = null) =>
    ipcRenderer.invoke("globals:write", { dataDir, patch }),
  deleteGlobalSettings: (dataDir = null) =>
    ipcRenderer.invoke("globals:delete", { dataDir }),
});
