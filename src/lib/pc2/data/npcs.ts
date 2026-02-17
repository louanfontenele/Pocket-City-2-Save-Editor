// NPC ID → display name mapping (Pocket City 2)

export const NPC_NAMES: Record<number, string> = {
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
  75: "Workers",
}

export const KNOWN_NPC_IDS = Object.keys(NPC_NAMES).map(Number)

export function npcName(id: number): string {
  return NPC_NAMES[id] ?? `NPC #${id}`
}
