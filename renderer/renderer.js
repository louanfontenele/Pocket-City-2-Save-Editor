// renderer/renderer.js
// Frontend logic: scanning, filtering, editing, bulk ops, and GLOBAL survival settings.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let allSaves = [];
let grouped = new Map();
let currentEdit = null;
let currentGroupId = null;

let homeSearch = "";
let homeTag = "all";
let mapSearch = "";
let mapTag = "all";

// Local resource names (UI only, mirrors constants.js)
const RESOURCE_NAMES = {
  0: "Food",
  1: "Wood",
  2: "Ore",
  3: "Rare Ore",
  4: "Metal",
  5: "Eletronic Components",
  6: "Consumer Goods",
  7: "Intellectual Property",
  8: "Seedling",
  9: "Bag of Soil",
};

// ---------- Sorting helpers ----------

/** Compare by extracted name (A→Z), then by mtime (desc). */
function compareByNameThenMtime(getName) {
  return (a, b) => {
    const nameA = (getName(a) || "").toString();
    const nameB = (getName(b) || "").toString();
    const byName = nameA.localeCompare(nameB);
    if (byName !== 0) return byName;
    return (b.mtime || 0) - (a.mtime || 0);
  };
}

// --- Theme ---

function applyTheme(mode) {
  document.documentElement.setAttribute("data-theme", mode);
  localStorage.setItem("pc2.theme", mode);
}
function initThemeButton() {
  $("#btnTheme").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") || "auto";
    const next = cur === "auto" ? "light" : cur === "light" ? "dark" : "auto";
    applyTheme(next);
  });
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if ((localStorage.getItem("pc2.theme") || "auto") === "auto")
      applyTheme("auto");
  });
}

// --- App init ---

async function init() {
  applyTheme(localStorage.getItem("pc2.theme") || "auto");
  initThemeButton();

  $("#btnHome").addEventListener("click", () =>
    showPage("pageHome", "btnHome")
  );
  $("#btnGlobals").addEventListener("click", async () => {
    showPage("pageGlobals", "btnGlobals");
    await loadGlobals();
  });
  $("#btnBackups").addEventListener("click", () =>
    showPage("pageBackups", "btnBackups")
  );
  $("#btnRescan").addEventListener("click", () => rescan());
  $("#btnChooseDir").addEventListener("click", async () => {
    const chosen = await window.pc2.openDirDialog();
    if (chosen) await rescan(chosen);
  });
  $("#btnBackToHome").addEventListener("click", () =>
    showPage("pageHome", "btnHome")
  );

  $("#drawerClose").addEventListener("click", closeDrawer);
  $("#editForm").addEventListener("submit", onSubmitEdit);
  $("#btnDeleteSave").addEventListener("click", onDeleteSave);
  $("#btnOpenBackupFolder").addEventListener("click", onRevealBackupFolder);

  // Search & filters
  $("#searchHome").addEventListener("input", (e) => {
    homeSearch = e.target.value.toLowerCase();
    renderRootGrid();
  });
  $$("input[name='tagHome']").forEach((r) =>
    r.addEventListener("change", (e) => {
      homeTag = e.target.value;
      renderRootGrid();
    })
  );
  $("#searchMap").addEventListener("input", (e) => {
    mapSearch = e.target.value.toLowerCase();
    renderMapDetail(currentGroupId);
  });
  $$("input[name='tagMap']").forEach((r) =>
    r.addEventListener("change", (e) => {
      mapTag = e.target.value;
      renderMapDetail(currentGroupId);
    })
  );

  // Bulk buttons (All)
  $("#btnMaxAll").addEventListener("click", () => bulkSetAll());
  $("#btnResetAll").addEventListener("click", () => bulkResetAll());
  $("#btnSetDay100All").addEventListener("click", () => bulkSetDay100All());
  $("#btnEnableSandboxAll").addEventListener("click", () =>
    bulkSandboxAll(true)
  );
  $("#btnDisableSandboxAll").addEventListener("click", () =>
    bulkSandboxAll(false)
  );

  // Bulk buttons (This map)
  $("#btnMaxThis").addEventListener("click", () => bulkSetThis());
  $("#btnResetThis").addEventListener("click", () => bulkResetThis());
  $("#btnSetDay100This").addEventListener("click", () => bulkSetDay100This());
  $("#btnEnableSandboxThis").addEventListener("click", () =>
    bulkSandboxThis(true)
  );
  $("#btnDisableSandboxThis").addEventListener("click", () =>
    bulkSandboxThis(false)
  );

  // Globals page actions
  $("#globalsForm").addEventListener("submit", onSubmitGlobals);
  $("#btnGlobalsApplyDefaults").addEventListener(
    "click",
    onApplyDefaultsGlobals
  );
  $("#btnGlobalsDelete").addEventListener("click", onDeleteGlobals);
  $("#btnGlobalsReload").addEventListener("click", loadGlobals);

  await rescan();
}

