import type { scanAllSaves } from "@/lib/pc2-saves";

export type SaveScanItem = Awaited<ReturnType<typeof scanAllSaves>>[number];

export type DisplayCategory = "normal" | "sandbox" | "survival";

export const DISPLAYABLE: DisplayCategory[] = ["normal", "sandbox", "survival"];

export const MODE_BADGE_CLASS: Record<DisplayCategory, string> = {
  normal: "border-transparent bg-sky-500/80 text-white",
  sandbox:
    "border-transparent bg-amber-500/80 text-amber-950 dark:text-amber-950",
  survival: "border-transparent bg-rose-500/80 text-white",
};

export const CARD_GRADIENTS: Record<
  DisplayCategory,
  { from: string; to: string; color: string }
> = {
  normal: {
    from: "#38BDF855",
    to: "#0F172A",
    color: "#38BDF855",
  },
  sandbox: {
    from: "#FCD34D55",
    to: "#78350F",
    color: "#FCD34D55",
  },
  survival: {
    from: "#F8717155",
    to: "#7F1D1D",
    color: "#F8717155",
  },
};

export const DEFAULT_CARD_GRADIENT = {
  from: "#D9D9D955",
  to: "#262626",
  color: "#D9D9D955",
} as const;

export const DIFFICULTY_INFO: Record<
  number,
  {
    key: string;
    badgeClass: string;
  }
> = {
  1: {
    key: "easy",
    badgeClass:
      "border-sky-400/40 text-sky-600 dark:border-sky-500/40 dark:text-sky-400",
  },
  2: {
    key: "hard",
    badgeClass:
      "border-amber-400/50 text-amber-600 dark:border-amber-500/50 dark:text-amber-400",
  },
  3: {
    key: "expert",
    badgeClass:
      "border-rose-500/50 text-rose-600 dark:border-rose-500/60 dark:text-rose-400",
  },
};

export type SaveCategory =
  | "normal"
  | "parent"
  | "sandbox"
  | "parentSandbox"
  | "survival";

export const CATEGORY_PRIORITY: Record<SaveCategory, number> = {
  survival: 0,
  parentSandbox: 1,
  parent: 2,
  sandbox: 3,
  normal: 4,
};

export type SaveDisplay = {
  id: string;
  name: string;
  category: DisplayCategory;
  level: number | null;
  money: number | null;
  mapSize: number | null;
  difficulty: number | null;
  parentCount: number;
  day: number | null;
};

export type SaveTotals = {
  normal: number;
  parent: number;
  sandbox: number;
  parentSandbox: number;
  survival: number;
};

export type SaveDetailEntry = {
  representative: SaveScanItem;
  bucket: SaveScanItem[];
  category: SaveCategory;
};

export function extractIdFromFileName(fileName: string): string | null {
  const match = fileName.match(/^[^_]+_([^._]+)/);
  return match?.[1]?.trim() || null;
}

export function deriveSaveId(item: SaveScanItem): string {
  const meta = item.meta ?? {};
  const fromFile = extractIdFromFileName(item.fileName);
  const candidate =
    (typeof fromFile === "string" && fromFile.trim()) ||
    (typeof meta.parentCity === "string" && meta.parentCity.trim()) ||
    (typeof meta.FILE_ID === "string" && meta.FILE_ID.trim());
  return candidate && candidate.length > 0 ? candidate : item.fileName;
}

export function hasParentCity(meta: SaveScanItem["meta"]): boolean {
  return Boolean(meta?.parentCity && meta.parentCity.trim().length > 0);
}

export function hasSandboxCheats(meta: SaveScanItem["meta"]): boolean {
  return Boolean(
    meta &&
    meta.unlockAll === true &&
    meta.infiniteMoney === true &&
    meta.maxLevel === true,
  );
}

export function classifySave(item: SaveScanItem): SaveCategory {
  const meta = item.meta;
  if (meta?.isSurvivalMode === true) return "survival";
  const hasParent = hasParentCity(meta);
  const sandbox = hasSandboxCheats(meta);
  if (hasParent && sandbox) return "parentSandbox";
  if (hasParent) return "parent";
  if (sandbox) return "sandbox";
  return "normal";
}

