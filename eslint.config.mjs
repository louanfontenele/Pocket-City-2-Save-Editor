import { defineConfig } from "eslint/config";

const eslintConfig = defineConfig([
  {
    ignores: ["node_modules/**", "dist/**", "release/**", "electron/**"],
  },
]);

export default eslintConfig;