function showPage(id, btnId) {
  $$(".page").forEach((p) => p.classList.remove("visible"));
  $("#" + id).classList.add("visible");
  $$(".navbtn").forEach((b) => b.classList.remove("active"));
  if (btnId) $("#" + btnId).addEventListener("click", () => {});
  if (btnId) $("#" + btnId).classList.add("active");
}

// --- Data flow ---

async function rescan(customDir = null) {
  const list = await window.pc2.scanSaves(customDir);
  allSaves = list;

  grouped = new Map();
  for (const s of list) {
    const key = s.groupId || s.meta.FILE_ID || s.fileName;
    const g = grouped.get(key) || { root: null, children: [] };
    if (s.isRoot) g.root = s;
    else g.children.push(s);
    grouped.set(key, g);
  }

  renderRootGrid();
  renderBackupTargets();
}

// --- Filters ---

function rootMatchesFilters(root) {
  if (!root) return false;
  const name = (root.meta.name || root.displayName || "").toLowerCase();
  if (homeSearch && !name.includes(homeSearch)) return false;
  if (homeTag !== "all" && root.tag !== homeTag) return false;
  return true;
}

function saveMatchesFilters(s) {
  const name = (s.meta.name || s.fileName || "").toLowerCase();
  if (mapSearch && !name.includes(mapSearch)) return false;
  if (mapTag !== "all" && s.tag !== mapTag) return false;
  return true;
}

// --- Root grid ---

