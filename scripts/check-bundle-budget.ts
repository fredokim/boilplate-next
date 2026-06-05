import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const chunksDir = join(root, ".next", "static", "chunks");
const maxChunkBytes = 520 * 1024;

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

if (!existsSync(chunksDir)) {
  throw new Error("Missing .next/static/chunks. Run npm run build before checking bundle budget.");
}

const jsChunks = walk(chunksDir).filter((file) => file.endsWith(".js"));
const oversized = jsChunks
  .map((file) => ({ file, size: statSync(file).size }))
  .filter((chunk) => chunk.size > maxChunkBytes);

if (oversized.length > 0) {
  console.error(
    oversized.map((chunk) => `- ${relative(root, chunk.file)} ${(chunk.size / 1024).toFixed(1)}KB`).join("\n"),
  );
  process.exit(1);
}

console.log(`Bundle budget passed. ${jsChunks.length} JS chunks checked, max ${(maxChunkBytes / 1024).toFixed(0)}KB.`);
