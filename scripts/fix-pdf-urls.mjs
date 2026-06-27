import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "src", "data", "data.json");

const papers = JSON.parse(readFileSync(DATA_FILE, "utf-8"));

let fixed = 0;
for (const p of papers) {
  const cleanId = p.arxivId.replace(/v\d+$/, "");
  const correctPdfUrl = `https://arxiv.org/pdf/${cleanId}.pdf`;
  const correctUrl = `https://arxiv.org/abs/${cleanId}`;
  if (p.pdfUrl !== correctPdfUrl || p.url !== correctUrl) {
    p.pdfUrl = correctPdfUrl;
    p.url = correctUrl;
    p.arxivId = cleanId;
    fixed++;
  }
}

writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2), "utf-8");
console.log(`Fixed ${fixed} papers.`);
