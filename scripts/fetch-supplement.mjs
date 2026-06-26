import https from "node:https";
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, "..", "src", "data", "data.json");

const existingPapers = JSON.parse(readFileSync(DATA_FILE, "utf-8"));
const SEEN_IDS = new Set(existingPapers.map((p) => p.arxivId));
let counter = existingPapers.length;

function arxivSearch(query, start, maxResults) {
  return new Promise((resolve, reject) => {
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=${start}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    https.get(url, { timeout: 30000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    }).on("error", reject).on("timeout", () => { reject(new Error("timeout")); });
  });
}

function parseAtom(xml) {
  const entries = [];
  const regex = /<entry>([\s\S]*?)<\/entry>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const e = m[1];
    const id = (e.match(/<id[^>]*>([\s\S]*?)<\/id>/) || [])[1] || "";
    const arxivId = id.replace(/https?:\/\/arxiv\.org\/abs\//, "");
    if (!arxivId || SEEN_IDS.has(arxivId)) continue;
    const title = ((e.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "Untitled").replace(/\s+/g, " ").trim();
    const abstract = ((e.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || "").replace(/\s+/g, " ").trim();
    const published = ((e.match(/<published[^>]*>([\s\S]*?)<\/published>/) || [])[1] || "");
    const year = parseInt(published.substring(0, 4), 10) || 2020;
    const date = published.substring(0, 10);
    const am = [...e.matchAll(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g)];
    const authors = am.map((a) => a[1].trim());
    const doi = ((e.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/) || [])[1] || "").trim();
    const journal = ((e.match(/<arxiv:journal_ref[^>]*>([^<]+)<\/arxiv:journal_ref>/) || [])[1] || "").trim();
    const cm = [...e.matchAll(/category="([^"]+)"/g)];
    const categories = [...new Set(cm.map((c) => c[1]))];
    entries.push({ arxivId, title, authors, year, date, abstract, doi, categories, journal,
      url: `https://arxiv.org/abs/${arxivId}`, pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf` });
    SEEN_IDS.add(arxivId);
  }
  return entries;
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const EXTRA_QUERIES = [
  { collection: "LLM Alignment", query: 'all:LLM alignment AND all:RLHF' },
  { collection: "LLM Alignment", query: 'all:direct preference optimization AND all:LLM' },
  { collection: "Diffusion & Generative Models", query: 'all:latent diffusion AND all:image synthesis' },
  { collection: "Diffusion & Generative Models", query: 'all:text-to-image generation AND all:diffusion model' },
  { collection: "Graph Neural Networks", query: 'all:graph neural network AND all:node classification' },
  { collection: "Graph Neural Networks", query: 'all:graph neural network AND all:graph classification' },
  { collection: "Graph Neural Networks", query: 'all:graph neural network AND all:self-supervised learning' },
  { collection: "Graph Neural Networks", query: 'all:graph neural network AND all:representation learning' },
  { collection: "Graph Neural Networks", query: 'all:equivariant AND all:graph neural network' },
  { collection: "Multimodal Learning", query: 'all:multimodal AND all:vision language AND all:pretraining' },
  { collection: "Multimodal Learning", query: 'all:visual question answering AND all:deep learning' },
  { collection: "Multimodal Learning", query: 'all:large multimodal model AND all:vision' },
  { collection: "Multimodal Learning", query: 'all:multimodal AND all:foundation model AND all:image' },
  { collection: "Multimodal Learning", query: 'all:visual language model AND all:image understanding' },
  { collection: "Multimodal Learning", query: 'all:multimodal fusion AND all:deep learning' },
  { collection: "Multimodal Learning", query: 'all:crossmodal AND all:attention mechanism' },
  { collection: "Efficient Inference & Quantization", query: 'all:large language model AND all:quantization' },
  { collection: "Efficient Inference & Quantization", query: 'all:LLM AND all:inference optimization' },
  { collection: "Efficient Inference & Quantization", query: 'all:mixture of experts AND all:efficient inference' },
  { collection: "Efficient Inference & Quantization", query: 'all:parameter efficient fine-tuning AND all:LLM' },
  { collection: "Efficient Inference & Quantization", query: 'all:structured pruning AND all:neural network' },
  { collection: "Efficient Inference & Quantization", query: 'all:low rank AND all:model compression' },
];

const TAG_MAP = {
  "LLM Alignment": ["LLM", "Alignment", "RLHF", "Safety", "Preference Optimization"],
  "Diffusion & Generative Models": ["Diffusion", "Generative", "Image Synthesis", "Text-to-Image"],
  "Graph Neural Networks": ["GNN", "Graph", "Message Passing", "Geometric DL"],
  "Multimodal Learning": ["Multimodal", "Vision-Language", "CLIP", "Cross-Modal"],
  "Efficient Inference & Quantization": ["Quantization", "Efficient", "Pruning", "Distillation", "Inference"],
};

function tagify(p, coll) {
  const base = TAG_MAP[coll] || [];
  const extra = [];
  if (p.categories.some((c) => c.startsWith("cs.LG"))) extra.push("Machine Learning");
  if (p.categories.some((c) => c.startsWith("cs.CL"))) extra.push("NLP");
  if (p.categories.some((c) => c.startsWith("cs.CV"))) extra.push("Computer Vision");
  if (p.categories.some((c) => c.startsWith("cs.AI"))) extra.push("AI");
  return [...new Set([...base, ...extra])];
}

async function main() {
  console.log("Supplementary fetch...\n");
  for (const { collection, query } of EXTRA_QUERIES) {
    try {
      const xml = await arxivSearch(query, 0, 30);
      const entries = parseAtom(xml);
      if (entries.length > 0) {
        for (const e of entries) {
          counter++;
          existingPapers.push({
            id: `${collection.toLowerCase().replace(/\s+/g, "-")}-${counter}`,
            ...e,
            collection,
            tags: tagify(e, collection),
          });
        }
      }
      console.log(`  ${collection}: +${entries.length} papers (total now ${existingPapers.length})`);
      await sleep(4000);
    } catch (err) {
      console.error(`  Error on "${query}": ${err.message}`);
    }
  }
  existingPapers.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  writeFileSync(DATA_FILE, JSON.stringify(existingPapers, null, 2), "utf-8");
  console.log(`\nFinal total: ${existingPapers.length} papers`);
}

main().catch(console.error);
