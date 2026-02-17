// Resource ID → display name mapping (Pocket City 2)

export const RESOURCE_NAMES: Record<number, string> = {
  0: "Food",
  1: "Wood",
  2: "Ore",
  3: "Rare Ore",
  4: "Metal",
  5: "Electronic Components",
  6: "Consumer Goods",
  7: "Intellectual Property",
  8: "Seedling",
  9: "Bag of Soil",
}

export const RESOURCE_IDS = Object.keys(RESOURCE_NAMES).map(Number) // [0..9]
export const RESOURCE_MAX_ID = 9

export function resourceName(id: number): string {
  return RESOURCE_NAMES[id] ?? `Resource #${id}`
}
