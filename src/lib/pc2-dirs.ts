import * as path from "node:path";
import * as fs from "node:fs/promises";
import * as os from "node:os";

export function defaultPC2Dirs(): string[] {
  const dirs: string[] = [];
  const home =
    process.env.USERPROFILE || process.env.HOME || os.homedir() || "";

  if (!home) return dirs;

  if (process.platform === "win32") {
    dirs.push(
      path.join(
        home,
        "AppData",
        "LocalLow",
        "Codebrew Games Inc_",
        "Pocket City 2",
        "pocketcity2",
      ),
    );
  } else if (process.platform === "darwin") {
    dirs.push(
      path.join(
        home,
        "Library",
        "Application Support",
        "Codebrew Games Inc",
        "Pocket City 2",
        "pocketcity2",
      ),
    );
  }

  return Array.from(new Set(dirs));
}

export async function collectExistingDirs(): Promise<string[]> {
  const dirs = defaultPC2Dirs().filter(Boolean);
  const out: string[] = [];
  for (const dir of dirs) {
    try {
      const st = await fs.stat(dir);
      if (st.isDirectory()) out.push(dir);
    } catch {
      // ignore missing directories
    }
  }
  return out;
}
