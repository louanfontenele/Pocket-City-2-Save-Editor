// app/globalSettings.js
// Survival global file (survival_global_settings) is a gzip with a JSON-ish body.

const fs = require("fs");
const path = require("path");
const pako = require("pako");
const JSON5 = require("json5");
const { ensureDir, timestamp } = require("./util");
const { SURVIVAL_UPGRADES, GLOBAL_LIMITS } = require("./constants");

// ---- gzip helpers ----

/** Read a gzipped UTF-8 text file. */
function readGzipText(filePath) {
  const gz = fs.readFileSync(filePath);
  const ungz = pako.ungzip(gz);
  return {
    text: Buffer.from(ungz).toString("utf8"),
    innerName: "survival_global_settings.out",
  };
}

/** Write a gzipped UTF-8 text file (with stable inner name). */
function writeGzipText(filePath, text) {
  const gz = pako.gzip(Buffer.from(String(text), "utf8"), {
    name: "survival_global_settings.out",
  });
  fs.writeFileSync(filePath, Buffer.from(gz));
}

// ---- loose JSON helpers ----

/** Quote bare numeric keys so JSON5 can parse them. */
function quoteNumericKeysLoose(txt) {
  if (!txt) return txt;
  const noBom = txt.replace(/\uFEFF/g, "");
  return noBom.replace(/([{,]\s*)(\d+)\s*:/g, '$1"$2":');
}

/** Parse the loose JSON using JSON5. */
function parseLooseJson(text) {
  return JSON5.parse(quoteNumericKeysLoose(text));
}

// ---- paths / backups ----

/** Absolute path to the survival_global_settings file in a data dir. */
function globalSettingsPath(dataDir) {
  return path.join(dataDir, "survival_global_settings");
}

function backupFolderForGlobals(dataDir) {
  return path.join(dataDir, ".backups", "survival_global_settings");
}

function makeBackup(dataDir) {
  try {
    const fp = globalSettingsPath(dataDir);
    if (!fs.existsSync(fp)) return null;
    const dir = backupFolderForGlobals(dataDir);
    ensureDir(dir);
    const out = path.join(dir, `${timestamp()}.gz`);
    fs.copyFileSync(fp, out);
    return out;
  } catch {
    return null;
  }
}

// ---- limits / normalization ----

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, Number(n) || 0));

/** Clamp all editable fields according to hard limits. */
function clampEditable(p) {
  const out = {
    // best day (per difficulty)
    bestDayReachedEasy: clamp(
      p.bestDayReachedEasy ?? 100,
      0,
      GLOBAL_LIMITS.BEST_DAY_MAX
    ),
    bestDayReachedHard: clamp(
      p.bestDayReachedHard ?? 100,
      0,
      GLOBAL_LIMITS.BEST_DAY_MAX
    ),
    bestDayReachedExpert: clamp(
      p.bestDayReachedExpert ?? 100,
      0,
      GLOBAL_LIMITS.BEST_DAY_MAX
    ),

    // stars (per difficulty)
    highestStarsReachedEasy: clamp(
      p.highestStarsReachedEasy ?? 5,
      0,
      GLOBAL_LIMITS.STARS_MAX
    ),
    highestStarsReachedHard: clamp(
      p.highestStarsReachedHard ?? 5,
      0,
      GLOBAL_LIMITS.STARS_MAX
    ),
    highestStarsReachedExpert: clamp(
      p.highestStarsReachedExpert ?? 5,
      0,
      GLOBAL_LIMITS.STARS_MAX
    ),

    // population (per difficulty)
    highestPopulationReachedEasy: clamp(
      p.highestPopulationReachedEasy ?? 999_999,
      0,
      GLOBAL_LIMITS.POP_MAX
    ),
    highestPopulationReachedHard: clamp(
      p.highestPopulationReachedHard ?? 999_999,
      0,
      GLOBAL_LIMITS.POP_MAX
    ),
    highestPopulationReachedExpert: clamp(
      p.highestPopulationReachedExpert ?? 999_999,
      0,
      GLOBAL_LIMITS.POP_MAX
    ),

    // total upgrade points
    totalUpgradePoints: clamp(
      p.totalUpgradePoints ?? GLOBAL_LIMITS.TOTAL_UPGRADE_POINTS_MAX,
      0,
      GLOBAL_LIMITS.TOTAL_UPGRADE_POINTS_MAX
    ),

    // upgrades spent (per id)
    upgradesSpent: {},
  };

  const src =
    p.upgradesSpent && typeof p.upgradesSpent === "object"
      ? p.upgradesSpent
      : {};
  for (const [k, v] of Object.entries(src)) {
    const id = Number(k);
    const cap = SURVIVAL_UPGRADES[id]?.max ?? 0;
    if (cap > 0) out.upgradesSpent[id] = clamp(v, 0, cap);
  }
  return out;
}

