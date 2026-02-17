// Pocket City 2 save utilities (backend-only, pure exported functions)
// - Implements tolerant ES3 (gzip) I/O with JSON5 parsing and numeric key quoting
// - Fallback regex patching for specific blocks and scalars
// - Backup utilities for saves and global settings
// - Comments intentionally in English as requested

import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as fscb from "node:fs";
import JSON5 from "json5";
import { gzip, ungzip } from "pako";

// -----------------------------
// Types
// -----------------------------

export type SaveRelationship = { id: number; level: number };
export type SaveResource = { id: number; amount: number; name?: string };
export type SaveCar = { id: number; unlocked: boolean };

export type SavePatch = Partial<{
  name: string;
  money: number;
  researchPoints: number;
  day: number;
  dayProgress: number;
  difficulty: number;
  level: number;
  mapSize: number;
  sandbox: boolean;
  resources: SaveResource[];
  relationships: SaveRelationship[];
  unlockedCars: SaveCar[];
}>;

export const CAR_MAX_ID_DEFAULT = 26;

// -----------------------------
// Helpers
// -----------------------------

const td = new TextDecoder("utf-8");
const te = new TextEncoder();

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

function safeNumber(n: unknown, fallback = 0): number {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string") {
    const parsed = Number(n);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function sortById<T extends { id: number }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => a.id - b.id);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

function fileExists(p: string): Promise<boolean> {
  return fs
    .access(p)
    .then(() => true)
    .catch(() => false);
}

// -----------------------------
// 9) Core ES3 I/O + Loose JSON
// -----------------------------

export async function readEs3(
  filePath: string,
): Promise<{ text: string; innerName: string | null }>;
export async function readEs3(
  filePath: string,
): Promise<{ text: string; innerName: string | null }> {
  const data = await fs.readFile(filePath);
  // Decompress to bytes, then decode as UTF-8
  const u8 = ungzip(data);
  const text =
    typeof (u8 as any).buffer === "undefined"
      ? td.decode(u8 as any)
      : td.decode(u8 as Uint8Array);
  // Pako ungzip result does not expose header; we cannot reliably extract original name
  return { text, innerName: null };
}

export async function writeEs3(
  filePath: string,
  text: string,
  innerNameGuess?: string,
): Promise<void>;
export async function writeEs3(
  filePath: string,
  text: string,
  innerNameGuess?: string,
): Promise<void> {
  const nameForHeader = innerNameGuess ?? path.basename(filePath);
  const input = te.encode(text);
  // Include gzip header name when possible (pako supports header.name)
  const gz = gzip(input, { header: { name: nameForHeader } } as any);
  await fs.writeFile(filePath, gz);
}

export function parseLooseJson(text: string): any {
  // Remove BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  // Quote numeric keys only when used as object property keys.
  // Pattern: (^|[{,]\s*)(<digits>)\s*:
  text = text.replace(/([\[{,]\s*)(\d+)\s*:/g, '$1"$2":');
  // JSON5 tolerant parse
  return JSON5.parse(text);
}

function stringifyWithUnquotedNumericKeys(obj: any): string {
  const s = JSON.stringify(obj, null, 2);
  // Unquote numeric keys: "123": -> 123:
  return s.replace(/"(\d+)"\s*:/g, "$1:");
}

// -----------------------------
// Fallback parsing helpers (regex + balanced braces)
// -----------------------------

type BlockPos = {
  keyStart: number;
  braceStart: number;
  braceEnd: number;
  hadTrailingComma: boolean;
  indent: string;
};

function isIdChar(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function scanBalancedBraces(text: string, openIndex: number): number {
  // Returns index of matching '}' for the '{' at openIndex. Throws if not found.
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

    // Not inside string/comment
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

function findFirstBlock(
  text: string,
  key: string,
  withinStart = 0,
  withinEnd = text.length,
): BlockPos | null {
  const slice = text.slice(withinStart, withinEnd);
  const keyRe = new RegExp(
    `([\\{,\n\r\t\s])("?${escapeRegExp(key)}"?)\\s*:\\s*\\{`,
    "g",
  );
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(slice))) {
    const absIndex = withinStart + m.index;
    const matchStr = m[0];
    const braceRelIdx = matchStr.lastIndexOf("{");
    const braceStart = absIndex + braceRelIdx;
    try {
      const braceEnd = scanBalancedBraces(text, braceStart);
      // Determine indentation based on line start
      const lineStart = text.lastIndexOf("\n", absIndex) + 1;
      const indent =
        text.slice(lineStart, absIndex).match(/^[\t ]*/)?.[0] ?? "";
      // Trailing comma detection
      let hadComma = false;
      const after = text.slice(braceEnd + 1);
      const m2 = after.match(/^([\t\r\n ]*),/);
      if (m2) hadComma = true;
      return {
        keyStart: absIndex,
        braceStart,
        braceEnd,
        hadTrailingComma: hadComma,
        indent,
      };
    } catch {
      // Continue looking
    }
  }
  return null;
}

function findBlockByPath(text: string, pathKeys: string[]): BlockPos | null {
  let withinStart = 0;
  let withinEnd = text.length;
  for (let i = 0; i < pathKeys.length; i++) {
    const key = pathKeys[i];
    const pos = findFirstBlock(text, key, withinStart, withinEnd);
    if (!pos) return null;
    withinStart = pos.braceStart;
    withinEnd = pos.braceEnd + 1;
  }
  // Return the last block found
  return (
    findFirstBlock(
      text,
      pathKeys[pathKeys.length - 1],
      withinStart,
      withinEnd,
    ) ?? null
  );
}

function findPathBlock(
  text: string,
  pathKeys: string[],
): { start: number; end: number; indent: string } | null {
  // This finds the object block for the last key in pathKeys inside the path chain.
  // Example: path ["CITY", "value"] returns the { ... } block of value.
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

function extractBlockInner(
  text: string,
  pos: { start: number; end: number },
): string {
  return text.slice(pos.start + 1, pos.end);
}

function replaceBlock(
  text: string,
  block: { start: number; end: number },
  newInner: string,
): string {
  return text.slice(0, block.start + 1) + newInner + text.slice(block.end);
}

function parseNumericObjectBlock(inner: string): Record<number, number> {
  const result: Record<number, number> = {};
  // Rough parse: lines like 123: 45, or 12: -3,
  const re = /(\d+)\s*:\s*(-?\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const id = Number(m[1]);
    const num = Number(m[2]);
    if (Number.isFinite(id) && Number.isFinite(num)) {
      result[id] = num;
    }
  }
  return result;
}

function parseBooleanObjectBlock(inner: string): Record<number, boolean> {
  const result: Record<number, boolean> = {};
  const re = /(\d+)\s*:\s*(true|false)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(inner))) {
    const id = Number(m[1]);
    const val = m[2] === "true";
    if (Number.isFinite(id)) result[id] = val;
  }
  return result;
}

function buildNumericObjectBlock(
  entries: Array<{ id: number; value: number }>,
  indentBase: string,
): string {
  const innerIndent = indentBase + "  ";
  const lines = entries
    .sort((a, b) => a.id - b.id)
    .map((e) => `${innerIndent}${e.id}: ${e.value},`);
  return "\n" + lines.join("\n") + "\n" + indentBase;
}

function buildBooleanObjectBlock(
  entries: Array<{ id: number; value: boolean }>,
  indentBase: string,
): string {
  const innerIndent = indentBase + "  ";
  const lines = entries
    .sort((a, b) => a.id - b.id)
    .map((e) => `${innerIndent}${e.id}: ${e.value ? "true" : "false"},`);
  return "\n" + lines.join("\n") + "\n" + indentBase;
}

function getScalarInBlock(inner: string, key: string): string | null {
  const re = new RegExp(
    `(^|[\n\r,\s])(?:\"?${escapeRegExp(key)}\"?)\s*:\s*([^,\n\r}]+)`,
    "m",
  );
  const m = inner.match(re);
  return m ? m[2].trim() : null;
}

function extractStringScalarLoose(text: string, key: string): string {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*"([^"\\r\\n]*)"`,
    "i",
  );
  const match = re.exec(text);
  return match ? match[1] : "";
}

