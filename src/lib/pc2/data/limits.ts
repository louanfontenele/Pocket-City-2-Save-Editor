// Survival global settings: upgrade IDs, caps, and field limits

export const SURVIVAL_UPGRADES: Record<
  number,
  { name: string; maxLevel: number }
> = {
  1: { name: "Extra Money", maxLevel: 3 },
  2: { name: "Extra Research", maxLevel: 3 },
  3: { name: "Extra Lifelines", maxLevel: 2 },
  4: { name: "Reduce Land Costs", maxLevel: 3 },
  5: { name: "Bank Interest", maxLevel: 3 },
  6: { name: "Income Per Tourist", maxLevel: 3 },
  7: { name: "Shipping Export Earnings", maxLevel: 3 },
  8: { name: "Residential Zone Housing", maxLevel: 3 },
  9: { name: "Inflation Reduction", maxLevel: 3 },
};

export const KNOWN_UPGRADE_IDS = Object.keys(SURVIVAL_UPGRADES).map(Number); // [1..9]

export const GLOBAL_LIMITS = {
  bestDayReached: { min: 0, max: 100 },
  highestStarsReached: { min: 0, max: 5 },
  highestPopulationReached: { min: 0, max: 999_999_999 },
  totalUpgradePoints: { min: 0, max: 999_999 },
} as const;

export function upgradeMaxLevel(id: number): number {
  return SURVIVAL_UPGRADES[id]?.maxLevel ?? 0;
}

export function upgradeName(id: number): string {
  return SURVIVAL_UPGRADES[id]?.name ?? `Upgrade #${id}`;
}
