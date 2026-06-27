import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "src", "data", "data.json");

const papers = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
let fixed = 0;

for (const p of papers) {
  const newUrl = p.pdfUrl.replace(/\.pdf$/, "");
  if (newUrl !== p.pdfUrl) {
    p.pdfUrl = newUrl;
    fixed++;
  }
}

writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2), "utf-8");
console.log(`Fixed ${fixed} PDF URLs (removed .pdf suffix).`);