function extractNumberScalarLoose(text: string, key: string): number {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*(-?\\d+(?:\\.\\d+)?)`,
    "i",
  );
  const match = re.exec(text);
  if (!match) return 0;
  const num = Number(match[1]);
  return Number.isFinite(num) ? num : 0;
}

function extractBooleanScalarLoose(text: string, key: string): boolean {
  const re = new RegExp(
    `["']?${escapeRegExp(key)}["']?\\s*:\\s*(true|false)`,
    "i",
  );
  const match = re.exec(text);
  return match ? match[1].toLowerCase() === "true" : false;
}

function setScalarInBlock(
  inner: string,
  key: string,
  rawValue: string,
  indentBase: string,
): string {
  // Replace existing key value if found, else insert before closing '}'
  const keyRe = new RegExp(
    `(^[\t ]*)(\"?${escapeRegExp(key)}\"?\s*:\\s*)([^,\n\r}]+)`,
    "m",
  );
  const m = inner.match(keyRe);
  if (m && typeof m.index === "number") {
    const start = m.index;
    const pre = inner.slice(0, start) + m[1] + m[2];
    const postStart = start + m[0].length;
    const post = inner.slice(postStart);
    return pre + rawValue + post;
  }
  // Insert new line before end
  const innerIndent = indentBase + "  ";
  const trimmed = inner.trimEnd();
  const trailingWS = inner.slice(trimmed.length);
  const insertion = `${inner.length && !inner.trim() ? "" : "\n"}${innerIndent}${key}: ${rawValue},\n${indentBase}`;
  const newInner = trimmed + insertion + trailingWS;
  return newInner;
}

// -----------------------------
// 1) NPC (relationships)
// -----------------------------

