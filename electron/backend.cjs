var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// <stdin>
var stdin_exports = {};
__export(stdin_exports, {
  cars: () => cars_exports,
  npcs: () => npcs_exports,
  pc2Dirs: () => pc2_dirs_exports,
  pc2Saves: () => pc2_saves_exports,
  resources: () => resources_exports,
  saveWatcher: () => save_watcher_exports
});
module.exports = __toCommonJS(stdin_exports);

// src/lib/pc2-saves.ts
var pc2_saves_exports = {};
__export(pc2_saves_exports, {
  CAR_MAX_ID_DEFAULT: () => CAR_MAX_ID_DEFAULT,
  createSaveBackup: () => createSaveBackup,
  deleteGlobalSettings: () => deleteGlobalSettings,
  deleteSave: () => deleteSave,
  invalidateSaveCache: () => invalidateSaveCache,
  listSaveBackups: () => listSaveBackups,
  parseLooseJson: () => parseLooseJson,
  patchSaveScalars: () => patchSaveScalars,
  readEs3: () => readEs3,
  readGlobalSettings: () => readGlobalSettings,
  readSaveCars: () => readSaveCars,
  readSaveRelationships: () => readSaveRelationships,
  readSaveResources: () => readSaveResources,
  readSaveSnapshot: () => readSaveSnapshot,
  restoreSaveBackup: () => restoreSaveBackup,
  rotateBackups: () => rotateBackups,
  scanAllSaves: () => scanAllSaves,
  scanAllSavesCached: () => scanAllSavesCached,
  writeEs3: () => writeEs3,
  writeGlobalSettings: () => writeGlobalSettings,
  writeSaveCars: () => writeSaveCars,
  writeSaveFromPatch: () => writeSaveFromPatch,
  writeSaveRelationships: () => writeSaveRelationships,
  writeSaveResources: () => writeSaveResources
});
var path = __toESM(require("node:path"));
var fs = __toESM(require("node:fs/promises"));
var fscb = __toESM(require("node:fs"));
var import_json5 = __toESM(require("json5"));
var import_pako = require("pako");
var CAR_MAX_ID_DEFAULT = 26;
var td = new TextDecoder("utf-8");
var te = new TextEncoder();
function clamp(v, min, max) {
  if (Number.isNaN(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
function safeNumber(n, fallback = 0) {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
function sortById(arr) {
  return [...arr].sort((a, b) => a.id - b.id);
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}
function fileExists(p) {
  return fs.access(p).then(() => true).catch(() => false);
}
async function readEs3(filePath) {
  const data = await fs.readFile(filePath);
  const u8 = (0, import_pako.ungzip)(data);
  const text = typeof u8.buffer === "undefined" ? td.decode(u8) : td.decode(u8);
  return { text, innerName: null };
}
async function writeEs3(filePath, text, innerNameGuess) {
  const nameForHeader = innerNameGuess ?? path.basename(filePath);
  const input = te.encode(text);
  const gz = (0, import_pako.gzip)(input, { header: { name: nameForHeader } });
  await fs.writeFile(filePath, gz);
}
function parseLooseJson(text) {
  if (text.charCodeAt(0) === 65279) {
    text = text.slice(1);
  }
  text = text.replace(/([\[{,]\s*)(\d+)\s*:/g, '$1"$2":');
  return import_json5.default.parse(text);
}
function stringifyWithUnquotedNumericKeys(obj) {
  const s = JSON.stringify(obj, null, 2);
  return s.replace(/"(\d+)"\s*:/g, "$1:");
}
function scanBalancedBraces(text, openIndex) {
  let depth = 0;
  let inStr = false;
  let strQuote = "";
  let esc = false;
  let inLineComment = false;
  let inBlockComment = false;
  for (let i = openIndex; i < text.length; i++) {
    const ch = text[i];
    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && text[i + 1] === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }
    if (inStr) {
      if (esc) {
        esc = false;
      } else if (ch === "\\") {
        esc = true;
      } else if (ch === strQuote) {
        inStr = false;
      }
      continue;
    }
    if (ch === "/") {
      const next = text[i + 1];
      if (next === "/") {
        inLineComment = true;
        i++;
        continue;
      } else if (next === "*") {
        inBlockComment = true;
        i++;
        continue;
      }
    }
    if (ch === '"' || ch === "'") {
      inStr = true;
      strQuote = ch;
      esc = false;
      continue;
    }
    if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return i;
      }
    }
  }
  throw new Error("Unbalanced braces from index: " + openIndex);
}
function findFirstBlock(text, key, withinStart = 0, withinEnd = text.length) {
  const slice = text.slice(withinStart, withinEnd);
  const keyRe = new RegExp(
    `([\\{,
\r	s])("?${escapeRegExp(key)}"?)\\s*:\\s*\\{`,
    "g"
  );
  let m;
  while (m = keyRe.exec(slice)) {
    const absIndex = withinStart + m.index;
    const matchStr = m[0];
    const braceRelIdx = matchStr.lastIndexOf("{");
    const braceStart = absIndex + braceRelIdx;
    try {
      const braceEnd = scanBalancedBraces(text, braceStart);
      const lineStart = text.lastIndexOf("\n", absIndex) + 1;
      const indent = text.slice(lineStart, absIndex).match(/^[\t ]*/)?.[0] ?? "";
      let hadComma = false;
      const after = text.slice(braceEnd + 1);
      const m2 = after.match(/^([\t\r\n ]*),/);
      if (m2) hadComma = true;
      return {
        keyStart: absIndex,
        braceStart,
        braceEnd,
        hadTrailingComma: hadComma,
        indent
      };
    } catch {
    }
  }
  return null;
}
function findPathBlock(text, pathKeys) {
  let withinStart = 0;
  let withinEnd = text.length;
  for (let i = 0; i < pathKeys.length; i++) {
    const key = pathKeys[i];
    const pos = findFirstBlock(text, key, withinStart, withinEnd);
    if (!pos) return null;
    if (i === pathKeys.length - 1) {
      return { start: pos.braceStart, end: pos.braceEnd, indent: pos.indent };
    }
    withinStart = pos.braceStart;
    withinEnd = pos.braceEnd + 1;
  }
  return null;
}
function extractBlockInner(text, pos) {
  return text.slice(pos.start + 1, pos.end);
}
function replaceBlock(text, block, newInner) {
  return text.slice(0, block.start + 1) + newInner + text.slice(block.end);
}
function parseNumericObjectBlock(inner) {
  const result = {};
  const re = /(\d+)\s*:\s*(-?\d+(?:\.\d+)?)/g;
  let m;
  while (m = re.exec(inner)) {
    const id = Number(m[1]);
    const num = Number(m[2]);
    if (Number.isFinite(id) && Number.isFinite(num)) {
      result[id] = num;
    }
  }
  return result;
}
function parseBooleanObjectBlock(inner) {
  const result = {};
  const re = /(\d+)\s*:\s*(true|false)/g;
  let m;
  while (m = re.exec(inner)) {
    const id = Number(m[1]);
    const val = m[2] === "true";
    if (Number.isFinite(id)) result[id] = val;
  }
  return result;
}
function buildNumericObjectBlock(entries, indentBase) {
  const innerIndent = indentBase + "  ";
  const lines = entries.sort((a, b) => a.id - b.id).map((e) => `${innerIndent}${e.id}: ${e.value},`);
  return "\n" + lines.join("\n") + "\n" + indentBase;
}
function buildBooleanObjectBlock(entries, indentBase) {
  const innerIndent = indentBase + "  ";
  const lines = entries.sort((a, b) => a.id - b.id).map((e) => `${innerIndent}${e.id}: ${e.value ? "true" : "false"},`);
  return "\n" + lines.join("\n") + "\n" + indentBase;
}
function getScalarInBlock(inner, key) {
  const re = new RegExp(
    `(^|[
\r,s])(?:"?${escapeRegExp(key)}"?)s*:s*([^,
\r}]+)`,
    "m"
  );
  const m = inner.match(re);
  return m ? m[2].trim() : null;
}
function extractStringScalarLoose(text, key) {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*"([^"\\r\\n]*)"`,
    "i"
  );
  const match = re.exec(text);
  return match ? match[1] : "";
}
function extractNumberScalarLoose(text, key) {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`,
    "i"
  );
  const match = re.exec(text);
  if (!match) return 0;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : 0;
}
function extractBooleanScalarLoose(text, key) {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*(true|false)`,
    "i"
  );
  const match = re.exec(text);
  return match ? match[1].toLowerCase() === "true" : false;
}
function setScalarInBlock(inner, key, rawValue, indentBase) {
  const keyRe = new RegExp(
    `(^[	 ]*)("?${escapeRegExp(key)}"?s*:\\s*)([^,
\r}]+)`,
    "m"
  );
  const m = inner.match(keyRe);
  if (m && typeof m.index === "number") {
    const start = m.index;
    const pre = inner.slice(0, start) + m[1] + m[2];
    const postStart = start + m[0].length;
    const post = inner.slice(postStart);
    return pre + rawValue + post;
  }
  const innerIndent = indentBase + "  ";
  const trimmed = inner.trimEnd();
  const trailingWS = inner.slice(trimmed.length);
  const insertion = `${inner.length && !inner.trim() ? "" : "\n"}${innerIndent}${key}: ${rawValue},
${indentBase}`;
  const newInner = trimmed + insertion + trailingWS;
  return newInner;
}
async function readSaveRelationships(filePath) {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const relObj = obj?.CITY?.value?.relationships;
    if (relObj && typeof relObj === "object") {
      const arr = Object.keys(relObj).map((k) => ({
        id: Number(k),
        level: safeNumber(relObj[k], 0)
      })).filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
  }
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: ""
    };
    const relPos = findFirstBlock(
      text,
      "relationships",
      valuePos.start,
      valuePos.end + 1
    );
    if (!relPos) return [];
    const inner = extractBlockInner(text, {
      start: relPos.braceStart,
      end: relPos.braceEnd
    });
    const map = parseNumericObjectBlock(inner);
    const arr = Object.keys(map).map((k) => ({
      id: Number(k),
      level: map[Number(k)]
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}
async function writeSaveRelationships(filePath, relationships) {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
    start: 0,
    end: text.length,
    indent: ""
  };
  const relPos = findFirstBlock(
    text,
    "relationships",
    valuePos.start,
    valuePos.end + 1
  );
  if (!relPos) {
    const block2 = valuePos;
    if (!block2) return { ok: false, backupPath, fallback: true };
    const innerOld = extractBlockInner(text, block2);
    const newInnerBlock2 = buildNumericObjectBlock(
      relationships.map((x) => ({ id: x.id, value: Number(x.level) || 0 })),
      block2.indent + "  "
    );
    const insertion = `
${block2.indent}  relationships: {${newInnerBlock2}},
${block2.indent}`;
    const newInner = innerOld.replace(/\s*$/, "") + insertion;
    const newText2 = replaceBlock(text, block2, newInner);
    await writeEs3(filePath, newText2);
    return { ok: true, backupPath, fallback: true };
  }
  const block = { start: relPos.braceStart, end: relPos.braceEnd };
  const indentBase = relPos.indent + "  ";
  const newInnerBlock = buildNumericObjectBlock(
    relationships.map((x) => ({ id: x.id, value: Number(x.level) || 0 })),
    indentBase
  );
  const newText = text.slice(0, relPos.keyStart) + `${relPos.indent}relationships: {${newInnerBlock}}` + (relPos.hadTrailingComma ? "," : "") + text.slice(relPos.braceEnd + (relPos.hadTrailingComma ? 2 : 1));
  await writeEs3(filePath, newText);
  return { ok: true, backupPath };
}
async function readSaveResources(filePath) {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const resObj = obj?.CITY?.value?.resources;
    if (resObj && typeof resObj === "object") {
      const arr = Object.keys(resObj).map((k) => ({
        id: Number(k),
        amount: Math.max(0, safeNumber(resObj[k], 0))
      })).filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
  }
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: ""
    };
    const resPos = findFirstBlock(
      text,
      "resources",
      valuePos.start,
      valuePos.end + 1
    );
    if (!resPos) return [];
    const inner = extractBlockInner(text, {
      start: resPos.braceStart,
      end: resPos.braceEnd
    });
    const map = parseNumericObjectBlock(inner);
    const arr = Object.keys(map).map((k) => ({
      id: Number(k),
      amount: Math.max(0, map[Number(k)])
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}
async function writeSaveResources(filePath, resources) {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
    start: 0,
    end: text.length,
    indent: ""
  };
  const resPos = findFirstBlock(
    text,
    "resources",
    valuePos.start,
    valuePos.end + 1
  );
  if (!resPos) {
    const block = valuePos;
    if (!block) return { ok: false, backupPath, fallback: true };
    const innerOld = extractBlockInner(text, block);
    const newInnerBlock2 = buildNumericObjectBlock(
      resources.map((x) => ({
        id: x.id,
        value: Math.max(0, Number(x.amount) || 0)
      })),
      block.indent + "  "
    );
    const insertion = `
${block.indent}  resources: {${newInnerBlock2}},
${block.indent}`;
    const newInner = innerOld.replace(/\s*$/, "") + insertion;
    const newText2 = replaceBlock(text, block, newInner);
    await writeEs3(filePath, newText2);
    return { ok: true, backupPath, fallback: true };
  }
  const newInnerBlock = buildNumericObjectBlock(
    resources.map((x) => ({
      id: x.id,
      value: Math.max(0, Number(x.amount) || 0)
    })),
    resPos.indent + "  "
  );
  const newText = text.slice(0, resPos.keyStart) + `${resPos.indent}resources: {${newInnerBlock}}` + (resPos.hadTrailingComma ? "," : "") + text.slice(resPos.braceEnd + (resPos.hadTrailingComma ? 2 : 1));
  await writeEs3(filePath, newText);
  return { ok: true, backupPath };
}
async function readSaveCars(filePath) {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const carObj = obj?.CITY?.value?.unlockedCars;
    if (carObj && typeof carObj === "object") {
      const arr = Object.keys(carObj).map((k) => ({ id: Number(k), unlocked: Boolean(carObj[k]) })).filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
  }
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: ""
    };
    const carPos = findFirstBlock(
      text,
      "unlockedCars",
      valuePos.start,
      valuePos.end + 1
    );
    if (!carPos) return [];
    const inner = extractBlockInner(text, {
      start: carPos.braceStart,
      end: carPos.braceEnd
    });
    const map = parseBooleanObjectBlock(inner);
    const arr = Object.keys(map).map((k) => ({
      id: Number(k),
      unlocked: map[Number(k)]
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}
async function writeSaveCars(filePath, cars) {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
    start: 0,
    end: text.length,
    indent: ""
  };
  const carPos = findFirstBlock(
    text,
    "unlockedCars",
    valuePos.start,
    valuePos.end + 1
  );
  if (!carPos) {
    const block = valuePos;
    if (!block) return { ok: false, backupPath, fallback: true };
    const innerOld = extractBlockInner(text, block);
    const newInnerBlock2 = buildBooleanObjectBlock(
      cars.map((x) => ({ id: x.id, value: Boolean(x.unlocked) })),
      block.indent + "  "
    );
    const insertion = `
${block.indent}  unlockedCars: {${newInnerBlock2}},
${block.indent}`;
    const newInner = innerOld.replace(/\s*$/, "") + insertion;
    const newText2 = replaceBlock(text, block, newInner);
    await writeEs3(filePath, newText2);
    return { ok: true, backupPath, fallback: true };
  }
  const newInnerBlock = buildBooleanObjectBlock(
    cars.map((x) => ({ id: x.id, value: Boolean(x.unlocked) })),
    carPos.indent + "  "
  );
  const newText = text.slice(0, carPos.keyStart) + `${carPos.indent}unlockedCars: {${newInnerBlock}}` + (carPos.hadTrailingComma ? "," : "") + text.slice(carPos.braceEnd + (carPos.hadTrailingComma ? 2 : 1));
  await writeEs3(filePath, newText);
  return { ok: true, backupPath };
}
async function patchSaveScalars(filePath, patch) {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
    start: 0,
    end: text.length,
    indent: ""
  };
  const inner = extractBlockInner(text, valueBlock);
  let innerNew = inner;
  const indentBase = valueBlock.indent + "  ";
  const readBool = (key) => {
    const v = getScalarInBlock(innerNew, key);
    if (v == null) return null;
    return /true/.test(v) ? true : /false/.test(v) ? false : null;
  };
  const readNum = (key) => {
    const v = getScalarInBlock(innerNew, key);
    if (v == null) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  if (typeof patch.name === "string") {
    const escaped = JSON.stringify(patch.name);
    innerNew = setScalarInBlock(innerNew, "name", escaped, valueBlock.indent);
  }
  if (typeof patch.money === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "money",
      String(patch.money),
      valueBlock.indent
    );
  }
  if (typeof patch.researchPoints === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "researchPoints",
      String(patch.researchPoints),
      valueBlock.indent
    );
  }
  if (typeof patch.day === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "day",
      String(patch.day),
      valueBlock.indent
    );
  }
  if (typeof patch.dayProgress === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "dayProgress",
      String(patch.dayProgress),
      valueBlock.indent
    );
  }
  if (typeof patch.difficulty === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "difficulty",
      String(patch.difficulty),
      valueBlock.indent
    );
  }
  if (typeof patch.level === "number") {
    innerNew = setScalarInBlock(
      innerNew,
      "level",
      String(patch.level),
      valueBlock.indent
    );
  }
  if (typeof patch.mapSize === "number") {
    const cur = readNum("mapSize") ?? 40;
    const eff = Math.max(cur, clamp(patch.mapSize, 40, 88));
    innerNew = setScalarInBlock(
      innerNew,
      "mapSize",
      String(eff),
      valueBlock.indent
    );
  }
  if (typeof patch.sandbox === "boolean") {
    const isSurvival = readBool("isSurvivalMode") ?? false;
    if (!isSurvival) {
      innerNew = setScalarInBlock(
        innerNew,
        "unlockAll",
        patch.sandbox ? "true" : "false",
        valueBlock.indent
      );
      innerNew = setScalarInBlock(
        innerNew,
        "infiniteMoney",
        patch.sandbox ? "true" : "false",
        valueBlock.indent
      );
      innerNew = setScalarInBlock(
        innerNew,
        "maxLevel",
        patch.sandbox ? "true" : "false",
        valueBlock.indent
      );
    }
  }
  const newText = replaceBlock(text, valueBlock, innerNew);
  await writeEs3(filePath, newText);
  return { ok: true, backupPath };
}
async function readSaveSnapshot(filePath) {
  let text = "";
  try {
    text = (await readEs3(filePath)).text;
  } catch {
    return {
      FILE_ID: "",
      name: "",
      parentCity: "",
      difficulty: 0,
      mapSize: 0,
      day: 0,
      dayProgress: 0,
      money: 0,
      researchPoints: 0,
      level: 0,
      isSurvivalMode: false,
      unlockAll: false,
      infiniteMoney: false,
      maxLevel: false,
      sandboxEnabled: false,
      resources: [],
      relationships: [],
      unlockedCars: []
    };
  }
  try {
    const obj = parseLooseJson(text);
    const city = obj?.CITY;
    const value = city?.value ?? obj?.value ?? {};
    const fileId = obj?.FILE_ID || city?.FILE_ID || value?.FILE_ID || "";
    const parentCity = String(value?.parentCity ?? "");
    const difficulty = safeNumber(value?.difficulty, 0);
    const mapSize = safeNumber(value?.mapSize, 0);
    const day = safeNumber(value?.day, 0);
    const dayProgress = safeNumber(value?.dayProgress, 0);
    const money = safeNumber(value?.money, 0);
    const researchPoints = safeNumber(value?.researchPoints, 0);
    const level = safeNumber(value?.level, 0);
    const isSurvivalMode = Boolean(value?.isSurvivalMode);
    const unlockAll = Boolean(value?.unlockAll);
    const infiniteMoney = Boolean(value?.infiniteMoney);
    const maxLevel = Boolean(value?.maxLevel);
    const resObj = value?.resources || {};
    const relObj = value?.relationships || {};
    const carObj = value?.unlockedCars || {};
    const resources = Object.keys(resObj).map((k) => ({
      id: Number(k),
      amount: Math.max(0, safeNumber(resObj[k], 0))
    }));
    const relationships = Object.keys(relObj).map((k) => ({
      id: Number(k),
      level: safeNumber(relObj[k], 0)
    }));
    const unlockedCars = Object.keys(carObj).map((k) => ({
      id: Number(k),
      unlocked: Boolean(carObj[k])
    }));
    const sandboxEnabled = unlockAll || infiniteMoney || maxLevel;
    return {
      FILE_ID: String(fileId),
      name: String(value?.name ?? ""),
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
      resources: sortById(resources),
      relationships: sortById(relationships),
      unlockedCars: sortById(unlockedCars)
    };
  } catch {
    const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: ""
    };
    const inner = extractBlockInner(text, valueBlock);
    const FILE_ID = extractStringScalarLoose(text, "FILE_ID");
    const parentCity = extractStringScalarLoose(text, "parentCity");
    const name = extractStringScalarLoose(text, "name");
    const difficulty = extractNumberScalarLoose(text, "difficulty");
    const mapSize = extractNumberScalarLoose(text, "mapSize");
    const day = extractNumberScalarLoose(text, "day");
    const dayProgress = extractNumberScalarLoose(text, "dayProgress");
    const money = extractNumberScalarLoose(text, "money");
    const researchPoints = extractNumberScalarLoose(text, "researchPoints");
    const level = extractNumberScalarLoose(text, "level");
    const isSurvivalMode = extractBooleanScalarLoose(text, "isSurvivalMode");
    const unlockAll = extractBooleanScalarLoose(text, "unlockAll");
    const infiniteMoney = extractBooleanScalarLoose(text, "infiniteMoney");
    const maxLevel = extractBooleanScalarLoose(text, "maxLevel");
    const sandboxEnabled = unlockAll || infiniteMoney || maxLevel;
    const resPos = findFirstBlock(
      text,
      "resources",
      valueBlock.start,
      valueBlock.end + 1
    );
    const relPos = findFirstBlock(
      text,
      "relationships",
      valueBlock.start,
      valueBlock.end + 1
    );
    const carPos = findFirstBlock(
      text,
      "unlockedCars",
      valueBlock.start,
      valueBlock.end + 1
    );
    const resources = resPos ? sortById(
      Object.entries(
        parseNumericObjectBlock(
          extractBlockInner(text, {
            start: resPos.braceStart,
            end: resPos.braceEnd
          })
        )
      ).map(([k, v]) => ({
        id: Number(k),
        amount: Math.max(0, Number(v) || 0)
      }))
    ) : [];
    const relationships = relPos ? sortById(
      Object.entries(
        parseNumericObjectBlock(
          extractBlockInner(text, {
            start: relPos.braceStart,
            end: relPos.braceEnd
          })
        )
      ).map(([k, v]) => ({ id: Number(k), level: Number(v) || 0 }))
    ) : [];
    const unlockedCars = carPos ? sortById(
      Object.entries(
        parseBooleanObjectBlock(
          extractBlockInner(text, {
            start: carPos.braceStart,
            end: carPos.braceEnd
          })
        )
      ).map(([k, v]) => ({ id: Number(k), unlocked: Boolean(v) }))
    ) : [];
    return {
      FILE_ID,
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
      resources,
      relationships,
      unlockedCars
    };
  }
}
var _scanCache = null;
var _scanCacheValid = false;
function invalidateSaveCache() {
  _scanCacheValid = false;
  _scanCache = null;
}
async function scanAllSavesCached(startDirs) {
  if (_scanCacheValid && _scanCache) return _scanCache;
  _scanCache = await scanAllSaves(startDirs);
  _scanCacheValid = true;
  return _scanCache;
}
async function scanAllSaves(startDirs) {
  const results = [];
  async function walk(dir) {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
      return;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === ".backups") continue;
        await walk(full);
      } else if (ent.isFile() && ent.name.toLowerCase().endsWith(".es3")) {
        try {
          const st = await fs.stat(full);
          const fileName = ent.name;
          const tag = fileName.includes("_auto_") ? "auto" : fileName.includes("_manual_") ? "manual" : "unknown";
          let parseError = false;
          let tolerant = false;
          let snapshot;
          try {
            snapshot = await readSaveSnapshot(full);
          } catch (e2) {
            parseError = true;
            tolerant = true;
            snapshot = {
              FILE_ID: "",
              name: "",
              parentCity: "",
              difficulty: null,
              mapSize: null,
              day: null,
              dayProgress: null,
              money: null,
              isSurvivalMode: false,
              sandboxEnabled: false,
              unlockAll: false,
              infiniteMoney: false,
              maxLevel: false,
              tolerant: true,
              parseError: true,
              error: e2?.message ?? String(e2)
            };
          }
          const fileId = typeof snapshot?.FILE_ID === "string" ? snapshot.FILE_ID.trim() : "";
          const parentCity = typeof snapshot?.parentCity === "string" ? snapshot.parentCity.trim() : "";
          const isRoot = parentCity.length === 0;
          const groupId = fileId || parentCity || fileName;
          const displayName = snapshot?.name || fileName;
          results.push({
            filePath: full,
            fileName,
            tag,
            sizeBytes: st.size,
            mtime: st.mtimeMs ?? st.mtime.getTime(),
            meta: {
              FILE_ID: fileId,
              name: snapshot?.name ?? "",
              parentCity,
              difficulty: snapshot?.difficulty ?? null,
              mapSize: snapshot?.mapSize ?? null,
              day: snapshot?.day ?? null,
              dayProgress: snapshot?.dayProgress ?? null,
              money: snapshot?.money ?? null,
              level: snapshot?.level ?? null,
              isSurvivalMode: Boolean(snapshot?.isSurvivalMode),
              sandboxEnabled: Boolean(snapshot?.sandboxEnabled),
              unlockAll: Boolean(snapshot?.unlockAll),
              infiniteMoney: Boolean(snapshot?.infiniteMoney),
              maxLevel: Boolean(snapshot?.maxLevel),
              tolerant: tolerant || void 0,
              parseError: parseError || void 0
            },
            isRoot,
            groupId,
            displayName
          });
        } catch (err) {
        }
      }
    }
  }
  for (const start of startDirs) {
    await walk(start);
  }
  return results;
}
function extractFileId(text) {
  const m = text.match(/FILE_ID\s*:\s*"([^"]*)"/) ?? text.match(/FILE_ID\s*:\s*([^,\s}]+)/);
  return m ? m[1].trim() : "";
}
function buildTimestamp() {
  const ts = /* @__PURE__ */ new Date();
  const yyyy = ts.getFullYear();
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const dd = String(ts.getDate()).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  const ss = String(ts.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}`;
}
async function createSaveBackup(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  let fileId = "";
  try {
    const { text } = await readEs3(filePath);
    fileId = extractFileId(text);
  } catch {
  }
  if (!fileId) {
    const ext = path.extname(base);
    fileId = ext ? base.slice(0, -ext.length) : base;
  }
  const timestamp = buildTimestamp();
  const backupDir = path.join(dir, ".backups", fileId, timestamp);
  await ensureDir(backupDir);
  const backupPath = path.join(backupDir, base);
  await fs.copyFile(filePath, backupPath);
  return { backupPath };
}
async function rotateBackups(idDir, keep = 20) {
  let entries;
  try {
    entries = await fs.readdir(idDir, { withFileTypes: true });
  } catch {
    return;
  }
  const dirs = entries.filter((e) => e.isDirectory());
  const stats = await Promise.all(
    dirs.map(async (e) => {
      const full = path.join(idDir, e.name);
      const st = await fs.stat(full);
      return { name: e.name, full, mtimeMs: st.mtimeMs };
    })
  );
  stats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const toDelete = stats.slice(keep);
  for (const d of toDelete) {
    await fs.rm(d.full, { recursive: true, force: true }).catch(() => void 0);
  }
}
async function rotateGlobalBackups(backupDir, keep = 20) {
  let entries;
  try {
    entries = await fs.readdir(backupDir, { withFileTypes: true });
  } catch {
    return;
  }
  const files = entries.filter((e) => e.isFile());
  const stats = await Promise.all(
    files.map(async (e) => {
      const full = path.join(backupDir, e.name);
      const st = await fs.stat(full);
      return { name: e.name, full, mtimeMs: st.mtimeMs };
    })
  );
  stats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const toDelete = stats.slice(keep);
  await Promise.all(toDelete.map((f) => fs.unlink(f.full).catch(() => void 0)));
}
async function listSaveBackups(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const backupsRoot = path.join(dir, ".backups");
  let fileId = "";
  try {
    const { text } = await readEs3(filePath);
    fileId = extractFileId(text);
  } catch {
  }
  const items = [];
  if (fileId) {
    const idDir = path.join(backupsRoot, fileId);
    try {
      const tsDirs = await fs.readdir(idDir, { withFileTypes: true });
      for (const tsDir of tsDirs) {
        if (!tsDir.isDirectory()) continue;
        const tsPath = path.join(idDir, tsDir.name);
        const files = await fs.readdir(tsPath, { withFileTypes: true });
        for (const f of files) {
          if (!f.isFile()) continue;
          const full = path.join(tsPath, f.name);
          const st = await fs.stat(full);
          items.push({
            name: f.name,
            backupPath: full,
            sizeBytes: st.size,
            mtime: st.mtimeMs ?? st.mtime.getTime()
          });
        }
      }
    } catch {
    }
  }
  const legacyDir = path.join(backupsRoot, base);
  try {
    const legacyEntries = await fs.readdir(legacyDir, { withFileTypes: true });
    for (const e of legacyEntries) {
      if (!e.isFile()) continue;
      const full = path.join(legacyDir, e.name);
      const st = await fs.stat(full);
      items.push({
        name: e.name,
        backupPath: full,
        sizeBytes: st.size,
        mtime: st.mtimeMs ?? st.mtime.getTime()
      });
    }
  } catch {
  }
  items.sort((a, b) => b.mtime - a.mtime);
  return items;
}
async function restoreSaveBackup(filePath, backupPath) {
  await fs.copyFile(backupPath, filePath);
  return { ok: true };
}
async function deleteSave(filePath) {
  await fs.unlink(filePath);
  return { ok: true };
}
async function createGlobalBackupDir(dataDir) {
  const dir = path.join(dataDir, ".backups", "survival_global_settings");
  await ensureDir(dir);
  return dir;
}
async function readGlobalSettings(dataDir) {
  const filePath = path.join(dataDir, "survival_global_settings");
  const exists = await fileExists(filePath);
  let readonly = false;
  if (exists) {
    try {
      await fs.access(filePath, fscb.constants.W_OK);
      readonly = false;
    } catch {
      readonly = true;
    }
  }
  if (!exists) {
    return {
      exists: false,
      filePath,
      readonly: false,
      snapshot: { editable: {} }
    };
  }
  const data = await fs.readFile(filePath);
  const u8 = (0, import_pako.ungzip)(data);
  const text = td.decode(u8);
  const obj = parseLooseJson(text);
  const value = obj?.SETTINGS?.value ?? {};
  const editable = {};
  const copyNum = (k, min, max) => {
    const v = safeNumber(value[k], 0);
    editable[k] = clamp(v, min, max);
  };
  copyNum("bestDayReachedEasy", 0, 100);
  copyNum("bestDayReachedHard", 0, 100);
  copyNum("bestDayReachedExpert", 0, 100);
  copyNum("highestStarsReachedEasy", 0, 5);
  copyNum("highestStarsReachedHard", 0, 5);
  copyNum("highestStarsReachedExpert", 0, 5);
  copyNum("highestPopulationReachedEasy", 0, 999999999);
  copyNum("highestPopulationReachedHard", 0, 999999999);
  copyNum("highestPopulationReachedExpert", 0, 999999999);
  copyNum("totalUpgradePoints", 0, 999999);
  const us = value?.upgradesSpent || {};
  const up = {};
  for (const k of Object.keys(us)) {
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    up[id] = safeNumber(us[k], 0);
  }
  editable.upgradesSpent = up;
  return { exists: true, filePath, readonly, snapshot: { editable } };
}
async function writeGlobalSettings(dataDir, patch, createIfMissing = true) {
  const filePath = path.join(dataDir, "survival_global_settings");
  let obj = {};
  if (await fileExists(filePath)) {
    const gz2 = await fs.readFile(filePath);
    const text2 = td.decode((0, import_pako.ungzip)(gz2));
    try {
      obj = parseLooseJson(text2);
    } catch {
      obj = {};
    }
  } else if (!createIfMissing) {
    return { ok: false, filePath };
  }
  obj.SETTINGS = obj.SETTINGS || {};
  obj.SETTINGS.value = obj.SETTINGS.value || {};
  const value = obj.SETTINGS.value;
  const lastDifficultySelection = safeNumber(value.lastDifficultySelection, 2);
  const disableUnspentUpgradeToCash = Boolean(
    value.disableUnspentUpgradeToCash ?? false
  );
  const setClamped = (key, v, min, max) => {
    if (typeof v === "number") value[key] = clamp(v, min, max);
  };
  setClamped("bestDayReachedEasy", patch.bestDayReachedEasy, 0, 100);
  setClamped("bestDayReachedHard", patch.bestDayReachedHard, 0, 100);
  setClamped("bestDayReachedExpert", patch.bestDayReachedExpert, 0, 100);
  setClamped("highestStarsReachedEasy", patch.highestStarsReachedEasy, 0, 5);
  setClamped("highestStarsReachedHard", patch.highestStarsReachedHard, 0, 5);
  setClamped(
    "highestStarsReachedExpert",
    patch.highestStarsReachedExpert,
    0,
    5
  );
  setClamped(
    "highestPopulationReachedEasy",
    patch.highestPopulationReachedEasy,
    0,
    999999999
  );
  setClamped(
    "highestPopulationReachedHard",
    patch.highestPopulationReachedHard,
    0,
    999999999
  );
  setClamped(
    "highestPopulationReachedExpert",
    patch.highestPopulationReachedExpert,
    0,
    999999999
  );
  setClamped("totalUpgradePoints", patch.totalUpgradePoints, 0, 999999);
  if (patch.upgradesSpent && typeof patch.upgradesSpent === "object") {
    const us = { ...value.upgradesSpent || {} };
    for (const [k, v] of Object.entries(patch.upgradesSpent)) {
      const id = Number(k);
      if (!Number.isFinite(id)) continue;
      const raw = safeNumber(v, 0);
      const cap = id === 3 ? 2 : 3;
      us[String(id)] = clamp(raw, 0, cap);
    }
    value.upgradesSpent = us;
  }
  value.lastDifficultySelection = lastDifficultySelection;
  value.disableUnspentUpgradeToCash = disableUnspentUpgradeToCash;
  const text = stringifyWithUnquotedNumericKeys(obj);
  const backupDir = await createGlobalBackupDir(dataDir);
  const backupName = `${buildTimestamp()}.gz`;
  const backupPath = path.join(backupDir, backupName);
  try {
    const cur = await fs.readFile(filePath);
    await fs.writeFile(backupPath, cur);
  } catch {
  }
  const gz = (0, import_pako.gzip)(te.encode(text), {
    header: { name: "survival_global_settings.out" }
  });
  await fs.writeFile(filePath, gz);
  await rotateGlobalBackups(backupDir, 20);
  return { ok: true, filePath, backupPath };
}
async function deleteGlobalSettings(dataDir) {
  const filePath = path.join(dataDir, "survival_global_settings");
  const backupDir = await createGlobalBackupDir(dataDir);
  const backupName = `${buildTimestamp()}.gz`;
  const backupPath = path.join(backupDir, backupName);
  try {
    const cur = await fs.readFile(filePath);
    await fs.writeFile(backupPath, cur);
  } catch {
  }
  await fs.unlink(filePath).catch(() => void 0);
  return { ok: true, backupPath };
}
async function writeSaveFromPatch(filePath, patch) {
  const { backupPath } = await createSaveBackup(filePath);
  const { text } = await readEs3(filePath);
  const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
    start: 0,
    end: text.length,
    indent: ""
  };
  let inner = extractBlockInner(text, valueBlock);
  const indent = valueBlock.indent;
  const readBool = (key) => /true/.test(getScalarInBlock(inner, key) ?? "false");
  const readNum = (key) => {
    const v = getScalarInBlock(inner, key);
    const n = v == null ? NaN : Number(v);
    return Number.isFinite(n) ? n : NaN;
  };
  if (typeof patch.name === "string")
    inner = setScalarInBlock(inner, "name", JSON.stringify(patch.name), indent);
  if (typeof patch.money === "number")
    inner = setScalarInBlock(inner, "money", String(patch.money), indent);
  if (typeof patch.researchPoints === "number")
    inner = setScalarInBlock(
      inner,
      "researchPoints",
      String(patch.researchPoints),
      indent
    );
  if (typeof patch.day === "number")
    inner = setScalarInBlock(inner, "day", String(patch.day), indent);
  if (typeof patch.dayProgress === "number")
    inner = setScalarInBlock(
      inner,
      "dayProgress",
      String(patch.dayProgress),
      indent
    );
  if (typeof patch.difficulty === "number")
    inner = setScalarInBlock(
      inner,
      "difficulty",
      String(patch.difficulty),
      indent
    );
  if (typeof patch.level === "number")
    inner = setScalarInBlock(inner, "level", String(patch.level), indent);
  if (typeof patch.mapSize === "number") {
    const cur = readNum("mapSize");
    const eff = Math.max(
      Number.isFinite(cur) ? cur : 40,
      clamp(patch.mapSize, 40, 88)
    );
    inner = setScalarInBlock(inner, "mapSize", String(eff), indent);
  }
  if (typeof patch.sandbox === "boolean") {
    const isSurvival = readBool("isSurvivalMode");
    if (!isSurvival) {
      inner = setScalarInBlock(
        inner,
        "unlockAll",
        patch.sandbox ? "true" : "false",
        indent
      );
      inner = setScalarInBlock(
        inner,
        "infiniteMoney",
        patch.sandbox ? "true" : "false",
        indent
      );
      inner = setScalarInBlock(
        inner,
        "maxLevel",
        patch.sandbox ? "true" : "false",
        indent
      );
    }
  }
  const fullTextBefore = text;
  let newText = replaceBlock(fullTextBefore, valueBlock, inner);
  const rebuildNumericBlock = (key, entries) => {
    const newValueBlock = findPathBlock(newText, ["CITY", "value"]) ?? {
      start: 0,
      end: newText.length,
      indent: ""
    };
    const blk = findFirstBlock(
      newText,
      key,
      newValueBlock.start,
      newValueBlock.end + 1
    );
    if (blk) {
      const newInnerBlock = buildNumericObjectBlock(entries, blk.indent + "  ");
      newText = newText.slice(0, blk.keyStart) + `${blk.indent}${key}: {${newInnerBlock}}` + (blk.hadTrailingComma ? "," : "") + newText.slice(blk.braceEnd + (blk.hadTrailingComma ? 2 : 1));
    } else {
      const vb = newValueBlock;
      const valInner = extractBlockInner(newText, vb);
      const insertion = `
${vb.indent}  ${key}: {${buildNumericObjectBlock(entries, vb.indent + "  ")}},
${vb.indent}`;
      const replaced = valInner.replace(/\s*$/, "") + insertion;
      newText = replaceBlock(newText, vb, replaced);
    }
  };
  const rebuildBooleanBlock = (key, entries) => {
    const newValueBlock = findPathBlock(newText, ["CITY", "value"]) ?? {
      start: 0,
      end: newText.length,
      indent: ""
    };
    const blk = findFirstBlock(
      newText,
      key,
      newValueBlock.start,
      newValueBlock.end + 1
    );
    if (blk) {
      const newInnerBlock = buildBooleanObjectBlock(entries, blk.indent + "  ");
      newText = newText.slice(0, blk.keyStart) + `${blk.indent}${key}: {${newInnerBlock}}` + (blk.hadTrailingComma ? "," : "") + newText.slice(blk.braceEnd + (blk.hadTrailingComma ? 2 : 1));
    } else {
      const vb = newValueBlock;
      const valInner = extractBlockInner(newText, vb);
      const insertion = `
${vb.indent}  ${key}: {${buildBooleanObjectBlock(entries, vb.indent + "  ")}},
${vb.indent}`;
      const replaced = valInner.replace(/\s*$/, "") + insertion;
      newText = replaceBlock(newText, vb, replaced);
    }
  };
  if (patch.resources) {
    rebuildNumericBlock(
      "resources",
      patch.resources.map((r) => ({
        id: r.id,
        value: Math.max(0, Number(r.amount) || 0)
      }))
    );
  }
  if (patch.relationships) {
    rebuildNumericBlock(
      "relationships",
      patch.relationships.map((r) => ({
        id: r.id,
        value: Number(r.level) || 0
      }))
    );
  }
  if (patch.unlockedCars) {
    rebuildBooleanBlock(
      "unlockedCars",
      patch.unlockedCars.map((c) => ({
        id: c.id,
        value: Boolean(c.unlocked)
      }))
    );
  }
  await writeEs3(filePath, newText);
  const fileId = extractFileId(text);
  const idForBackup = fileId || (() => {
    const ext = path.extname(path.basename(filePath));
    return ext ? path.basename(filePath).slice(0, -ext.length) : path.basename(filePath);
  })();
  await rotateBackups(
    path.join(path.dirname(filePath), ".backups", idForBackup),
    20
  );
  return { ok: true, backupPath };
}

// src/lib/pc2-dirs.ts
var pc2_dirs_exports = {};
__export(pc2_dirs_exports, {
  collectExistingDirs: () => collectExistingDirs,
  defaultPC2Dirs: () => defaultPC2Dirs
});
var path2 = __toESM(require("node:path"));
var fs2 = __toESM(require("node:fs/promises"));
var os = __toESM(require("node:os"));
function defaultPC2Dirs() {
  const dirs = [];
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir() || "";
  if (!home) return dirs;
  if (process.platform === "win32") {
    dirs.push(
      path2.join(
        home,
        "AppData",
        "LocalLow",
        "Codebrew Games Inc_",
        "Pocket City 2",
        "pocketcity2"
      )
    );
  } else if (process.platform === "darwin") {
    dirs.push(
      path2.join(
        home,
        "Library",
        "Application Support",
        "Codebrew Games Inc",
        "Pocket City 2",
        "pocketcity2"
      )
    );
  }
  return Array.from(new Set(dirs));
}
async function collectExistingDirs() {
  const dirs = defaultPC2Dirs().filter(Boolean);
  const out = [];
  for (const dir of dirs) {
    try {
      const st = await fs2.stat(dir);
      if (st.isDirectory()) out.push(dir);
    } catch {
    }
  }
  return out;
}

// src/lib/save-watcher.ts
var save_watcher_exports = {};
__export(save_watcher_exports, {
  ensureSaveWatchers: () => ensureSaveWatchers,
  onSaveChange: () => onSaveChange
});
var import_node_events = require("node:events");
var fs3 = __toESM(require("node:fs"));
var emitter = new import_node_events.EventEmitter();
emitter.setMaxListeners(50);
var watchers = /* @__PURE__ */ new Map();
var debounceTimer = null;
function scheduleChange() {
  if (debounceTimer) return;
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    invalidateSaveCache();
    emitter.emit("change");
  }, 200);
}
function handleWatcherEvent(eventType, filename) {
  if (typeof filename === "string") {
    const lower = filename.toLowerCase();
    if (!lower.endsWith(".es3")) return;
  }
  scheduleChange();
}
function attachWatcher(dir) {
  if (watchers.has(dir)) return;
  try {
    const watcher = fs3.watch(
      dir,
      { persistent: false },
      (eventType, filename) => {
        handleWatcherEvent(eventType, filename ?? void 0);
      }
    );
    watcher.on("error", () => {
      watcher.close();
      watchers.delete(dir);
    });
    watchers.set(dir, watcher);
  } catch {
  }
}
async function ensureSaveWatchers(dirs) {
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
function onSaveChange(listener) {
  emitter.on("change", listener);
  return () => {
    emitter.off("change", listener);
  };
}

// src/lib/pc2/data/resources.ts
var resources_exports = {};
__export(resources_exports, {
  RESOURCE_IDS: () => RESOURCE_IDS,
  RESOURCE_MAX_ID: () => RESOURCE_MAX_ID,
  RESOURCE_NAMES: () => RESOURCE_NAMES,
  resourceName: () => resourceName
});
var RESOURCE_NAMES = {
  0: "Food",
  1: "Wood",
  2: "Ore",
  3: "Rare Ore",
  4: "Metal",
  5: "Electronic Components",
  6: "Consumer Goods",
  7: "Intellectual Property",
  8: "Seedling",
  9: "Bag of Soil"
};
var RESOURCE_IDS = Object.keys(RESOURCE_NAMES).map(Number);
var RESOURCE_MAX_ID = 9;
function resourceName(id) {
  return RESOURCE_NAMES[id] ?? `Resource #${id}`;
}