export type SaveSummary = {
  totals: SaveTotals;
  cards: SaveDisplay[];
  allCards: SaveDisplay[];
  groupCount: number;
  cardDetails: Map<string, SaveDetailEntry>;
};

export function summarizeSaves(scannedItems: SaveScanItem[]): SaveSummary {
  const parentCityMap = new Map<string, Set<string>>();
  for (const item of scannedItems) {
    const parent = item.meta.parentCity?.trim();
    if (!parent) continue;
    const childId =
      (typeof item.meta.FILE_ID === "string" && item.meta.FILE_ID.trim()) ||
      (typeof item.groupId === "string" && item.groupId.trim()) ||
      item.fileName;
    if (!childId) continue;
    const existing = parentCityMap.get(parent);
    if (existing) {
      existing.add(childId);
    } else {
      parentCityMap.set(parent, new Set([childId]));
    }
  }

  const groups = new Map<string, SaveScanItem[]>();
  for (const item of scannedItems) {
    const key = (item.groupId && item.groupId.trim()) || deriveSaveId(item);
    const bucket = groups.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(key, [item]);
    }
  }

  const totals: SaveTotals = {
    normal: 0,
    parent: 0,
    sandbox: 0,
    parentSandbox: 0,
    survival: 0,
  };

  const displayCards: SaveDisplay[] = [];
  const allCards: SaveDisplay[] = [];
  const cardDetails = new Map<string, SaveDetailEntry>();

  for (const bucket of groups.values()) {
    let bestCategory: SaveCategory = "normal";
    let bestPriority = CATEGORY_PRIORITY[bestCategory];
    let representative: SaveScanItem | null = null;

    for (const entry of bucket) {
      const category = classifySave(entry);
      const priority = CATEGORY_PRIORITY[category];
      if (
        priority < bestPriority ||
        (priority === bestPriority &&
          (!representative || (!representative.isRoot && entry.isRoot)))
      ) {
        bestCategory = category;
        bestPriority = priority;
        representative = entry;
        if (priority === 0) break;
      }
    }

    switch (bestCategory) {
      case "survival":
        totals.survival += 1;
        break;
      case "parentSandbox":
        totals.parentSandbox += 1;
        break;
      case "parent":
        totals.parent += 1;
        break;
      case "sandbox":
        totals.sandbox += 1;
        break;
      default:
        totals.normal += 1;
        break;
    }

    if (representative) {
      const entryId =
        representative.meta.FILE_ID || deriveSaveId(representative);

      // Map category to a displayable one for rendering
      const displayCategory: DisplayCategory =
        bestCategory === "parentSandbox"
          ? "sandbox"
          : bestCategory === "parent"
            ? "normal"
            : (bestCategory as DisplayCategory);

      // Always register in cardDetails so /saves/[id] works for children too
      cardDetails.set(entryId, {
        representative,
        bucket,
        category: bestCategory,
      });

      const cardData: SaveDisplay = {
        id: entryId,
        name:
          representative.meta.name ||
          representative.fileName.replace(/\.es3$/i, ""),
        category: displayCategory,
        level:
          typeof representative.meta.level === "number"
            ? representative.meta.level
            : null,
        money:
          typeof representative.meta.money === "number"
            ? representative.meta.money
            : null,
        mapSize:
          typeof representative.meta.mapSize === "number"
            ? representative.meta.mapSize
            : null,
        difficulty:
          typeof representative.meta.difficulty === "number"
            ? representative.meta.difficulty
            : null,
        parentCount: parentCityMap.get(entryId)?.size ?? 0,
        day:
          typeof representative.meta.day === "number"
            ? representative.meta.day
            : null,
      };

      // Only show root saves in the /saves listing page
      if (
        representative.isRoot &&
        DISPLAYABLE.includes(bestCategory as DisplayCategory)
      ) {
        displayCards.push(cardData);
      }

      // Always add to allCards for detail page lookups
      allCards.push(cardData);
    }
  }

  displayCards.sort((a, b) => a.name.localeCompare(b.name));
  allCards.sort((a, b) => a.name.localeCompare(b.name));

  return {
    totals: { ...totals },
    cards: displayCards,
    allCards,
    groupCount: groups.size,
    cardDetails,
  };
}
