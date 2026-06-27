import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "src", "data", "data.json");

function stripLaTeX(text) {
  if (!text) return text;

  let out = text;

  out = out.replace(/\$\$(.*?)\$\$/g, (_, inner) => cleanMath(inner));
  out = out.replace(/\$(.*?)\$/g, (_, inner) => cleanMath(inner));
  out = out.replace(/\\\((.*?)\\\)/g, (_, inner) => cleanMath(inner));
  out = out.replace(/\\\[(.*?)\\\]/g, (_, inner) => cleanMath(inner));

  out = out.replace(/\\text(?:rm|bf|it|sf|tt)?\{(.*?)\}/g, "$1");
  out = out.replace(/\\textbf\{(.*?)\}/g, "$1");
  out = out.replace(/\\textit\{(.*?)\}/g, "$1");
  out = out.replace(/\\emph\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathrm\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathbf\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathit\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathsf\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathtt\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathcal\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathbb\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathfrak\{(.*?)\}/g, "$1");
  out = out.replace(/\\mathscr\{(.*?)\}/g, "$1");

  out = out.replace(/\\cite\{(.*?)\}/g, "");
  out = out.replace(/\\citep\{(.*?)\}/g, "");
  out = out.replace(/\\citet\{(.*?)\}/g, "");
  out = out.replace(/\\ref\{(.*?)\}/g, "");

  out = out.replace(/\\[a-zA-Z]+\b/g, "");

  out = out.replace(/\\/g, "");

  out = out.replace(/[\{\}]/g, "");

  out = out.replace(/\s+/g, " ").trim();

  return out;
}

function cleanMath(math) {
  let m = math;
  m = m.replace(/\\text(?:rm|bf|it|sf|tt)?\{(.*?)\}/g, "$1");
  m = m.replace(/\\mathrm\{(.*?)\}/g, "$1");
  m = m.replace(/\\mathbf\{(.*?)\}/g, "$1");
  m = m.replace(/\\mathit\{(.*?)\}/g, "$1");
  m = m.replace(/\\mathcal\{(.*?)\}/g, "$1");
  m = m.replace(/\\mathbb\{(.*?)\}/g, "$1");
  m = m.replace(/\\[a-zA-Z]+\b/g, "");
  m = m.replace(/\\/g, "");
  m = m.replace(/[\{\}]/g, "");
  return m.trim();
}

const papers = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
let fixed = 0;

for (const p of papers) {
  const cleanTitle = stripLaTeX(p.title);
  const cleanAbstract = stripLaTeX(p.abstract);
  if (cleanTitle !== p.title || cleanAbstract !== p.abstract) {
    p.title = cleanTitle;
    p.abstract = cleanAbstract;
    fixed++;
  }
}

writeFileSync(DATA_FILE, JSON.stringify(papers, null, 2), "utf-8");
console.log(`Stripped LaTeX from ${fixed} papers.`);

const sample = papers.filter((p) => p.id.includes("-1"));
for (const p of sample.slice(0, 3)) {
  console.log(`\n${p.id}: ${p.title.substring(0, 100)}`);
}
