import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "src", "data", "data.json");

const papers = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

papers.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

papers.forEach((p, i) => {
  const safeColl = p.collection
    .replace(/&/g, "and")
    .replace(/\s+/g, "-")
    .toLowerCase();
  p.id = `${safeColl}-${i + 1}`;
});

writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2), "utf-8");
console.log(`Fixed ${papers.length} papers.`);
