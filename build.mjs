import { build } from "esbuild";

await build({
  entryPoints: ["src/content.ts"],
  bundle: true,
  outfile: "dist/content.js",
  format: "iife",
  sourcemap: true,
  target: ["chrome120"],
});