/** Build the final JSON object (editable + preserved). */
function buildFinalObject(editable, preserved) {
  const v = {
    ...editable,
    // preserved (NEVER changed here)
    lastDifficultySelection:
      typeof preserved.lastDifficultySelection === "number"
        ? preserved.lastDifficultySelection
        : 2,
    disableUnspentUpgradeToCash:
      typeof preserved.disableUnspentUpgradeToCash === "boolean"
        ? preserved.disableUnspentUpgradeToCash
        : false,
  };
  return {
    SETTINGS: {
      __type: "SurvivalMode+SurvivalSettingsStateGlobal,Assembly-CSharp",
      value: v,
    },
  };
}

// ---- public API ----

/** Read current global settings (returns only editable fields for UI). */
async function readGlobalSettings(dataDir) {
  const filePath = globalSettingsPath(dataDir);
  if (!fs.existsSync(filePath)) {
    return {
      exists: false,
      filePath,
      readonly: false,
      snapshot: {
        editable: clampEditable({}),
      },
    };
  }

  const { text } = readGzipText(filePath);
  try {
    const obj = parseLooseJson(text);
    const v = obj?.SETTINGS?.value || {};
    const editable = clampEditable({
      ...v,
      upgradesSpent: Object.fromEntries(
        Object.entries(v.upgradesSpent || {}).map(([k, val]) => [
          Number(k),
          Number(val) || 0,
        ])
      ),
    });
    return { exists: true, filePath, readonly: false, snapshot: { editable } };
  } catch (e) {
    return {
      exists: true,
      filePath,
      readonly: true,
      error: String(e),
      snapshot: { editable: clampEditable({}) },
    };
  }
}

/** Create or update the file; only whitelisted fields in `patch` are honored. */
async function writeGlobalSettings(dataDir, patch, createIfMissing = true) {
  const filePath = globalSettingsPath(dataDir);
  const backupPath = makeBackup(dataDir);

  // read preserved fields from existing file (or defaults)
  let preserved = {
    lastDifficultySelection: 2,
    disableUnspentUpgradeToCash: false,
  };
  if (fs.existsSync(filePath)) {
    try {
      const { text } = readGzipText(filePath);
      const obj = parseLooseJson(text);
      const v = obj?.SETTINGS?.value || {};
      if (typeof v.lastDifficultySelection === "number")
        preserved.lastDifficultySelection = v.lastDifficultySelection;
      if (typeof v.disableUnspentUpgradeToCash === "boolean")
        preserved.disableUnspentUpgradeToCash = v.disableUnspentUpgradeToCash;
    } catch {
      // keep defaults if the file is corrupted
    }
  } else if (!createIfMissing) {
    return { ok: false, error: "File not found and createIfMissing=false" };
  }

  // clamp incoming editable fields and write
  const editable = clampEditable(patch || {});
  let text = JSON.stringify(buildFinalObject(editable, preserved), null, 2);
  // unquote numeric keys (game style) for upgradesSpent
  text = text.replace(/"(\d+)"\s*:/g, "$1:");

  writeGzipText(filePath, text);
  return { ok: true, filePath, backupPath };
}

/** Delete the global settings file (creates a backup first). */
async function deleteGlobalSettings(dataDir) {
  const filePath = globalSettingsPath(dataDir);
  if (!fs.existsSync(filePath)) return { ok: false, error: "File not found" };
  const backupPath = makeBackup(dataDir);
  fs.unlinkSync(filePath);
  return { ok: true, backupPath };
}

module.exports = {
  readGlobalSettings,
  writeGlobalSettings,
  deleteGlobalSettings,
  globalSettingsPath,
};
