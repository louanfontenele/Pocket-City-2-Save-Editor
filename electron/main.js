// Electron main process — Vite + IPC architecture
// No HTTP server needed. All filesystem operations run here via IPC.

const { app, BrowserWindow, shell, ipcMain } = require("electron");
const path = require("path");

const DEV_MODE = process.argv.includes("--dev");
const VITE_DEV_PORT = 5173;

// In packaged mode, app.getAppPath() points to resources/app/ (with asar disabled).
const ROOT_DIR = app.isPackaged ? app.getAppPath() : path.join(__dirname, "..");

let mainWindow = null;

// ─── Backend modules (pre-compiled by esbuild → backend.cjs) ─────────────────

let pc2Saves = null;
let pc2Dirs = null;
let saveWatcher = null;

async function loadBackendModules() {
  const backend = require(path.join(__dirname, "backend.cjs"));
  pc2Saves = backend.pc2Saves;
  pc2Dirs = backend.pc2Dirs;
  saveWatcher = backend.saveWatcher;
}

// ─── IPC data imports (for bulk-patch) ────────────────────────────────────────

let dataModules = null;

function getDataModules() {
  if (!dataModules) {
    const backend = require(path.join(__dirname, "backend.cjs"));
    dataModules = {
      resources: backend.resources,
      npcs: backend.npcs,
      cars: backend.cars,
    };
  }
  return dataModules;
}

// ─── Splash HTML ──────────────────────────────────────────────────────────────

const SPLASH_HTML = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #09090b;
    color: #fafafa;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    overflow: hidden;
    -webkit-app-region: drag;
    user-select: none;
  }
  .logo {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    margin-bottom: 32px;
    background: linear-gradient(135deg, #a78bfa, #6d28d9);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #27272a;
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin-bottom: 24px;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .status {
    font-size: 13px;
    color: #71717a;
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: .6; } 50% { opacity: 1; } }
</style>
</head>
<body>
  <div class="logo">Pocket City Save Editor</div>
  <div class="spinner"></div>
  <div class="status">Iniciando...</div>
</body>
</html>
`;

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: "Pocket City Save Editor",
    autoHideMenuBar: true,
    show: false,
    backgroundColor: "#09090b",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http")) shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function showSplash() {
  mainWindow.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(SPLASH_HTML)}`,
  );
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

function loadApp() {
  if (DEV_MODE) {
    mainWindow.loadURL(`http://localhost:${VITE_DEV_PORT}`);
  } else {
    mainWindow.loadFile(path.join(ROOT_DIR, "dist", "index.html"));
  }
}

// ─── IPC Handlers ─────────────────────────────────────────────────────────────