export async function readSaveRelationships(
  filePath: string,
): Promise<SaveRelationship[]> {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const relObj: Record<string, number> | undefined =
      obj?.CITY?.value?.relationships;
    if (relObj && typeof relObj === "object") {
      const arr: SaveRelationship[] = Object.keys(relObj)
        .map((k) => ({
          id: Number(k),
          level: safeNumber((relObj as any)[k], 0),
        }))
        .filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
    // Fallback below
  }
  // Fallback regex block
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const relPos = findFirstBlock(
      text,
      "relationships",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!relPos) return [];
    const inner = extractBlockInner(text, {
      start: relPos.braceStart,
      end: relPos.braceEnd,
    });
    const map = parseNumericObjectBlock(inner);
    const arr: SaveRelationship[] = Object.keys(map).map((k) => ({
      id: Number(k),
      level: map[Number(k)],
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}

export async function writeSaveRelationships(
  filePath: string,
  relationships: Array<{ id: number; level: number }>,
): Promise<{ ok: boolean; backupPath?: string; fallback?: boolean }> {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  // Strict path: JSON5 parse
  try {
    const obj = parseLooseJson(text);
    if (!obj?.CITY?.value) throw new Error("Missing CITY.value");
    const r: Record<string, number> = {
      ...(obj.CITY.value.relationships || {}),
    };
    for (const { id, level } of relationships) {
      r[String(id)] = Number(level) || 0;
    }
    obj.CITY.value.relationships = r;
    const out = stringifyWithUnquotedNumericKeys(obj);
    await writeEs3(filePath, out);
    return { ok: true, backupPath };
  } catch {
    // Fallback: regex rebuild of the relationships block only
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const relPos = findFirstBlock(
      text,
      "relationships",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!relPos) {
      // Attempt to insert a brand-new relationships block inside value
      const block = valuePos;
      if (!block) return { ok: false, backupPath, fallback: true };
      const innerOld = extractBlockInner(text, block);
      const newInnerBlock = buildNumericObjectBlock(
        relationships.map((x) => ({ id: x.id, value: Number(x.level) || 0 })),
        block.indent + "  ",
      );
      const insertion = `\n${block.indent}  relationships: {${newInnerBlock}},\n${block.indent}`;
      const newInner = innerOld.replace(/\s*$/, "") + insertion;
      const newText = replaceBlock(text, block, newInner);
      await writeEs3(filePath, newText);
      return { ok: true, backupPath, fallback: true };
    }
    const block = { start: relPos.braceStart, end: relPos.braceEnd };
    const indentBase = relPos.indent + "  ";
    const newInnerBlock = buildNumericObjectBlock(
      relationships.map((x) => ({ id: x.id, value: Number(x.level) || 0 })),
      indentBase,
    );
    const newText =
      text.slice(0, relPos.keyStart) +
      `${relPos.indent}relationships: {${newInnerBlock}}` +
      (relPos.hadTrailingComma ? "," : "") +
      text.slice(relPos.braceEnd + (relPos.hadTrailingComma ? 2 : 1));
    await writeEs3(filePath, newText);
    return { ok: true, backupPath, fallback: true };
  }
}

// -----------------------------
// 2) Resources
// -----------------------------

export async function readSaveResources(
  filePath: string,
): Promise<SaveResource[]> {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const resObj: Record<string, number> | undefined =
      obj?.CITY?.value?.resources;
    if (resObj && typeof resObj === "object") {
      const arr: SaveResource[] = Object.keys(resObj)
        .map((k) => ({
          id: Number(k),
          amount: Math.max(0, safeNumber((resObj as any)[k], 0)),
        }))
        .filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
    // Fallback below
  }
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const resPos = findFirstBlock(
      text,
      "resources",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!resPos) return [];
    const inner = extractBlockInner(text, {
      start: resPos.braceStart,
      end: resPos.braceEnd,
    });
    const map = parseNumericObjectBlock(inner);
    const arr: SaveResource[] = Object.keys(map).map((k) => ({
      id: Number(k),
      amount: Math.max(0, map[Number(k)]),
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}

export async function writeSaveResources(
  filePath: string,
  resources: Array<{ id: number; amount: number }>,
): Promise<{ ok: boolean; backupPath?: string; fallback?: boolean }> {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    if (!obj?.CITY?.value) throw new Error("Missing CITY.value");
    const r: Record<string, number> = { ...(obj.CITY.value.resources || {}) };
    for (const { id, amount } of resources) {
      r[String(id)] = Math.max(0, Number(amount) || 0);
    }
    obj.CITY.value.resources = r;
    const out = stringifyWithUnquotedNumericKeys(obj);
    await writeEs3(filePath, out);
    return { ok: true, backupPath };
  } catch {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const resPos = findFirstBlock(
      text,
      "resources",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!resPos) {
      const block = valuePos;
      if (!block) return { ok: false, backupPath, fallback: true };
      const innerOld = extractBlockInner(text, block);
      const newInnerBlock = buildNumericObjectBlock(
        resources.map((x) => ({
          id: x.id,
          value: Math.max(0, Number(x.amount) || 0),
        })),
        block.indent + "  ",
      );
      const insertion = `\n${block.indent}  resources: {${newInnerBlock}},\n${block.indent}`;
      const newInner = innerOld.replace(/\s*$/, "") + insertion;
      const newText = replaceBlock(text, block, newInner);
      await writeEs3(filePath, newText);
      return { ok: true, backupPath, fallback: true };
    }
    const newInnerBlock = buildNumericObjectBlock(
      resources.map((x) => ({
        id: x.id,
        value: Math.max(0, Number(x.amount) || 0),
      })),
      resPos.indent + "  ",
    );
    const newText =
      text.slice(0, resPos.keyStart) +
      `${resPos.indent}resources: {${newInnerBlock}}` +
      (resPos.hadTrailingComma ? "," : "") +
      text.slice(resPos.braceEnd + (resPos.hadTrailingComma ? 2 : 1));
    await writeEs3(filePath, newText);
    return { ok: true, backupPath, fallback: true };
  }
}

// -----------------------------
// 3) Vehicles (unlockedCars)
// -----------------------------

export async function readSaveCars(filePath: string): Promise<SaveCar[]> {
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const carObj: Record<string, boolean> | undefined =
      obj?.CITY?.value?.unlockedCars;
    if (carObj && typeof carObj === "object") {
      const arr: SaveCar[] = Object.keys(carObj)
        .map((k) => ({ id: Number(k), unlocked: Boolean((carObj as any)[k]) }))
        .filter((e) => Number.isFinite(e.id));
      return sortById(arr);
    }
  } catch {
    // Fallback below
  }
  try {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const carPos = findFirstBlock(
      text,
      "unlockedCars",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!carPos) return [];
    const inner = extractBlockInner(text, {
      start: carPos.braceStart,
      end: carPos.braceEnd,
    });
    const map = parseBooleanObjectBlock(inner);
    const arr: SaveCar[] = Object.keys(map).map((k) => ({
      id: Number(k),
      unlocked: map[Number(k)],
    }));
    return sortById(arr);
  } catch {
    return [];
  }
}

export async function writeSaveCars(
  filePath: string,
  cars: Array<{ id: number; unlocked: boolean }>,
): Promise<{ ok: boolean; backupPath?: string; fallback?: boolean }> {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    if (!obj?.CITY?.value) throw new Error("Missing CITY.value");
    const r: Record<string, boolean> = {
      ...(obj.CITY.value.unlockedCars || {}),
    };
    for (const { id, unlocked } of cars) {
      r[String(id)] = Boolean(unlocked);
    }
    obj.CITY.value.unlockedCars = r;
    const out = stringifyWithUnquotedNumericKeys(obj);
    await writeEs3(filePath, out);
    return { ok: true, backupPath };
  } catch {
    const valuePos = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const carPos = findFirstBlock(
      text,
      "unlockedCars",
      valuePos.start,
      valuePos.end + 1,
    );
    if (!carPos) {
      const block = valuePos;
      if (!block) return { ok: false, backupPath, fallback: true };
      const innerOld = extractBlockInner(text, block);
      const newInnerBlock = buildBooleanObjectBlock(
        cars.map((x) => ({ id: x.id, value: Boolean(x.unlocked) })),
        block.indent + "  ",
      );
      const insertion = `\n${block.indent}  unlockedCars: {${newInnerBlock}},\n${block.indent}`;
      const newInner = innerOld.replace(/\s*$/, "") + insertion;
      const newText = replaceBlock(text, block, newInner);
      await writeEs3(filePath, newText);
      return { ok: true, backupPath, fallback: true };
    }
    const newInnerBlock = buildBooleanObjectBlock(
      cars.map((x) => ({ id: x.id, value: Boolean(x.unlocked) })),
      carPos.indent + "  ",
    );
    const newText =
      text.slice(0, carPos.keyStart) +
      `${carPos.indent}unlockedCars: {${newInnerBlock}}` +
      (carPos.hadTrailingComma ? "," : "") +
      text.slice(carPos.braceEnd + (carPos.hadTrailingComma ? 2 : 1));
    await writeEs3(filePath, newText);
    return { ok: true, backupPath, fallback: true };
  }
}

// -----------------------------
// 4) Scalar fields patching
// -----------------------------

export type ScalarPatch = Partial<{
  name: string;
  money: number;
  researchPoints: number;
  day: number;
  dayProgress: number;
  difficulty: number;
  level: number;
  mapSize: number;
  sandbox: boolean;
}>;

export async function patchSaveScalars(
  filePath: string,
  patch: ScalarPatch,
): Promise<{ ok: boolean; backupPath?: string; fallback?: boolean }> {
  const backup = await createSaveBackup(filePath).catch(() => null);
  const backupPath = backup?.backupPath;
  const { text } = await readEs3(filePath);
  try {
    const obj = parseLooseJson(text);
    const value = obj?.CITY?.value;
    if (!value) throw new Error("Missing CITY.value");

    // Apply patch with business rules
    if (typeof patch.name === "string") value.name = patch.name;
    if (typeof patch.money === "number") value.money = patch.money;
    if (typeof patch.researchPoints === "number")
      value.researchPoints = patch.researchPoints;
    if (typeof patch.day === "number") value.day = patch.day;
    if (typeof patch.dayProgress === "number")
      value.dayProgress = patch.dayProgress;
    if (typeof patch.difficulty === "number")
      value.difficulty = patch.difficulty;
    if (typeof patch.level === "number") value.level = patch.level;

    if (typeof patch.mapSize === "number") {
      const newVal = clamp(patch.mapSize, 40, 88);
      const cur = safeNumber(value.mapSize, newVal);
      value.mapSize = Math.max(cur, newVal);
    }

    if (typeof patch.sandbox === "boolean") {
      const isSurvival = Boolean(value.isSurvivalMode);
      if (!isSurvival) {
        value.unlockAll = patch.sandbox;
        value.infiniteMoney = patch.sandbox;
        value.maxLevel = patch.sandbox;
      }
      // In Survival: ignore silently
    }

    const out = stringifyWithUnquotedNumericKeys(obj);
    await writeEs3(filePath, out);
    return { ok: true, backupPath };
  } catch {
    // Fallback via regex setters
    const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    const inner = extractBlockInner(text, valueBlock);

    let innerNew = inner;
    const indentBase = valueBlock.indent + "  ";

    const readBool = (key: string) => {
      const v = getScalarInBlock(innerNew, key);
      if (v == null) return null;
      return /true/.test(v) ? true : /false/.test(v) ? false : null;
    };
    const readNum = (key: string) => {
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
        valueBlock.indent,
      );
    }
    if (typeof patch.researchPoints === "number") {
      innerNew = setScalarInBlock(
        innerNew,
        "researchPoints",
        String(patch.researchPoints),
        valueBlock.indent,
      );
    }
    if (typeof patch.day === "number") {
      innerNew = setScalarInBlock(
        innerNew,
        "day",
        String(patch.day),
        valueBlock.indent,
      );
    }
    if (typeof patch.dayProgress === "number") {
      innerNew = setScalarInBlock(
        innerNew,
        "dayProgress",
        String(patch.dayProgress),
        valueBlock.indent,
      );
    }
    if (typeof patch.difficulty === "number") {
      innerNew = setScalarInBlock(
        innerNew,
        "difficulty",
        String(patch.difficulty),
        valueBlock.indent,
      );
    }
    if (typeof patch.level === "number") {
      innerNew = setScalarInBlock(
        innerNew,
        "level",
        String(patch.level),
        valueBlock.indent,
      );
    }
    if (typeof patch.mapSize === "number") {
      const cur = readNum("mapSize") ?? 40;
      const eff = Math.max(cur, clamp(patch.mapSize, 40, 88));
      innerNew = setScalarInBlock(
        innerNew,
        "mapSize",
        String(eff),
        valueBlock.indent,
      );
    }
    if (typeof patch.sandbox === "boolean") {
      const isSurvival = readBool("isSurvivalMode") ?? false;
      if (!isSurvival) {
        innerNew = setScalarInBlock(
          innerNew,
          "unlockAll",
          patch.sandbox ? "true" : "false",
          valueBlock.indent,
        );
        innerNew = setScalarInBlock(
          innerNew,
          "infiniteMoney",
          patch.sandbox ? "true" : "false",
          valueBlock.indent,
        );
        innerNew = setScalarInBlock(
          innerNew,
          "maxLevel",
          patch.sandbox ? "true" : "false",
          valueBlock.indent,
        );
      }
    }

    const newText = replaceBlock(text, valueBlock, innerNew);
    await writeEs3(filePath, newText);
    return { ok: true, backupPath, fallback: true };
  }
}

// -----------------------------
// 5) Tolerant snapshot (read-only)
// -----------------------------

export async function readSaveSnapshot(filePath: string): Promise<{
  FILE_ID: string;
  name: string;
  parentCity: string;
  difficulty: number;
  mapSize: number;
  day: number;
  dayProgress: number;
  money: number;
  researchPoints: number;
  level: number;
  isSurvivalMode: boolean;
  unlockAll: boolean;
  infiniteMoney: boolean;
  maxLevel: boolean;
  sandboxEnabled: boolean;
  resources: { id: number; name?: string; amount: number }[];
  relationships: { id: number; name?: string; level: number }[];
  unlockedCars: { id: number; unlocked: boolean }[];
}> {
  let text: string = "";
  try {
    text = (await readEs3(filePath)).text;
  } catch {
    // Return minimal empty snapshot if can't read the file at all
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
      unlockedCars: [],
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

    const resObj: Record<string, number> = value?.resources || {};
    const relObj: Record<string, number> = value?.relationships || {};
    const carObj: Record<string, boolean> = value?.unlockedCars || {};

    const resources: SaveResource[] = Object.keys(resObj).map((k) => ({
      id: Number(k),
      amount: Math.max(0, safeNumber((resObj as any)[k], 0)),
    }));
    const relationships: SaveRelationship[] = Object.keys(relObj).map((k) => ({
      id: Number(k),
      level: safeNumber((relObj as any)[k], 0),
    }));
    const unlockedCars: SaveCar[] = Object.keys(carObj).map((k) => ({
      id: Number(k),
      unlocked: Boolean((carObj as any)[k]),
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
      unlockedCars: sortById(unlockedCars),
    };
  } catch {
    // Regex tolerant fallback
    const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
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
      valueBlock.end + 1,
    );
    const relPos = findFirstBlock(
      text,
      "relationships",
      valueBlock.start,
      valueBlock.end + 1,
    );
    const carPos = findFirstBlock(
      text,
      "unlockedCars",
      valueBlock.start,
      valueBlock.end + 1,
    );

    const resources: SaveResource[] = resPos
      ? sortById(
          Object.entries(
            parseNumericObjectBlock(
              extractBlockInner(text, {
                start: resPos.braceStart,
                end: resPos.braceEnd,
              }),
            ),
          ).map(([k, v]) => ({
            id: Number(k),
            amount: Math.max(0, Number(v) || 0),
          })),
        )
      : [];
    const relationships: SaveRelationship[] = relPos
      ? sortById(
          Object.entries(
            parseNumericObjectBlock(
              extractBlockInner(text, {
                start: relPos.braceStart,
                end: relPos.braceEnd,
              }),
            ),
          ).map(([k, v]) => ({ id: Number(k), level: Number(v) || 0 })),
        )
      : [];
    const unlockedCars: SaveCar[] = carPos
      ? sortById(
          Object.entries(
            parseBooleanObjectBlock(
              extractBlockInner(text, {
                start: carPos.braceStart,
                end: carPos.braceEnd,
              }),
            ),
          ).map(([k, v]) => ({ id: Number(k), unlocked: Boolean(v) })),
        )
      : [];

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
      unlockedCars,
    };
  }
}

// -----------------------------
// 6) Scan of saves + Grouping + Cache
// -----------------------------

/** Module-level cache for scan results — invalidated by the file watcher. */
let _scanCache: Awaited<ReturnType<typeof scanAllSaves>> | null = null;
let _scanCacheValid = false;

/** Called from save-watcher when files change on disk. */
export function invalidateSaveCache(): void {
  _scanCacheValid = false;
  _scanCache = null;
}

/** Cached version of scanAllSaves. Returns previous results if nothing changed. */
export async function scanAllSavesCached(
  startDirs: string[],
): Promise<Awaited<ReturnType<typeof scanAllSaves>>> {
  if (_scanCacheValid && _scanCache) return _scanCache;
  _scanCache = await scanAllSaves(startDirs);
  _scanCacheValid = true;
  return _scanCache;
}

export async function scanAllSaves(startDirs: string[]): Promise<
  Array<{
    filePath: string;
    fileName: string;
    tag: "auto" | "manual" | "unknown";
    sizeBytes: number;
    mtime: number;
    meta: {
      FILE_ID: string;
      name: string;
      parentCity: string;
      difficulty: number | null;
      mapSize: number | null;
      day: number | null;
      dayProgress: number | null;
      money: number | null;
      level: number | null;
      isSurvivalMode: boolean;
      sandboxEnabled: boolean;
      unlockAll: boolean;
      infiniteMoney: boolean;
      maxLevel: boolean;
      tolerant?: boolean;
      parseError?: boolean;
      error?: string;
    };
    isRoot: boolean;
    groupId: string;
    displayName: string;
  }>
> {
  const results: Array<any> = [];

  // Walk directories recursively, ignoring backup folders
  async function walk(dir: string): Promise<void> {
    let entries: fscb.Dirent[];
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
          const tag = fileName.includes("_auto_")
            ? "auto"
            : fileName.includes("_manual_")
              ? "manual"
              : "unknown";
          let parseError = false;
          let tolerant = false;
          let snapshot: any;
          try {
            // Single read: reuse text for snapshot extraction
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
              error: (e2 as Error)?.message ?? String(e2),
            };
          }

          const fileId =
            typeof snapshot?.FILE_ID === "string"
              ? snapshot.FILE_ID.trim()
              : "";
          const parentCity =
            typeof snapshot?.parentCity === "string"
              ? snapshot.parentCity.trim()
              : "";
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
              tolerant: tolerant || undefined,
              parseError: parseError || undefined,
            },
            isRoot,
            groupId,
            displayName,
          });
        } catch (err) {
          // Skip problematic file silently
        }
      }
    }
  }

  for (const start of startDirs) {
    await walk(start);
  }

  return results;
}

