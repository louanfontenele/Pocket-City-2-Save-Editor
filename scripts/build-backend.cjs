/**
 * Pre-compiles the backend TypeScript modules into a single CJS bundle
 * so the packaged Electron app doesn't need tsx at runtime.
 *
 * Output: electron/backend.cjs
 */
const path = require("path");
const { build } = require("esbuild");

build({
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "electron/backend.cjs",
  external: ["electron", "json5", "pako"],
  // Let esbuild resolve from our project root
  nodePaths: [path.resolve("node_modules")],
  minify: false,
  sourcemap: false,
  stdin: {
    contents: [
      'export * as pc2Saves from "./src/lib/pc2-saves.ts";',
      'export * as pc2Dirs from "./src/lib/pc2-dirs.ts";',
      'export * as saveWatcher from "./src/lib/save-watcher.ts";',
      'export * as resources from "./src/lib/pc2/data/resources.ts";',
      'export * as npcs from "./src/lib/pc2/data/npcs.ts";',
      'export * as cars from "./src/lib/pc2/data/cars.ts";',
    ].join("\n"),
    resolveDir: ".",
    loader: "ts",
  },
}).then(() => {
  console.log("✓ Backend compiled to electron/backend.cjs");
});
