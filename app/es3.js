// app/es3.js

const fs = require("fs");
const pako = require("pako");
const JSON5 = require("json5");

// --- read ---

function readEs3(filePath) {
  const gz = fs.readFileSync(filePath);
  const ungz = pako.ungzip(gz);
  const text = Buffer.from(ungz).toString("utf8");
  return { text, innerName: null };
}

// Quote bare numeric keys so JSON5 can parse (e.g. "{ 8: 1 }" -> "{ \"8\": 1 }")
function quoteNumericKeysLoose(txt) {
  if (!txt) return txt;
  const noBom = txt.replace(/\uFEFF/g, "");
  // Matches "{ 8:" or ", 9:" etc. Does not affect numbers in arrays/values.
  return noBom.replace(/([{,]\s*)(\d+)\s*:/g, '$1"$2":');
}

function parseLooseJson(text) {
  const fixed = quoteNumericKeysLoose(text);
  return JSON5.parse(fixed);
}

// --- write ---

function writeEs3(filePath, text, innerNameGuess) {
  const base = require("path").basename(filePath, ".es3");
  const data = Buffer.from(text, "utf8");
  const gz = pako.gzip(data, { name: innerNameGuess || base });
  fs.writeFileSync(filePath, Buffer.from(gz));
}

module.exports = {
  readEs3,
  parseLooseJson,
  writeEs3,
};