// -----------------------------
// 7) Backups (saves + globals)
// -----------------------------

export async function createSaveBackup(
  filePath: string,
): Promise<{ backupPath: string }> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const backupDir = path.join(dir, ".backups", base);
  await ensureDir(backupDir);
  const ts = new Date();
  const yyyy = ts.getFullYear();
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const dd = String(ts.getDate()).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  const ss = String(ts.getSeconds()).padStart(2, "0");
  const name = `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.es3`;
  const backupPath = path.join(backupDir, name);
  await fs.copyFile(filePath, backupPath);
  return { backupPath };
}

export async function rotateBackups(
  backupDir: string,
  keep = 20,
): Promise<void> {
  let entries: fscb.Dirent[];
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
    }),
  );
  stats.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const toDelete = stats.slice(keep);
  await Promise.all(toDelete.map((f) => fs.unlink(f.full).catch(() => void 0)));
}

export async function listSaveBackups(
  filePath: string,
): Promise<
  Array<{ name: string; backupPath: string; sizeBytes: number; mtime: number }>
> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  const backupDir = path.join(dir, ".backups", base);
  let entries: fscb.Dirent[];
  try {
    entries = await fs.readdir(backupDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const items = await Promise.all(
    entries
      .filter((e) => e.isFile())
      .map(async (e) => {
        const full = path.join(backupDir, e.name);
        const st = await fs.stat(full);
        return {
          name: e.name,
          backupPath: full,
          sizeBytes: st.size,
          mtime: st.mtimeMs ?? st.mtime.getTime(),
        };
      }),
  );
  items.sort((a, b) => b.mtime - a.mtime);
  return items;
}

export async function restoreSaveBackup(
  filePath: string,
  backupPath: string,
): Promise<{ ok: true }> {
  await fs.copyFile(backupPath, filePath);
  return { ok: true };
}

export async function deleteSave(filePath: string): Promise<{ ok: true }> {
  await fs.unlink(filePath);
  return { ok: true };
}

// Globals (survival_global_settings) backups use .gz
async function createGlobalBackupDir(dataDir: string): Promise<string> {
  const dir = path.join(dataDir, ".backups", "survival_global_settings");
  await ensureDir(dir);
  return dir;
}

// -----------------------------
// 8) Survival Global Settings
// -----------------------------

type GlobalEditable = {
  bestDayReachedEasy?: number;
  bestDayReachedHard?: number;
  bestDayReachedExpert?: number;
  highestStarsReachedEasy?: number;
  highestStarsReachedHard?: number;
  highestStarsReachedExpert?: number;
  highestPopulationReachedEasy?: number;
  highestPopulationReachedHard?: number;
  highestPopulationReachedExpert?: number;
  totalUpgradePoints?: number;
  upgradesSpent?: Record<number, number>;
};

export async function readGlobalSettings(dataDir: string): Promise<{
  exists: boolean;
  filePath: string;
  readonly: boolean;
  snapshot: { editable: GlobalEditable };
}> {
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
      snapshot: { editable: {} },
    };
  }
  const data = await fs.readFile(filePath);
  const u8 = ungzip(data);
  const text = td.decode(u8);
  const obj = parseLooseJson(text);
  const value = obj?.SETTINGS?.value ?? {};
  const editable: GlobalEditable = {};
  const copyNum = (k: keyof GlobalEditable, min: number, max: number) => {
    const v = safeNumber((value as any)[k], 0);
    (editable as any)[k] = clamp(v, min, max);
  };
  copyNum("bestDayReachedEasy", 0, 100);
  copyNum("bestDayReachedHard", 0, 100);
  copyNum("bestDayReachedExpert", 0, 100);
  copyNum("highestStarsReachedEasy", 0, 5);
  copyNum("highestStarsReachedHard", 0, 5);
  copyNum("highestStarsReachedExpert", 0, 5);
  copyNum("highestPopulationReachedEasy", 0, 999_999_999);
  copyNum("highestPopulationReachedHard", 0, 999_999_999);
  copyNum("highestPopulationReachedExpert", 0, 999_999_999);
  copyNum("totalUpgradePoints", 0, 999_999);
  const us = (value as any)?.upgradesSpent || {};
  const up: Record<number, number> = {};
  for (const k of Object.keys(us)) {
    const id = Number(k);
    if (!Number.isFinite(id)) continue;
    up[id] = safeNumber(us[k], 0);
  }
  editable.upgradesSpent = up;
  return { exists: true, filePath, readonly, snapshot: { editable } };
}

