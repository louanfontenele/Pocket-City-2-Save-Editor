// app/util.js

const fs = require("fs");
const path = require("path");

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function timestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

function isAutoOrManual(name) {
  const lower = name.toLowerCase();
  if (lower.includes("_auto_")) return "auto";
  if (lower.includes("_manual_")) return "manual";
  return "unknown";
}

function backupFolderFor(filePath) {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ".es3");
  return path.join(dir, ".backups", base);
}

function rotateBackups(backupDir, keep = 20) {
  if (!fs.existsSync(backupDir)) return;
  const entries = fs
    .readdirSync(backupDir)
    .filter((f) => f.endsWith(".es3"))
    .sort(
      (a, b) =>
        fs.statSync(path.join(backupDir, b)).mtimeMs -
        fs.statSync(path.join(backupDir, a)).mtimeMs
    );
  const excess = entries.slice(keep);
  excess.forEach((f) => fs.unlinkSync(path.join(backupDir, f)));
}

module.exports = {
  ensureDir,
  timestamp,
  isAutoOrManual,
  backupFolderFor,
  rotateBackups,
};