function registerIpcHandlers() {
  // ---- Saves ----

  ipcMain.handle("saves:scan", async () => {
    try {
      const dirs = await pc2Dirs.collectExistingDirs();
      await saveWatcher.ensureSaveWatchers(dirs);
      const saves = await pc2Saves.scanAllSavesCached(dirs);
      return { ok: true, data: saves };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("saves:read", async (_event, { filePath }) => {
    try {
      const snapshot = await pc2Saves.readSaveSnapshot(filePath);
      return { ok: true, data: snapshot };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("saves:patch", async (_event, { filePath, patch }) => {
    try {
      const result = await pc2Saves.writeSaveFromPatch(filePath, patch);
      return result;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("saves:delete", async (_event, { filePath }) => {
    try {
      const backup = await pc2Saves
        .createSaveBackup(filePath)
        .catch(() => null);
      await pc2Saves.deleteSave(filePath);
      return { ok: true, backupPath: backup?.backupPath };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle(
    "saves:bulkPatch",
    async (_event, { action, scope, groupId }) => {
      try {
        const { RESOURCE_IDS } = getDataModules().resources;
        const { KNOWN_NPC_IDS } = getDataModules().npcs;
        const { CAR_MAX_ID_DEFAULT } = getDataModules().cars;

        const dirs = await pc2Dirs.collectExistingDirs();
        let saves = await pc2Saves.scanAllSavesCached(dirs);

        if (scope === "group" && groupId) {
          saves = saves.filter(
            (s) =>
              s.meta.FILE_ID === groupId ||
              s.meta.parentCity === groupId ||
              s.groupId === groupId,
          );
        }

        let applied = 0;
        let skipped = 0;
        const errors = [];

        for (const save of saves) {
          const isSurvival = save.meta.isSurvivalMode;
          let patch = null;

          switch (action) {
            case "setMax":
              patch = {
                money: 1_000_000_000_000,
                researchPoints: 999_999,
                mapSize: 88,
                resources: RESOURCE_IDS.map((id) => ({
                  id,
                  amount: 999_999,
                })),
                relationships: KNOWN_NPC_IDS.map((id) => ({
                  id,
                  level: 50,
                })),
                unlockedCars: Array.from(
                  { length: CAR_MAX_ID_DEFAULT + 1 },
                  (_, id) => ({ id, unlocked: true }),
                ),
              };
              if (!isSurvival) patch.level = 1000;
              break;
            case "resetDay":
              patch = { day: 1, dayProgress: 0 };
              break;
            case "setDay100":
              patch = { day: 100, dayProgress: 0 };
              break;
            case "enableSandbox":
              if (isSurvival) {
                skipped++;
                continue;
              }
              patch = { sandbox: true };
              break;
            case "disableSandbox":
              if (isSurvival) {
                skipped++;
                continue;
              }
              patch = { sandbox: false };
              break;
            default:
              return { ok: false, error: `Unknown action: ${action}` };
          }

          try {
            await pc2Saves.writeSaveFromPatch(save.filePath, patch);
            applied++;
          } catch (err) {
            errors.push(`${save.fileName}: ${err.message}`);
          }
        }

        return {
          ok: true,
          applied,
          skipped,
          total: saves.length,
          errors: errors.length > 0 ? errors : undefined,
        };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },
  );

  // ---- Backups ----

  ipcMain.handle("backups:list", async (_event, { filePath }) => {
    try {
      const backups = await pc2Saves.listSaveBackups(filePath);
      return { ok: true, data: backups };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle(
    "backups:restore",
    async (_event, { filePath, backupPath }) => {
      try {
        await pc2Saves.restoreSaveBackup(filePath, backupPath);
        return { ok: true };
      } catch (err) {
        return { ok: false, error: err.message };
      }
    },
  );

  // ---- Global settings ----

  ipcMain.handle("globals:read", async (_event, { dataDir }) => {
    try {
      const result = await pc2Saves.readGlobalSettings(dataDir);
      // Spread result so component can access exists/readonly/snapshot directly
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("globals:write", async (_event, { dataDir, patch }) => {
    try {
      const result = await pc2Saves.writeGlobalSettings(dataDir, patch);
      return result;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("globals:delete", async (_event, { dataDir }) => {
    try {
      const result = await pc2Saves.deleteGlobalSettings(dataDir);
      return result;
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  // ---- Directories ----

  ipcMain.handle("dirs:collect", async () => {
    try {
      const dirs = await pc2Dirs.collectExistingDirs();
      return { ok: true, data: dirs };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle("dirs:defaults", () => {
    try {
      const dirs = pc2Dirs.defaultPC2Dirs();
      return { ok: true, data: dirs };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}

// ─── File watcher → renderer push ────────────────────────────────────────────

function setupFileWatcher() {
  saveWatcher.onSaveChange(() => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("saves:changed");
    }
  });
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.on("ready", async () => {
  try {
    createWindow();
    showSplash();

    await loadBackendModules();
    registerIpcHandlers();

    // Start watching for file changes
    const dirs = await pc2Dirs.collectExistingDirs();
    await saveWatcher.ensureSaveWatchers(dirs);
    setupFileWatcher();

    loadApp();
  } catch (err) {
    console.error("Failed to start:", err);
    app.quit();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