export async function writeGlobalSettings(
  dataDir: string,
  patch: GlobalEditable,
  createIfMissing = true,
): Promise<{ ok: boolean; filePath: string; backupPath?: string }> {
  const filePath = path.join(dataDir, "survival_global_settings");
  let obj: any = {};
  if (await fileExists(filePath)) {
    const gz = await fs.readFile(filePath);
    const text = td.decode(ungzip(gz));
    try {
      obj = parseLooseJson(text);
    } catch {
      obj = {};
    }
  } else if (!createIfMissing) {
    return { ok: false, filePath };
  }
  obj.SETTINGS = obj.SETTINGS || {};
  obj.SETTINGS.value = obj.SETTINGS.value || {};
  const value = obj.SETTINGS.value;

  // Preserve always (if exist), else defaults
  const lastDifficultySelection = safeNumber(value.lastDifficultySelection, 2);
  const disableUnspentUpgradeToCash = Boolean(
    value.disableUnspentUpgradeToCash ?? false,
  );

  // Apply editable patch with clamps
  const setClamped = (key: string, v: any, min: number, max: number) => {
    if (typeof v === "number") (value as any)[key] = clamp(v, min, max);
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
    5,
  );
  setClamped(
    "highestPopulationReachedEasy",
    patch.highestPopulationReachedEasy,
    0,
    999_999_999,
  );
  setClamped(
    "highestPopulationReachedHard",
    patch.highestPopulationReachedHard,
    0,
    999_999_999,
  );
  setClamped(
    "highestPopulationReachedExpert",
    patch.highestPopulationReachedExpert,
    0,
    999_999_999,
  );
  setClamped("totalUpgradePoints", patch.totalUpgradePoints, 0, 999_999);

  if (patch.upgradesSpent && typeof patch.upgradesSpent === "object") {
    const us: Record<string, number> = { ...(value.upgradesSpent || {}) };
    for (const [k, v] of Object.entries(patch.upgradesSpent)) {
      const id = Number(k);
      if (!Number.isFinite(id)) continue;
      const raw = safeNumber(v, 0);
      const cap = id === 3 ? 2 : 3;
      us[String(id)] = clamp(raw, 0, cap);
    }
    value.upgradesSpent = us;
  }

  // Restore preserved fields explicitly
  value.lastDifficultySelection = lastDifficultySelection;
  value.disableUnspentUpgradeToCash = disableUnspentUpgradeToCash;

  const text = stringifyWithUnquotedNumericKeys(obj);

  // Create backup (.gz) before writing
  const backupDir = await createGlobalBackupDir(dataDir);
  const ts = new Date();
  const yyyy = ts.getFullYear();
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const dd = String(ts.getDate()).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  const ss = String(ts.getSeconds()).padStart(2, "0");
  const backupName = `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.gz`;
  const backupPath = path.join(backupDir, backupName);
  try {
    const cur = await fs.readFile(filePath);
    await fs.writeFile(backupPath, cur);
  } catch {
    // ignore if current missing
  }

  // Write gz with header name
  const gz = gzip(te.encode(text), {
    header: { name: "survival_global_settings.out" },
  } as any);
  await fs.writeFile(filePath, gz);

  // Rotate global backups (keep last 20)
  await rotateBackups(backupDir, 20);

  return { ok: true, filePath, backupPath };
}

