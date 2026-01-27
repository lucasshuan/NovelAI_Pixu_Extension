const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const projectPath = path.join(rootDir, "project.yaml");
const distDir = path.join(rootDir, "dist");

const yaml = fs.readFileSync(projectPath, "utf8");

function getField(key) {
  const match = yaml.match(new RegExp("^" + key + ":\\s*(.+)$", "m"));
  return match ? match[1].trim() : null;
}

const name = getField("name");
const version = getField("version");

if (!name || !version) {
  throw new Error("name/version not found in project.yaml");
}

const target = `${name}_${version}.naiscript`;

const files = fs
  .readdirSync(distDir)
  .filter((file) => file.endsWith(".naiscript"));

if (files.length === 0) {
  throw new Error("No .naiscript file found in dist");
}

const srcFile = files.find((file) => file !== target) || files[0];
const src = path.join(distDir, srcFile);
const dest = path.join(distDir, target);

if (src === dest) {
  console.log(`Already named ${target}`);
  process.exit(0);
}

if (fs.existsSync(dest)) {
  fs.unlinkSync(dest);
}

fs.renameSync(src, dest);
console.log(`Renamed ${srcFile} -> ${target}`);
