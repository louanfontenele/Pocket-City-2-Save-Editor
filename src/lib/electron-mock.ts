/**
 * Mock electronAPI for browser-only development (pnpm dev).
 * Returns empty/dummy data so the UI loads without crashing.
 * This is injected only when window.electronAPI is not available.
 */

const noop = () => Promise.resolve({ ok: true, data: [] });

export function injectElectronMock() {
  if (typeof window !== "undefined" && !window.electronAPI) {
    console.warn(
      "[dev] window.electronAPI not found — injecting mock for browser dev mode",
    );
    window.electronAPI = {
      platform: "browser",
      isElectron: true as const,
      scanSaves: noop,
      readSave: () => Promise.resolve({ ok: false, error: "Browser mock" }),
      patchSave: () => Promise.resolve({ ok: false, error: "Browser mock" }),
      deleteSave: () => Promise.resolve({ ok: false, error: "Browser mock" }),
      bulkPatchSaves: () =>
        Promise.resolve({ ok: false, error: "Browser mock" }),
      listBackups: () => Promise.resolve({ ok: true, data: [] }),
      restoreBackup: () =>
        Promise.resolve({ ok: false, error: "Browser mock" }),
      readGlobals: () =>
        Promise.resolve({
          ok: true,
          exists: false,
          readonly: false,
          snapshot: { editable: {} },
        }),
      writeGlobals: () => Promise.resolve({ ok: false, error: "Browser mock" }),
      deleteGlobals: () =>
        Promise.resolve({ ok: false, error: "Browser mock" }),
      collectDirs: () => Promise.resolve({ ok: true, data: [] }),
      defaultDirs: () => Promise.resolve({ ok: true, data: [] }),
      onSavesChanged: () => () => {},
    };
  }
}
