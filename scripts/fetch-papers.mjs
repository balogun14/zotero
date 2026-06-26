import https from "node:https";
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "..", "src", "data");
const DATA_FILE = join(DATA_DIR, "data.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const ALL_PAPERS = [];
const SEEN_IDS = new Set();

function arxivSearch(query, start, maxResults) {
  return new Promise((resolve, reject) => {
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&start=${start}&max_results=${maxResults}&sortBy=submittedDate&sortOrder=descending`;
    const req = https.get(url, { timeout: 30000 }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve(data));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("timeout")); });
  });
}

function parseAtom(xml) {
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const id = extract(entry, "id");
    const arxivId = id.replace("http://arxiv.org/abs/", "").replace("https://arxiv.org/abs/", "");
    const title = extract(entry, "title")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const abstract = extract(entry, "summary")
      .replace(/\n/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const published = extract(entry, "published");
    const year = parseInt(published.substring(0, 4), 10) || 2020;
    const date = published.substring(0, 10);

    const authorMatches = entry.match(/<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g);
    const authors = authorMatches
      ? authorMatches.map((a) => a.match(/<name>([^<]+)<\/name>/)[1].trim())
      : [];

    const doiMatch = entry.match(/<arxiv:doi[^>]*>([^<]+)<\/arxiv:doi>/);
    const doi = doiMatch ? doiMatch[1].trim() : "";

    const journalMatch = entry.match(/<arxiv:journal_ref[^>]*>([^<]+)<\/arxiv:journal_ref>/);
    const journal = journalMatch ? journalMatch[1].trim() : "";

    const catMatches = entry.match(/category="([^"]+)"/g);
    const categories = catMatches
      ? [...new Set(catMatches.map((c) => c.match(/category="([^"]+)"/)[1]))]
      : [];

    entries.push({
      arxivId,
      title: title || "Untitled",
      authors,
      year,
      date,
      abstract: abstract || "",
      doi,
      categories,
      journal,
      url: `https://arxiv.org/abs/${arxivId}`,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
    });
  }
  return entries;
}

function extract(xml, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  return m ? m[1].trim() : "";
}

const CATEGORY_KEYWORDS = {
  "LLM Alignment": [
    'all:"large language model" AND all:alignment',
    'all:RLHF AND all:language model',
    'all:constitutional AI AND all:language model',
    'all:AI safety AND all:language model',
    'all:preference optimization AND all:LLM',
  ],
  "Diffusion & Generative Models": [
    'all:diffusion model AND all:image generation',
    'all:stable diffusion AND all:text-to-image',
    'all:denoising diffusion AND all:generative',
    'all:DDPM AND all:image synthesis',
    'all:score-based generative model',
  ],
  "Graph Neural Networks": [
    'all:graph neural network AND all:deep learning',
    'all:message passing AND all:graph convolution',
    'all:graph attention AND all:representation learning',
    'all:geometric deep learning AND all:graph',
    'all:graph transformer AND all:neural network',
  ],
  "Multimodal Learning": [
    'all:multimodal learning AND all:vision language',
    'all:CLIP AND all:contrastive learning',
    'all:vision transformer AND all:language model',
    'all:image text pretraining AND all:multimodal',
    'all:multimodal transformer AND all:representation',
  ],
  "Efficient Inference & Quantization": [
    'all:quantization AND all:neural network inference',
    'all:model compression AND all:deep learning',
    'all:knowledge distillation AND all:efficient',
    'all:network pruning AND all:deep neural',
    'all:efficient transformer AND all:inference',
  ],
};

const TAG_MAP = {
  "LLM Alignment": ["LLM", "Alignment", "RLHF", "Safety", "Preference Optimization"],
  "Diffusion & Generative Models": ["Diffusion", "Generative", "Image Synthesis", "Text-to-Image"],
  "Graph Neural Networks": ["GNN", "Graph", "Message Passing", "Geometric DL"],
  "Multimodal Learning": ["Multimodal", "Vision-Language", "CLIP", "Cross-Modal"],
  "Efficient Inference & Quantization": ["Quantization", "Efficient", "Pruning", "Distillation", "Inference"],
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchCategory(categoryName, queries) {
  console.log(`\n=== Fetching: ${categoryName} ===`);
  let papers = [];

  for (const query of queries) {
    try {
      console.log(`  Searching: ${query.substring(0, 80)}...`);
      const xml = await arxivSearch(query, 0, 30);
      const entries = parseAtom(xml);
      const filtered = entries.filter((e) => !SEEN_IDS.has(e.arxivId));
      for (const e of filtered) SEEN_IDS.add(e.arxivId);
      papers.push(...filtered);
      console.log(`  Got ${filtered.length} new papers (total: ${papers.length})`);
      await sleep(4000); // rate limit
    } catch (err) {
      console.error(`  Error: ${err.message}`);
    }
  }

  papers.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));

  const baseTags = TAG_MAP[categoryName] || [];
  return papers.map((p, i) => {
    const tags = [...baseTags];
    if (p.categories.some((c) => c.startsWith("cs.LG"))) tags.push("Machine Learning");
    if (p.categories.some((c) => c.startsWith("cs.CL"))) tags.push("NLP");
    if (p.categories.some((c) => c.startsWith("cs.CV"))) tags.push("Computer Vision");
    if (p.categories.some((c) => c.startsWith("cs.AI"))) tags.push("AI");
    return {
      id: `${categoryName.toLowerCase().replace(/\s+/g, "-")}-${i + 1}`,
      ...p,
      collection: categoryName,
      tags: [...new Set(tags)],
    };
  });
}

async function main() {
  console.log("Starting arXiv paper fetch...\n");

  for (const [name, queries] of Object.entries(CATEGORY_KEYWORDS)) {
    const papers = await fetchCategory(name, queries);
    ALL_PAPERS.push(...papers);
    console.log(`  Category total: ${papers.length}`);
  }

  console.log(`\n=== Grand Total: ${ALL_PAPERS.length} papers ===`);

  writeFileSync(DATA_FILE, JSON.stringify(ALL_PAPERS, null, 2), "utf-8");
  console.log(`\nWritten to ${DATA_FILE}`);
}

main().catch(console.error);
