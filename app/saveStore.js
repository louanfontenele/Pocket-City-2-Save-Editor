// app/saveStore.js
// Save scanning, parsing and writing utilities for PC2 .es3 files.

const fs = require("fs");
const path = require("path");
const { readEs3, parseLooseJson, writeEs3 } = require("./es3");
const {
  ensureDir,
  timestamp,
  isAutoOrManual,
  backupFolderFor,
  rotateBackups,
} = require("./util");
const { RESOURCE_MAP, NPC_NAMES } = require("./constants");

const ES3_EXT = ".es3";

/** Best-effort scalar extractor when JSON5 parse fails (read-only). */
function tryExtractScalar(text, key, def = "") {
  // Matches: key: "value" OR "key": "value" OR key: 123 OR "key": 123
  const r = new RegExp(
    `(?:["']?${key}["']?\\s*:\\s*)(?:"([^"\\n\\r]*)"|([\\-\\d\\.]+))`
  );
  const m = text.match(r);
  if (!m) return def;
  return m[1] !== undefined ? m[1] : Number(m[2]);
}

/** Best-effort boolean extractor (true/false) from loose JSON text. */
function tryExtractBool(text, key, def = false) {
  const r = new RegExp(`["']?${key}["']?\\s*:\\s*(true|false)`, "i");
  const m = text.match(r);
  return m ? m[1].toLowerCase() === "true" : def;
}

