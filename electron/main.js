// electron/main.js
// Main process: window creation + IPC bridge for saves and global settings.

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  nativeTheme,
  shell,
} = require("electron");
const path = require("path");
const os = require("os");

const {
  scanAllSaves,
  readSaveParsed,
  writeSaveFromPatch,
  listBackups,
  restoreBackup,
  deleteSave,
} = require("../app/saveStore");
const {
  readGlobalSettings,
  writeGlobalSettings,
  deleteGlobalSettings,
} = require("../app/globalSettings");
const { DEFAULT_DIRS } = require("../app/constants");

let mainWindow;
let lastDataDir = null; // remember last scanned folder (used by globals tab)

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 860,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Pocket City 2 — Save Editor (alpha)",
  });

  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// --- IPC bridge ---

ipcMain.handle("theme:get", () => ({
  shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
}));

ipcMain.handle("dialog:openDir", async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: "Select Pocket City 2 save folder",
    properties: ["openDirectory"],
  });
  if (res.canceled || !res.filePaths?.[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle("saves:scan", async (_e, customDir = null) => {
  const startDirs = customDir ? [customDir] : getDefaultDirs();
  // Remember the first target dir for globals page usage
  lastDataDir = startDirs[0] || null;
  return await scanAllSaves(startDirs);
});

ipcMain.handle("save:read", async (_e, filePath) => {
  return await readSaveParsed(filePath);
});

ipcMain.handle("save:patch", async (_e, { filePath, patch }) => {
  return await writeSaveFromPatch(filePath, patch);
});

ipcMain.handle("save:bulkPatch", async (_e, { filePaths, patch }) => {
  let ok = 0,
    fail = 0;
  for (const fp of filePaths) {
    try {
      const res = await writeSaveFromPatch(fp, patch);
      if (res?.ok) ok++;
      else fail++;
    } catch {
      fail++;
    }
  }
  return { ok, fail, total: filePaths.length };
});

ipcMain.handle("save:delete", async (_e, { filePath }) => {
  return await deleteSave(filePath);
});

ipcMain.handle("backups:list", async (_e, { filePath }) => {
  return await listBackups(filePath);
});

ipcMain.handle("backups:restore", async (_e, { filePath, backupPath }) => {
  return await restoreBackup(filePath, backupPath);
});

ipcMain.handle("shell:reveal", async (_e, fullPath) => {
  shell.showItemInFolder(fullPath);
  return true;
});

// --- Survival Global Settings IPC ---

ipcMain.handle("globals:read", async (_e, { dataDir = null } = {}) => {
  const dir = dataDir || lastDataDir || getDefaultDirs()[0] || null;
  if (!dir) return { exists: false, error: "No data directory detected." };
  return await readGlobalSettings(dir);
});

ipcMain.handle("globals:write", async (_e, { dataDir = null, patch } = {}) => {
  const dir = dataDir || lastDataDir || getDefaultDirs()[0] || null;
  if (!dir) return { ok: false, error: "No data directory detected." };
  return await writeGlobalSettings(dir, patch, true);
});

ipcMain.handle("globals:delete", async (_e, { dataDir = null } = {}) => {
  const dir = dataDir || lastDataDir || getDefaultDirs()[0] || null;
  if (!dir) return { ok: false, error: "No data directory detected." };
  return await deleteGlobalSettings(dir);
});

// Helpers
function getDefaultDirs() {
  const homedir = os.homedir();
  return DEFAULT_DIRS(homedir, process.platform);
}