// src/lib/pc2/data/npcs.ts
var npcs_exports = {};
__export(npcs_exports, {
  KNOWN_NPC_IDS: () => KNOWN_NPC_IDS,
  NPC_NAMES: () => NPC_NAMES,
  npcName: () => npcName
});
var NPC_NAMES = {
  0: "Anna",
  1: "Officer Olivia",
  2: "Chief Franklin",
  3: "Barbara",
  4: "Shawnathan",
  5: "Small Business Owners",
  6: "Ethan",
  7: "Doctor Denise",
  9: "Charles",
  10: "Ranger Patrick",
  11: "Megan",
  12: "Vivian",
  13: "Ruby",
  50: "Citizens",
  54: "Eddie",
  75: "Workers"
};
var KNOWN_NPC_IDS = Object.keys(NPC_NAMES).map(Number);
function npcName(id) {
  return NPC_NAMES[id] ?? `NPC #${id}`;
}

// src/lib/pc2/data/cars.ts
var cars_exports = {};
__export(cars_exports, {
  CAR_MAX_ID_DEFAULT: () => CAR_MAX_ID_DEFAULT2,
  CAR_SLOT_COUNT: () => CAR_SLOT_COUNT
});
var CAR_MAX_ID_DEFAULT2 = 26;
var CAR_SLOT_COUNT = CAR_MAX_ID_DEFAULT2 + 1;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cars,
  npcs,
  pc2Dirs,
  pc2Saves,
  resources,
  saveWatcher
});