/** Extract resources map from raw text when JSON5 fails. */
function tryExtractResources(text) {
  const out = [];
  const block = text.match(/["']?resources["']?\s*:\s*\{([\s\S]*?)\}/);
  if (!block) return out;
  const body = block[1];
  let m;
  const re = /(\d+)\s*:\s*([0-9]+)/g;
  while ((m = re.exec(body))) {
    const id = Number(m[1]);
    const amt = Number(m[2]);
    out.push({ id, name: RESOURCE_MAP[id] || `#${id}`, amount: amt });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Extract relationships map from raw text when JSON5 fails. */
function tryExtractRelationships(text) {
  const out = [];
  const block = text.match(/["']?relationships["']?\s*:\s*\{([\s\S]*?)\}/);
  if (!block) return out;
  const body = block[1];
  let m;
  const re = /(\d+)\s*:\s*([0-9]+)/g;
  while ((m = re.exec(body))) {
    const id = Number(m[1]);
    const lvl = Number(m[2]);
    out.push({ id, name: NPC_NAMES[id] || `NPC #${id}`, level: lvl });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Extract unlocked cars map (boolean flags) when JSON5 fails. */
function tryExtractUnlockedCars(text) {
  const block = text.match(/["']?unlockedCars["']?\s*:\s*\{([\s\S]*?)\}/);
  if (!block) return [];
  const body = block[1];
  const out = [];
  let m;
  const re = /(\d+)\s*:\s*(true|false)/gi;
  while ((m = re.exec(body))) {
    const id = Number(m[1]);
    const unlocked = String(m[2]).toLowerCase() === "true";
    out.push({ id, unlocked });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Snapshot builder used for tolerant mode (read-only UI).
 *  NOTE: We extract sandbox-related booleans here as well so the UI reflects
 *  sandbox state even when strict JSON parsing fails.
 */
function tolerantSnapshot(text) {
  const fileId = tryExtractScalar(text, "FILE_ID", "");
  const name = tryExtractScalar(text, "name", "");
  const parentCity = tryExtractScalar(text, "parentCity", "");
  const difficulty = Number(tryExtractScalar(text, "difficulty", 1)) || 1;
  const mapSize = Number(tryExtractScalar(text, "mapSize", 40)) || 40;
  const day = Number(tryExtractScalar(text, "day", 1)) || 1;
  const dayProgress = Number(tryExtractScalar(text, "dayProgress", 0)) || 0;
  const money = Number(tryExtractScalar(text, "money", 0)) || 0;
  const researchPoints =
    Number(tryExtractScalar(text, "researchPoints", 0)) || 0;
  const level = Number(tryExtractScalar(text, "level", 0)) || 0;

  // Flags we need for badges/checkboxes
  const isSurvivalMode = tryExtractBool(text, "isSurvivalMode", false);
  const unlockAll = tryExtractBool(text, "unlockAll", false);
  const infiniteMoney = tryExtractBool(text, "infiniteMoney", false);
  const maxLevel = tryExtractBool(text, "maxLevel", false);
  const sandboxEnabled = !!(unlockAll || infiniteMoney || maxLevel);

  return {
    FILE_ID: fileId,
    name,
    parentCity,
    difficulty,
    mapSize,
    day,
    dayProgress,
    money,
    researchPoints,
    level,
    isSurvivalMode,
    unlockAll,
    infiniteMoney,
    maxLevel,
    sandboxEnabled,
    resources: tryExtractResources(text),
    relationships: tryExtractRelationships(text),
    unlockedCars: tryExtractUnlockedCars(text),
  };
}

/** Convert a dict-like resources object to an array for the UI. */
function mapResourceDict(dictLike) {
  const out = [];
  if (!dictLike || typeof dictLike !== "object") return out;
  for (const [key, val] of Object.entries(dictLike)) {
    const idNum = Number(key);
    out.push({
      id: idNum,
      name: RESOURCE_MAP[idNum] || `#${idNum}`,
      amount: Number(val),
    });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Convert a dict-like relationships object to an array for the UI. */
function mapRelationshipDict(dictLike) {
  const out = [];
  if (!dictLike || typeof dictLike !== "object") return out;
  for (const [key, val] of Object.entries(dictLike)) {
    const idNum = Number(key);
    out.push({
      id: idNum,
      name: NPC_NAMES[idNum] || `NPC #${idNum}`,
      level: Number(val),
    });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Convert a dict-like unlockedCars object (booleans) to array for the UI. */
function mapUnlockedCarsDict(dictLike) {
  const out = [];
  if (!dictLike || typeof dictLike !== "object") return out;
  for (const [key, val] of Object.entries(dictLike)) {
    const idNum = Number(key);
    out.push({ id: idNum, unlocked: !!val });
  }
  out.sort((a, b) => a.id - b.id);
  return out;
}

/** Regex writer: patch simple scalars and (optionally) rebuild resources/relationships/cars blocks.
 *  Used as a safe fallback when strict JSON5 parse fails.
 */
function regexPatchEs3Text(text, patch) {
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const setStr = (t, key, val) =>
    t.replace(
      new RegExp(`(["']?${key}["']?\\s*:\\s*)(?:"[^"\\n\\r]*"|[^,\\n\\r}]+)`),
      `$1"${esc(val)}"`
    );
  const setNum = (t, key, val) =>
    t.replace(
      new RegExp(`(["']?${key}["']?\\s*:\\s*)(?:"[^"\\n\\r]*"|[^,\\n\\r}]+)`),
      `$1${Number(val)}`
    );
  const setBool = (t, key, val) =>
    t.replace(
      new RegExp(`(["']?${key}["']?\\s*:\\s*)(?:"[^"\\n\\r]*"|[^,\\n\\r}]+)`),
      `$1${val ? "true" : "false"}`
    );

  let out = String(text);

  if (patch.name !== undefined) out = setStr(out, "name", patch.name);
  if (patch.money !== undefined) out = setNum(out, "money", patch.money);
  if (patch.researchPoints !== undefined)
    out = setNum(out, "researchPoints", patch.researchPoints);
  if (patch.day !== undefined) out = setNum(out, "day", patch.day);
  if (patch.dayProgress !== undefined)
    out = setNum(out, "dayProgress", patch.dayProgress);
  if (patch.mapSize !== undefined) out = setNum(out, "mapSize", patch.mapSize);
  if (patch.difficulty !== undefined)
    out = setNum(out, "difficulty", patch.difficulty);
  if (patch.level !== undefined) out = setNum(out, "level", patch.level);

  // Sandbox toggle (only if explicitly requested in the patch)
  if (patch.sandbox !== undefined) {
    out = setBool(out, "unlockAll", !!patch.sandbox);
    out = setBool(out, "infiniteMoney", !!patch.sandbox);
    out = setBool(out, "maxLevel", !!patch.sandbox);
  }

  // If resources are provided, rebuild the entire object conservatively
  if (patch.resources && Array.isArray(patch.resources)) {
    const entries = patch.resources
      .filter((r) => r && typeof r.id !== "undefined")
      .map((r) => `  ${Number(r.id)}: ${Math.max(0, Number(r.amount) || 0)}`)
      .join(",\n");
    const block = `resources: {\n${entries}\n}`;
    if (/"?resources"?\s*:\s*\{[\s\S]*?\}/.test(out)) {
      out = out.replace(
        /(["']?resources["']?\s*:\s*)\{[\s\S]*?\}/,
        `$1{${entries}\n}`
      );
    } else {
      if (/"?money"?\s*:/.test(out)) {
        out = out.replace(
          /(["']?money["']?\s*:[^,}\n\r]+,?)/,
          `$1\n  ${block},`
        );
      } else {
        out = out.replace(
          /(CITY\s*:\s*\{\s*value\s*:\s*\{)/,
          `$1\n  ${block},`
        );
      }
    }
  }

  // If relationships are provided, rebuild the entire object conservatively
  if (patch.relationships && Array.isArray(patch.relationships)) {
    const entries = patch.relationships
      .filter((r) => r && typeof r.id !== "undefined")
      .map((r) => `  ${Number(r.id)}: ${Math.max(0, Number(r.level) || 0)}`)
      .join(",\n");
    const block = `relationships: {\n${entries}\n}`;
    if (/"?relationships"?\s*:\s*\{[\s\S]*?\}/.test(out)) {
      out = out.replace(
        /(["']?relationships["']?\s*:\s*)\{[\s\S]*?\}/,
        `$1{${entries}\n}`
      );
    } else {
      out = out.replace(/(CITY\s*:\s*\{\s*value\s*:\s*\{)/, `$1\n  ${block},`);
    }
  }

  // If unlockedCars are provided, rebuild the entire object conservatively
  if (patch.unlockedCars && Array.isArray(patch.unlockedCars)) {
    const entries = patch.unlockedCars
      .filter((c) => c && typeof c.id !== "undefined")
      .map((c) => `  ${Number(c.id)}: ${c.unlocked ? "true" : "false"}`)
      .join(",\n");
    const block = `unlockedCars: {\n${entries}\n}`;
    if (/"?unlockedCars"?\s*:\s*\{[\s\S]*?\}/.test(out)) {
      out = out.replace(
        /(["']?unlockedCars["']?\s*:\s*)\{[\s\S]*?\}/,
        `$1{${entries}\n}`
      );
    } else {
      out = out.replace(/(CITY\s*:\s*\{\s*value\s*:\s*\{)/, `$1\n  ${block},`);
    }
  }

  return out;
}

/** Scan a set of directories for .es3 files and return metadata for UI. */
async function scanAllSaves(startDirs) {
  const files = [];
  for (const dir of startDirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (!entry.toLowerCase().endsWith(ES3_EXT)) continue;
      const fp = path.join(dir, entry);
      const stat = fs.statSync(fp);

      let meta = {};
      try {
        const { text } = readEs3(fp);
        try {
          const obj = parseLooseJson(text);
          const v = obj?.CITY?.value || {};
          meta = {
            FILE_ID: v.FILE_ID || "",
            name: v.name || "",
            parentCity: v.parentCity || "",
            difficulty: v.difficulty ?? null,
            mapSize: v.mapSize ?? null,
            day: v.day ?? null,
            dayProgress: v.dayProgress ?? null,
            money: v.money ?? null,
            isSurvivalMode: !!v.isSurvivalMode, // surfaced for badges
            // Surface sandbox detection for badges
            sandboxEnabled: !!(v.unlockAll || v.infiniteMoney || v.maxLevel),
          };
        } catch {
          const snap = tolerantSnapshot(text);
          meta = {
            FILE_ID: snap.FILE_ID || "",
            name: snap.name || "",
            parentCity: snap.parentCity || "",
            difficulty: snap.difficulty ?? null,
            mapSize: snap.mapSize ?? null,
            day: snap.day ?? null,
            dayProgress: snap.dayProgress ?? null,
            money: snap.money ?? null,
            isSurvivalMode: !!snap.isSurvivalMode,
            sandboxEnabled: !!snap.sandboxEnabled,
            tolerant: true,
          };
        }
      } catch (e) {
        meta = {
          FILE_ID: "",
          name: "",
          parentCity: "",
          parseError: true,
          error: String(e),
        };
      }

      files.push({
        filePath: fp,
        fileName: entry,
        tag: isAutoOrManual(entry),
        sizeBytes: stat.size,
        mtime: stat.mtimeMs,
        meta,
      });
    }
  }

  // Add grouping hints for UI: root maps vs child regions
  const grouped = files.map((f) => {
    const isRoot = (f.meta.parentCity || "") === "";
    const groupId = isRoot ? f.meta.FILE_ID || "" : f.meta.parentCity || "";
    return {
      ...f,
      isRoot,
      groupId,
      displayName: f.meta.name || path.basename(f.fileName, ES3_EXT),
    };
  });

  return grouped;
}

/** Read a save; return a normalized snapshot and raw text. */
async function readSaveParsed(filePath) {
  const { text, innerName } = readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const v = obj?.CITY?.value || {};
    const simpleResources = mapResourceDict(v.resources);
    const rels = mapRelationshipDict(v.relationships);
    const cars = mapUnlockedCarsDict(v.unlockedCars);
    return {
      filePath,
      innerName,
      rawText: text,
      readonly: false,
      snapshot: {
        FILE_ID: v.FILE_ID || "",
        name: v.name || "",
        parentCity: v.parentCity || "",
        difficulty: v.difficulty ?? 1,
        mapSize: v.mapSize ?? 40,
        day: v.day ?? 1,
        dayProgress: v.dayProgress ?? 0,
        money: v.money ?? 0,
        researchPoints: v.researchPoints ?? 0,
        level: v.level ?? 0,
        isSurvivalMode: !!v.isSurvivalMode,
        unlockAll: !!v.unlockAll,
        infiniteMoney: !!v.infiniteMoney,
        maxLevel: !!v.maxLevel,
        // Detect sandbox if any of the three flags is true
        sandboxEnabled: !!(v.unlockAll || v.infiniteMoney || v.maxLevel),
        resources: simpleResources,
        relationships: rels,
        unlockedCars: cars,
      },
    };
  } catch (e) {
    // Tolerant mode makes sure sandbox fields and survival are still populated
    const snap = tolerantSnapshot(text);
    return {
      filePath,
      innerName,
      rawText: text,
      readonly: true,
      error: String(e),
      snapshot: snap,
    };
  }
}

/** Write a save by applying a patch; makes a per-save backup automatically. */
async function writeSaveFromPatch(filePath, patch) {
  // Backup first
  const backupDir = backupFolderFor(filePath);
  ensureDir(backupDir);
  const backupName = `${timestamp()}.es3`;
  const backupPath = path.join(backupDir, backupName);
  fs.copyFileSync(filePath, backupPath);
  rotateBackups(backupDir, 20);

  // Read
  const { text, innerName } = readEs3(filePath);

  // Strict parse-and-write when possible
  try {
    const obj = parseLooseJson(text);
    const v = obj?.CITY?.value || {};

    // Scalars
    if (patch.name !== undefined) v.name = String(patch.name);
    if (patch.money !== undefined) v.money = Number(patch.money);
    if (patch.researchPoints !== undefined)
      v.researchPoints = Number(patch.researchPoints);
    if (patch.day !== undefined) v.day = Number(patch.day);
    if (patch.dayProgress !== undefined)
      v.dayProgress = Number(patch.dayProgress);

    // Map size guard: never shrink, clamp to [40,88]
    if (patch.mapSize !== undefined) {
      const cur = Number(v.mapSize ?? 40);
      const desired = Number(patch.mapSize);
      const clamped = Math.max(40, Math.min(88, desired));
      v.mapSize = Math.max(cur, clamped);
    }

    if (patch.difficulty !== undefined) v.difficulty = Number(patch.difficulty);
    if (patch.level !== undefined) v.level = Number(patch.level);

    // Sandbox toggle only when explicitly included AND not survival
    if (patch.sandbox !== undefined) {
      if (!v.isSurvivalMode) {
        v.unlockAll = !!patch.sandbox;
        v.infiniteMoney = !!patch.sandbox;
        v.maxLevel = !!patch.sandbox;
      }
      // If survival, ignore sandbox change silently.
    }

    // Resources (id => amount)
    if (patch.resources && Array.isArray(patch.resources)) {
      if (!v.resources || typeof v.resources !== "object") v.resources = {};
      for (const r of patch.resources) {
        if (
          r &&
          typeof r.id !== "undefined" &&
          typeof r.amount !== "undefined"
        ) {
          v.resources[r.id] = Number(r.amount);
        }
      }
    }

    // Relationships (id => level)
    if (patch.relationships && Array.isArray(patch.relationships)) {
      if (!v.relationships || typeof v.relationships !== "object")
        v.relationships = {};
      for (const r of patch.relationships) {
        if (
          r &&
          typeof r.id !== "undefined" &&
          typeof r.level !== "undefined"
        ) {
          v.relationships[r.id] = Number(r.level);
        }
      }
    }

    // Unlocked cars (id => boolean)
    if (patch.unlockedCars && Array.isArray(patch.unlockedCars)) {
      if (!v.unlockedCars || typeof v.unlockedCars !== "object")
        v.unlockedCars = {};
      for (const c of patch.unlockedCars) {
        if (c && typeof c.id !== "undefined") {
          v.unlockedCars[c.id] = !!c.unlocked;
        }
      }
    }

    // Pretty JSON, keep numeric keys unquoted to match game's style
    const pretty = JSON.stringify(obj, null, 2).replace(/"(\d+)"\s*:/g, "$1:");
    writeEs3(filePath, pretty, innerName);
    return { ok: true, backupPath };
  } catch {
    // Fallback: regex-based patch (also supports resources/relationships/cars)
    // Enforce survival & map size rules using loose extractors
    const isSurvival = tryExtractBool(text, "isSurvivalMode", false);
    const curSize = Number(tryExtractScalar(text, "mapSize", 40)) || 40;

    const patch2 = { ...patch };

    // Survival guard for sandbox
    if (patch2.sandbox !== undefined && isSurvival) {
      delete patch2.sandbox;
    }

    // Map size guard (never shrink, clamp [40,88])
    if (patch2.mapSize !== undefined) {
      const desired = Number(patch2.mapSize);
      const clamped = Math.max(40, Math.min(88, desired));
      const effective = Math.max(curSize, clamped);
      if (effective <= curSize) {
        delete patch2.mapSize;
      } else {
        patch2.mapSize = effective;
      }
    }

    const patched = regexPatchEs3Text(text, patch2);
    writeEs3(filePath, patched, innerName);
    return { ok: true, backupPath, fallback: true };
  }
}

/** List backups for a given save file. */
async function listBackups(filePath) {
  const dir = backupFolderFor(filePath);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".es3"))
    .map((f) => {
      const full = path.join(dir, f);
      const st = fs.statSync(full);
      return {
        name: f,
        backupPath: full,
        sizeBytes: st.size,
        mtime: st.mtimeMs,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

/** Restore a backup over the current save. */
async function restoreBackup(filePath, backupPath) {
  fs.copyFileSync(backupPath, filePath);
  return { ok: true };
}

/** Delete a save file. */
async function deleteSave(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return { ok: true };
}

module.exports = {
  scanAllSaves,
  readSaveParsed,
  writeSaveFromPatch,
  listBackups,
  restoreBackup,
  deleteSave,
};
