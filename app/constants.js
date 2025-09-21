// app/constants.js
// Common constants used by the app.

const path = require("path");

// Resource id → display name (UI only; does not affect game file format)
const RESOURCE_MAP = {
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

/**
 * Known NPC relationship ids → display name (UI helper only).
 * The editor will still show / preserve unknown ids.
 */
const NPC_NAMES = {
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
};

/** Survival global upgrades: display name and per-upgrade max level. */
const SURVIVAL_UPGRADES = {
  1: { name: "Extra Money", max: 3 },
  2: { name: "Extra Research Points", max: 3 },
  3: { name: "Extra Lifelines", max: 2 }, // only one capped at 2
  4: { name: "Reduce Land Costs", max: 3 },
  5: { name: "Bank Interest", max: 3 },
  6: { name: "Income Per Tourist", max: 3 },
  7: { name: "Shipping Export Earnings", max: 3 },
  8: { name: "Residential Zone Housing", max: 3 },
  9: { name: "Inflation Reduction", max: 3 },
};

/** Hard limits for editable global fields. */
const GLOBAL_LIMITS = {
  BEST_DAY_MAX: 100,
  STARS_MAX: 5,
  POP_MAX: 999_999_999, // user can exceed 999,999 up to this cap
  TOTAL_UPGRADE_POINTS_MAX: 999_999,
};

function DEFAULT_DIRS(homedir, platform) {
  const dirs = [];
  // Windows
  if (platform === "win32") {
    dirs.push(
      path.join(
        process.env.USERPROFILE || homedir,
        "AppData",
        "LocalLow",
        "Codebrew Games Inc_",
        "Pocket City 2",
        "pocketcity2"
      )
    );
  }
  // macOS
  if (platform === "darwin") {
    dirs.push(
      path.join(
        homedir,
        "Library",
        "Application Support",
        "Codebrew Games Inc",
        "Pocket City 2",
        "pocketcity2"
      )
    );
  }
  return dirs;
}

module.exports = {
  RESOURCE_MAP,
  DEFAULT_DIRS,
  SURVIVAL_UPGRADES,
  GLOBAL_LIMITS,
  NPC_NAMES,
};