export async function deleteGlobalSettings(
  dataDir: string,
): Promise<{ ok: boolean; backupPath?: string }> {
  const filePath = path.join(dataDir, "survival_global_settings");
  const backupDir = await createGlobalBackupDir(dataDir);
  // Backup current .gz before deletion
  const ts = new Date();
  const yyyy = ts.getFullYear();
  const mm = String(ts.getMonth() + 1).padStart(2, "0");
  const dd = String(ts.getDate()).padStart(2, "0");
  const hh = String(ts.getHours()).padStart(2, "0");
  const mi = String(ts.getMinutes()).padStart(2, "0");
  const ss = String(ts.getSeconds()).padStart(2, "0");
  const backupName = `${yyyy}-${mm}-${dd}_${hh}-${mi}-${ss}.gz`;
  const backupPath = path.join(backupDir, backupName);
  try {
    const cur = await fs.readFile(filePath);
    await fs.writeFile(backupPath, cur);
  } catch {
    // ignore
  }
  await fs.unlink(filePath).catch(() => void 0);
  return { ok: true, backupPath };
}

// -----------------------------
// 11) Composite operation (write all at once)
// -----------------------------

export async function writeSaveFromPatch(
  filePath: string,
  patch: SavePatch,
): Promise<{ ok: boolean; backupPath?: string; fallback?: boolean }> {
  const { backupPath } = await createSaveBackup(filePath);
  const { text } = await readEs3(filePath);
  // Try strict parse first
  try {
    const obj = parseLooseJson(text);
    const value = obj?.CITY?.value;
    if (!value) throw new Error("Missing CITY.value");

    // Scalars
    if (typeof patch.name === "string") value.name = patch.name;
    if (typeof patch.money === "number") value.money = patch.money;
    if (typeof patch.researchPoints === "number")
      value.researchPoints = patch.researchPoints;
    if (typeof patch.day === "number") value.day = patch.day;
    if (typeof patch.dayProgress === "number")
      value.dayProgress = patch.dayProgress;
    if (typeof patch.difficulty === "number")
      value.difficulty = patch.difficulty;
    if (typeof patch.level === "number") value.level = patch.level;

    if (typeof patch.mapSize === "number") {
      const newVal = clamp(patch.mapSize, 40, 88);
      const cur = safeNumber(value.mapSize, newVal);
      value.mapSize = Math.max(cur, newVal);
    }

    if (typeof patch.sandbox === "boolean") {
      const isSurvival = Boolean(value.isSurvivalMode);
      if (!isSurvival) {
        value.unlockAll = patch.sandbox;
        value.infiniteMoney = patch.sandbox;
        value.maxLevel = patch.sandbox;
      }
    }

    // Collections
    if (patch.resources) {
      const objRes: Record<string, number> = { ...(value.resources || {}) };
      for (const r of patch.resources)
        objRes[String(r.id)] = Math.max(0, Number(r.amount) || 0);
      value.resources = objRes;
    }
    if (patch.relationships) {
      const objRel: Record<string, number> = { ...(value.relationships || {}) };
      for (const r of patch.relationships)
        objRel[String(r.id)] = Number(r.level) || 0;
      value.relationships = objRel;
    }
    if (patch.unlockedCars) {
      const objCar: Record<string, boolean> = { ...(value.unlockedCars || {}) };
      for (const c of patch.unlockedCars)
        objCar[String(c.id)] = Boolean(c.unlocked);
      value.unlockedCars = objCar;
    }

    const out = stringifyWithUnquotedNumericKeys(obj);
    await writeEs3(filePath, out);
    // Rotate backups
    await rotateBackups(
      path.join(path.dirname(filePath), ".backups", path.basename(filePath)),
      20,
    );
    return { ok: true, backupPath };
  } catch {
    // Fallback: regex setters
    const valueBlock = findPathBlock(text, ["CITY", "value"]) ?? {
      start: 0,
      end: text.length,
      indent: "",
    };
    let inner = extractBlockInner(text, valueBlock);
    const indent = valueBlock.indent;
    const readBool = (key: string) =>
      /true/.test(getScalarInBlock(inner, key) ?? "false");
    const readNum = (key: string) => {
      const v = getScalarInBlock(inner, key);
      const n = v == null ? NaN : Number(v);
      return Number.isFinite(n) ? n : NaN;
    };

    if (typeof patch.name === "string")
      inner = setScalarInBlock(
        inner,
        "name",
        JSON.stringify(patch.name),
        indent,
      );
    if (typeof patch.money === "number")
      inner = setScalarInBlock(inner, "money", String(patch.money), indent);
    if (typeof patch.researchPoints === "number")
      inner = setScalarInBlock(
        inner,
        "researchPoints",
        String(patch.researchPoints),
        indent,
      );
    if (typeof patch.day === "number")
      inner = setScalarInBlock(inner, "day", String(patch.day), indent);
    if (typeof patch.dayProgress === "number")
      inner = setScalarInBlock(
        inner,
        "dayProgress",
        String(patch.dayProgress),
        indent,
      );
    if (typeof patch.difficulty === "number")
      inner = setScalarInBlock(
        inner,
        "difficulty",
        String(patch.difficulty),
        indent,
      );
    if (typeof patch.level === "number")
      inner = setScalarInBlock(inner, "level", String(patch.level), indent);

    if (typeof patch.mapSize === "number") {
      const cur = readNum("mapSize");
      const eff = Math.max(
        Number.isFinite(cur) ? cur : 40,
        clamp(patch.mapSize, 40, 88),
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
          indent,
        );
        inner = setScalarInBlock(
          inner,
          "infiniteMoney",
          patch.sandbox ? "true" : "false",
          indent,
        );
        inner = setScalarInBlock(
          inner,
          "maxLevel",
          patch.sandbox ? "true" : "false",
          indent,
        );
      }
    }

    // Rebuild collections if provided
    const fullTextBefore = text;
    let newText = replaceBlock(fullTextBefore, valueBlock, inner);

    const rebuildNumericBlock = (
      key: string,
      entries: Array<{ id: number; value: number }>,
    ) => {
      const newValueBlock = findPathBlock(newText, ["CITY", "value"]) ?? {
        start: 0,
        end: newText.length,
        indent: "",
      };
      const blk = findFirstBlock(
        newText,
        key,
        newValueBlock.start,
        newValueBlock.end + 1,
      );
      if (blk) {
        const newInnerBlock = buildNumericObjectBlock(
          entries,
          blk.indent + "  ",
        );
        newText =
          newText.slice(0, blk.keyStart) +
          `${blk.indent}${key}: {${newInnerBlock}}` +
          (blk.hadTrailingComma ? "," : "") +
          newText.slice(blk.braceEnd + (blk.hadTrailingComma ? 2 : 1));
      } else {
        // Insert
        const vb = newValueBlock;
        const valInner = extractBlockInner(newText, vb);
        const insertion = `\n${vb.indent}  ${key}: {${buildNumericObjectBlock(entries, vb.indent + "  ")}},\n${vb.indent}`;
        const replaced = valInner.replace(/\s*$/, "") + insertion;
        newText = replaceBlock(newText, vb, replaced);
      }
    };
    const rebuildBooleanBlock = (
      key: string,
      entries: Array<{ id: number; value: boolean }>,
    ) => {
      const newValueBlock = findPathBlock(newText, ["CITY", "value"]) ?? {
        start: 0,
        end: newText.length,
        indent: "",
      };
      const blk = findFirstBlock(
        newText,
        key,
        newValueBlock.start,
        newValueBlock.end + 1,
      );
      if (blk) {
        const newInnerBlock = buildBooleanObjectBlock(
          entries,
          blk.indent + "  ",
        );
        newText =
          newText.slice(0, blk.keyStart) +
          `${blk.indent}${key}: {${newInnerBlock}}` +
          (blk.hadTrailingComma ? "," : "") +
          newText.slice(blk.braceEnd + (blk.hadTrailingComma ? 2 : 1));
      } else {
        const vb = newValueBlock;
        const valInner = extractBlockInner(newText, vb);
        const insertion = `\n${vb.indent}  ${key}: {${buildBooleanObjectBlock(entries, vb.indent + "  ")}},\n${vb.indent}`;
        const replaced = valInner.replace(/\s*$/, "") + insertion;
        newText = replaceBlock(newText, vb, replaced);
      }
    };

    if (patch.resources) {
      rebuildNumericBlock(
        "resources",
        patch.resources.map((r) => ({
          id: r.id,
          value: Math.max(0, Number(r.amount) || 0),
        })),
      );
    }
    if (patch.relationships) {
      rebuildNumericBlock(
        "relationships",
        patch.relationships.map((r) => ({
          id: r.id,
          value: Number(r.level) || 0,
        })),
      );
    }
    if (patch.unlockedCars) {
      rebuildBooleanBlock(
        "unlockedCars",
        patch.unlockedCars.map((c) => ({
          id: c.id,
          value: Boolean(c.unlocked),
        })),
      );
    }

    await writeEs3(filePath, newText);
    await rotateBackups(
      path.join(path.dirname(filePath), ".backups", path.basename(filePath)),
      20,
    );
    return { ok: true, backupPath, fallback: true };
  }
}