function renderRootGrid() {
  const container = $("#groups");
  container.innerHTML = "";

  const roots = Array.from(grouped.values())
    .map((g) => g.root)
    .filter(rootMatchesFilters)
    .sort(
      compareByNameThenMtime(
        (r) => r?.meta?.name || r?.displayName || r?.fileName || ""
      )
    );

  for (const root of roots) {
    const card = document.createElement("div");
    card.className = "card clickable";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = root.meta.name || root.displayName || "Unnamed";
    card.appendChild(title);

    const badges = document.createElement("div");
    badges.className = "badges";
    if (root.tag !== "unknown") badges.appendChild(makeBadge(root.tag));
    if (root.meta.isSurvivalMode)
      badges.appendChild(makeBadge("Survival", "survival")); // red
    if (root.meta.sandboxEnabled)
      badges.appendChild(makeBadge("Sandbox", "sandbox")); // yellow
    if (root.meta.difficulty)
      badges.appendChild(makeBadge(diffName(root.meta.difficulty)));
    if (root.meta.mapSize)
      badges.appendChild(
        makeBadge(`${root.meta.mapSize}×${root.meta.mapSize}`)
      );
    card.appendChild(badges);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span>FILE_ID: <code>${root.meta.FILE_ID}</code></span>
      ${root.meta.money != null ? `<span>Money: ${root.meta.money}</span>` : ""}
      ${root.meta.day != null ? `<span>Day: ${root.meta.day}</span>` : ""}
    `;
    card.appendChild(meta);

    card.addEventListener("click", () => openMapDetailById(root.meta.FILE_ID));
    container.appendChild(card);
  }
}

// --- Map detail page ---

function openMapDetailById(fileId) {
  currentGroupId = fileId;
  renderMapDetail(fileId);
  showPage("pageMap");
}

function renderMapDetail(groupId) {
  const sameId = allSaves.filter((s) => s.meta.FILE_ID === groupId);
  const root = sameId.find((s) => s.isRoot) || sameId[0];
  $("#mapTitle").textContent = root?.meta?.name || root?.displayName || groupId;

  const sameGroup = sameId.filter(saveMatchesFilters);
  renderSaveList($("#mapSaves"), sameGroup);

  const children = allSaves
    .filter((s) => s.meta.parentCity === groupId)
    .filter(saveMatchesFilters);
  renderSaveList($("#childMaps"), children);
}

function renderSaveList(container, saves) {
  container.innerHTML = "";
  const sorted = saves
    .slice()
    .sort(compareByNameThenMtime((s) => s?.meta?.name || s?.fileName || ""));

  for (const s of sorted) {
    const card = document.createElement("div");
    card.className = "card clickable";

    const title = document.createElement("div");
    title.className = "title";
    title.textContent = s.meta.name || s.fileName;
    card.appendChild(title);

    const badges = document.createElement("div");
    badges.className = "badges";
    if (s.tag !== "unknown") badges.appendChild(makeBadge(s.tag));
    if (s.meta.isSurvivalMode)
      badges.appendChild(makeBadge("Survival", "survival"));
    if (s.meta.sandboxEnabled)
      badges.appendChild(makeBadge("Sandbox", "sandbox"));
    if (s.isRoot) badges.appendChild(makeBadge("Main"));
    else badges.appendChild(makeBadge("Region"));
    card.appendChild(badges);

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `
      <span>FILE_ID: <code>${s.meta.FILE_ID || ""}</code></span>
      ${
        s.meta.parentCity
          ? `<span>Parent: <code>${s.meta.parentCity}</code></span>`
          : ""
      }
    `;
    card.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "actions";
    const editBtn = makeButton("Edit", () => openEditor(s.filePath), "primary");
    const bkpBtn = makeButton("Backups", () => openBackupsFor(s.filePath));
    const revBtn = makeButton("Reveal", () =>
      window.pc2.revealInFolder(s.filePath)
    );
    actions.append(editBtn, bkpBtn, revBtn);
    card.appendChild(actions);

    card.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") return;
      openMapDetailById(s.meta.FILE_ID);
    });

    container.appendChild(card);
  }
}

// --- Common UI bits ---

function makeBadge(text, extraClass = "") {
  const span = document.createElement("span");
  const cls =
    extraClass ||
    (text === "auto" ? "auto" : text === "manual" ? "manual" : "");
  span.className = "badge " + cls;
  span.textContent = text;
  return span;
}
function diffName(n) {
  if (Number(n) === 1) return "Easy";
  if (Number(n) === 2) return "Hard";
  return "Expert";
}
function makeButton(label, onClick, cls = "") {
  const b = document.createElement("button");
  b.className = cls;
  b.textContent = label;
  b.addEventListener("click", (e) => {
    e.stopPropagation();
    onClick();
  });
  return b;
}

// --- Editor drawer (per-save) ---

async function openEditor(filePath) {
  const data = await window.pc2.readSave(filePath);
  currentEdit = data;

  $("#drawerTitle").textContent = `Edit: ${
    data.snapshot.name || filePath.split(/[\\/]/).pop()
  }`;

  const f = $("#editForm");
  f.name.value = data.snapshot.name || "";
  f.money.value = data.snapshot.money ?? 0;
  f.researchPoints.value = data.snapshot.researchPoints ?? 0;
  f.day.value = data.snapshot.day ?? 1;
  f.mapSize.value = data.snapshot.mapSize ?? 40;
  f.difficulty.value = data.snapshot.difficulty ?? 1;
  f.sandbox.checked = !!data.snapshot.sandboxEnabled;

  // Disable sandbox toggle in Survival maps
  f.sandbox.disabled = !!data.snapshot.isSurvivalMode;

  // Resources
  const existing = {};
  (data.snapshot.resources || []).forEach((r) => (existing[r.id] = r.amount));
  const resList = $("#resList");
  resList.innerHTML = "";
  for (let id = 0; id <= 9; id++) {
    const row = document.createElement("div");
    row.className = "resrow";
    const amount = existing[id] ?? 0;
    row.innerHTML = `
      <div class="resname">${RESOURCE_NAMES[id]} <span class="badge">#${id}</span></div>
      <input type="number" step="1" min="0" value="${amount}" data-res-id="${id}">
    `;
    resList.appendChild(row);
  }

  openDrawer();
}

function openDrawer() {
  $("#drawer").classList.add("open");
}
function closeDrawer() {
  $("#drawer").classList.remove("open");
  currentEdit = null;
}

async function onSubmitEdit(e) {
  e.preventDefault();
  if (!currentEdit) return;

  const f = e.currentTarget;
  const resources = $$("#resList input").map((inp) => ({
    id: Number(inp.dataset.resId),
    amount: Number(inp.value),
  }));

  const curSize = Number(currentEdit.snapshot.mapSize || 40);
  const selectedSize = Number(f.mapSize.value || curSize);
  const clampedSize = Math.max(40, Math.min(88, selectedSize));
  const canGrow = clampedSize >= curSize;

  const patch = {
    name: f.name.value,
    money: Number(f.money.value),
    researchPoints: Number(f.researchPoints.value),
    day: Number(f.day.value),
    ...(canGrow ? { mapSize: clampedSize } : {}),
    difficulty: Number(f.difficulty.value),
    ...(currentEdit.snapshot.isSurvivalMode
      ? {}
      : { sandbox: !!f.sandbox.checked }),
    resources,
  };

  if (!canGrow && selectedSize !== curSize) {
    alert(
      `Map Size cannot be decreased. Current: ${curSize}×${curSize}. Requested: ${selectedSize}×${selectedSize} (ignored).`
    );
    f.mapSize.value = String(curSize);
  }

  const fileId = currentEdit?.snapshot?.FILE_ID;
  let res;
  if (
    fileId &&
    confirm("Apply these changes to ALL saves with the same FILE_ID?")
  ) {
    const files = allSaves
      .filter((s) => s.meta.FILE_ID === fileId)
      .map((s) => s.filePath);
    res = await window.pc2.bulkPatch(files, patch);
    alert(`Applied to ${res.ok}/${res.total} saves.`);
  } else {
    res = await window.pc2.patchSave(currentEdit.filePath, patch);
    if (!res?.ok) {
      alert(res?.error || "Failed to save.");
      return;
    }
    if (res.fallback) alert("Saved using safe fallback mode (structure kept).");
  }

  await rescan();
}

async function onDeleteSave() {
  if (!currentEdit) return;
  const ok = confirm(
    "Delete this save file? This cannot be undone (backups remain)."
  );
  if (!ok) return;
  await window.pc2.deleteSave(currentEdit.filePath);
  closeDrawer();
  await rescan();
}

// --- Bulk helpers ---

function buildMaxPatch() {
  return {
    level: 1000,
    money: 1000000000000, // 1 Trillion
    researchPoints: 999999,
    resources: Array.from({ length: 10 }, (_, id) => ({ id, amount: 999999 })),
  };
}
function buildResetDayPatch() {
  return { day: 1, dayProgress: 0 };
}
function buildDay100Patch() {
  return { day: 100, dayProgress: 0 };
}

async function bulkSetAll() {
  const files = allSaves.map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildMaxPatch());
  alert(`Set Max (All): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}
async function bulkResetAll() {
  const files = allSaves.map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildResetDayPatch());
  alert(`Reset Day (All): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}
async function bulkSetDay100All() {
  const files = allSaves.map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildDay100Patch());
  alert(`Set Day 100 (All): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}

async function bulkSetThis() {
  const files = allSaves
    .filter(
      (s) =>
        s.meta.FILE_ID === currentGroupId ||
        s.meta.parentCity === currentGroupId
    )
    .map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildMaxPatch());
  alert(`Set Max (This map): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}
async function bulkResetThis() {
  const files = allSaves
    .filter(
      (s) =>
        s.meta.FILE_ID === currentGroupId ||
        s.meta.parentCity === currentGroupId
    )
    .map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildResetDayPatch());
  alert(`Reset Day (This map): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}
async function bulkSetDay100This() {
  const files = allSaves
    .filter(
      (s) =>
        s.meta.FILE_ID === currentGroupId ||
        s.meta.parentCity === currentGroupId
    )
    .map((s) => s.filePath);
  const res = await window.pc2.bulkPatch(files, buildDay100Patch());
  alert(`Set Day 100 (This map): ${res.ok}/${res.total} succeeded.`);
  await rescan();
}

// Sandbox bulk ops must SKIP survival maps entirely (cannot toggle).
function selectNonSurvivalFiles(scopeFilter) {
  const selected = allSaves.filter(scopeFilter);
  const eligible = selected.filter((s) => !s.meta.isSurvivalMode);
  const skipped = selected.length - eligible.length;
  return {
    files: eligible.map((s) => s.filePath),
    skipped,
    total: selected.length,
  };
}

async function bulkSandboxAll(enable) {
  const { files, skipped } = selectNonSurvivalFiles(() => true);
  const res = await window.pc2.bulkPatch(files, { sandbox: !!enable });
  alert(
    `${enable ? "Enable" : "Disable"} Sandbox (All): ${res.ok}/${
      res.total
    } succeeded. Skipped ${skipped} survival ${skipped === 1 ? "map" : "maps"}.`
  );
  await rescan();
}
async function bulkSandboxThis(enable) {
  const { files, skipped } = selectNonSurvivalFiles(
    (s) =>
      s.meta.FILE_ID === currentGroupId || s.meta.parentCity === currentGroupId
  );
  const res = await window.pc2.bulkPatch(files, { sandbox: !!enable });
  alert(
    `${enable ? "Enable" : "Disable"} Sandbox (map): ${res.ok}/${
      res.total
    } succeeded. Skipped ${skipped} survival ${skipped === 1 ? "map" : "maps"}.`
  );
  await rescan();
}

// --- Backups page ---

function renderBackupTargets() {
  const el = $("#backupTarget");
  el.innerHTML = "";
  const opts = allSaves
    .slice()
    .sort(compareByNameThenMtime((s) => s?.meta?.name || s?.fileName || ""));
  for (const s of opts) {
    const op = document.createElement("option");
    op.value = s.filePath;
    op.textContent = `${s.meta.name || s.fileName} — ${s.fileName}`;
    el.appendChild(op);
  }
  el.onchange = () => loadBackups(el.value);
  if (opts[0]) loadBackups(opts[0].filePath);
}

async function loadBackups(filePath) {
  const backups = await window.pc2.listBackups(filePath);
  const container = $("#backupsList");
  container.innerHTML = "";
  for (const b of backups) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="title">${b.name}</div>
      <div class="meta">
        <span>${new Date(b.mtime).toLocaleString()}</span>
        <span>${(b.sizeBytes / 1024).toFixed(1)} KB</span>
      </div>
      <div class="actions">
        <button class="primary">Restore</button>
        <button>Reveal</button>
      </div>
    `;
    const [restoreBtn, revealBtn] = card.querySelectorAll("button");
    restoreBtn.addEventListener("click", async () => {
      await window.pc2.restoreBackup(filePath, b.backupPath);
      alert("Backup restored. (The current file was overwritten.)");
      await rescan();
    });
    revealBtn.addEventListener("click", () =>
      window.pc2.revealInFolder(b.backupPath)
    );
    container.appendChild(card);
  }
}

function openBackupsFor(filePath) {
  showPage("pageBackups", "btnBackups");
  $("#backupTarget").value = filePath;
  loadBackups(filePath);
}

async function onRevealBackupFolder() {
  const sel = $("#backupTarget").value;
  if (sel) window.pc2.revealInFolder(sel);
}

// ---- Survival Global Settings UI ----

async function loadGlobals() {
  const data = await window.pc2.readGlobalSettings();
  const e = data.snapshot?.editable || {};

  // fill form
  const f = $("#globalsForm");
  f.bestDayReachedEasy.value = e.bestDayReachedEasy ?? 100;
  f.bestDayReachedHard.value = e.bestDayReachedHard ?? 100;
  f.bestDayReachedExpert.value = e.bestDayReachedExpert ?? 100;

  f.highestStarsReachedEasy.value = e.highestStarsReachedEasy ?? 5;
  f.highestStarsReachedHard.value = e.highestStarsReachedHard ?? 5;
  f.highestStarsReachedExpert.value = e.highestStarsReachedExpert ?? 5;

  f.highestPopulationReachedEasy.value =
    e.highestPopulationReachedEasy ?? 999999;
  f.highestPopulationReachedHard.value =
    e.highestPopulationReachedHard ?? 999999;
  f.highestPopulationReachedExpert.value =
    e.highestPopulationReachedExpert ?? 999999;

  f.totalUpgradePoints.value = e.totalUpgradePoints ?? 999999;

  renderUpgradesGrid(e.upgradesSpent || {});
}

function renderUpgradesGrid(map) {
  const grid = $("#upgradesGrid");
  grid.innerHTML = "";
  // Known ids 1..9; keep any extra ids found
  const ids = new Set([
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    ...Object.keys(map).map((n) => Number(n)),
  ]);
  const labels = {
    1: "Extra Money",
    2: "Extra Research Points",
    3: "Extra Lifelines",
    4: "Reduce Land Costs",
    5: "Bank Interest",
    6: "Income Per Tourist",
    7: "Shipping Export Earnings",
    8: "Residential Zone Housing",
    9: "Inflation Reduction",
  };
  Array.from(ids)
    .sort((a, b) => a - b)
    .forEach((id) => {
      const val = Number(map[id] ?? 0);
      const max = id === 3 ? 2 : 3;
      const row = document.createElement("div");
      row.className = "resrow";
      row.innerHTML = `
        <div class="resname">${
          labels[id] || `Upgrade #${id}`
        } <span class="badge">#${id} (max ${max})</span></div>
        <input type="number" min="0" max="${max}" step="1" value="${val}" data-upg-id="${id}">
      `;
      grid.appendChild(row);
    });
}

async function onSubmitGlobals(e) {
  e.preventDefault();
  const f = e.currentTarget;

  // client-side clamping (backend clamps again)
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Number(v) || 0));
  const payload = {
    bestDayReachedEasy: clamp(f.bestDayReachedEasy.value, 0, 100),
    bestDayReachedHard: clamp(f.bestDayReachedHard.value, 0, 100),
    bestDayReachedExpert: clamp(f.bestDayReachedExpert.value, 0, 100),

    highestStarsReachedEasy: clamp(f.highestStarsReachedEasy.value, 0, 5),
    highestStarsReachedHard: clamp(f.highestStarsReachedHard.value, 0, 5),
    highestStarsReachedExpert: clamp(f.highestStarsReachedExpert.value, 0, 5),

    highestPopulationReachedEasy: clamp(
      f.highestPopulationReachedEasy.value,
      0,
      999999999
    ),
    highestPopulationReachedHard: clamp(
      f.highestPopulationReachedHard.value,
      0,
      999999999
    ),
    highestPopulationReachedExpert: clamp(
      f.highestPopulationReachedExpert.value,
      0,
      999999999
    ),

    totalUpgradePoints: clamp(f.totalUpgradePoints.value, 0, 999999),

    upgradesSpent: {},
  };

  $$("#upgradesGrid input").forEach((inp) => {
    const id = Number(inp.dataset.upgId);
    const max = id === 3 ? 2 : 3;
    const val = clamp(inp.value, 0, max);
    if (val > 0) payload.upgradesSpent[id] = val;
  });

  const res = await window.pc2.writeGlobalSettings(payload);
  if (!res?.ok) {
    alert(res?.error || "Failed to save global settings.");
    return;
  }
  alert("Global settings saved.");
  await loadGlobals();
}

async function onApplyDefaultsGlobals() {
  // Save with max defaults (as requested)
  const payload = {
    bestDayReachedEasy: 100,
    bestDayReachedHard: 100,
    bestDayReachedExpert: 100,
    highestStarsReachedEasy: 5,
    highestStarsReachedHard: 5,
    highestStarsReachedExpert: 5,
    highestPopulationReachedEasy: 999999,
    highestPopulationReachedHard: 999999,
    highestPopulationReachedExpert: 999999,
    totalUpgradePoints: 999999,
    upgradesSpent: { 1: 3, 2: 3, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3 },
  };
  const res = await window.pc2.writeGlobalSettings(payload);
  if (!res?.ok) {
    alert(res?.error || "Failed to apply defaults.");
    return;
  }
  alert("Defaults applied and saved.");
  await loadGlobals();
}

async function onDeleteGlobals() {
  const ok = confirm(
    "Delete the 'survival_global_settings' file? A backup will be created and you can recreate it later."
  );
  if (!ok) return;
  const res = await window.pc2.deleteGlobalSettings();
  if (!res?.ok) {
    alert(res?.error || "Failed to delete global settings.");
  } else {
    alert("Global settings deleted.");
  }
  await loadGlobals();
}

window.addEventListener("DOMContentLoaded", init);
