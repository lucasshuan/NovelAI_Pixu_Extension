import { access, copyFile, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");

await mkdir(dist, { recursive: true });

const files = ["manifest.json", "sw.js", "icon.png"];

for (const file of files) {
  const src = path.join(root, file);
  const dest = path.join(dist, file);
  try {
    await access(src, constants.F_OK);
    await copyFile(src, dest);
  } catch (err) {
    if (err && err.code !== "ENOENT") {
      throw err;
    }
  }
}

console.log("Copied static files to dist.");
