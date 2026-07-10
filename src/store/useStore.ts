import { create } from "zustand";
import type { Paper, Collection, SortField, SortDirection, RightPaneTab } from "../types";
import { api } from "../lib/api";

interface AppState {
  papers: Paper[];
  collections: Collection[];
  selectedCollection: string | null;
  selectedTags: string[];
  selectedPaperId: string | null;
  sortField: SortField;
  sortDirection: SortDirection;
  expandedPapers: Set<string>;
  searchQuery: string;
  rightPaneTab: RightPaneTab;
  pdfPaperId: string | null;
  isLoading: boolean;
  error: string | null;

  setSelectedCollection: (id: string | null) => void;
  toggleTag: (tag: string) => void;
  setSelectedPaper: (id: string | null) => void;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  toggleExpand: (id: string) => void;
  setSearchQuery: (q: string) => void;
  setRightPaneTab: (tab: RightPaneTab) => void;
  openPdf: (id: string) => void;
  closePdf: () => void;
  addCollection: (name: string) => Promise<void>;
  addPaper: (paper: Partial<Paper>) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  refresh: () => Promise<void>;

  filteredAndSortedPapers: () => Paper[];
  allTags: () => { tag: string; count: number }[];
  relatedPapers: () => Paper[];
  paperById: (id: string) => Paper | undefined;
}

const collectionNameMap: Record<string, string> = {
  "llm-alignment": "LLM Alignment",
  diffusion: "Diffusion & Generative Models",
  gnn: "Graph Neural Networks",
  multimodal: "Multimodal Learning",
  "efficient-inference": "Efficient Inference & Quantization",
};

export const useStore = create<AppState>((set, get) => ({
  papers: [],
  collections: [],
  selectedCollection: "all",
  selectedTags: [],
  selectedPaperId: null,
  sortField: "title",
  sortDirection: "asc",
  expandedPapers: new Set<string>(),
  searchQuery: "",
  rightPaneTab: "info",
  pdfPaperId: null,
  isLoading: false,
  error: null,

  refresh: async () => {
    set({ isLoading: true, error: null });
    try {
      const [{ papers }, { collections }] = await Promise.all([
        api.getPapers({ collection: get().selectedCollection, q: get().searchQuery, tag: get().selectedTags[0] }),
        api.getCollections(),
      ]);
      set({ papers, collections, isLoading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load library', isLoading: false });
    }
  },

  setSelectedCollection: (id) => set({ selectedCollection: id, rightPaneTab: "info", selectedTags: [] }),

  toggleTag: (tag) =>
    set((s) => {
      const tags = s.selectedTags.includes(tag)
        ? s.selectedTags.filter((t) => t !== tag)
        : [...s.selectedTags, tag];
      return { selectedTags: tags };
    }),

  setSelectedPaper: (id) => set({ selectedPaperId: id, rightPaneTab: "info" }),

  setSortField: (field) => set({ sortField: field }),

  toggleSortDirection: () =>
    set((s) => ({ sortDirection: s.sortDirection === "asc" ? "desc" : "asc" })),

  toggleExpand: (id) =>
    set((s) => {
      const next = new Set(s.expandedPapers);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedPapers: next };
    }),

  setSearchQuery: (q) => set({ searchQuery: q }),

  setRightPaneTab: (tab) => set({ rightPaneTab: tab }),

  openPdf: (id) => set({ pdfPaperId: id, rightPaneTab: "pdf" }),

  closePdf: () => set({ pdfPaperId: null, rightPaneTab: "info" }),

  addCollection: async (name) => {
    const { collection } = await api.createCollection({ name, parentId: "all" });
    set((s) => ({ collections: [...s.collections, collection] }));
  },

  addPaper: async (paper) => {
    const { paper: created } = await api.createPaper({
      ...paper,
      collection: get().selectedCollection || "all",
    });
    set((s) => ({ papers: [...s.papers, created] }));
  },

  updateCollection: async (id, updates) => {
    const { collection: updated } = await api.updateCollection(id, updates);
    set((s) => ({
      collections: s.collections.map((c) => (c.id === id ? updated : c)),
    }));
  },

  filteredAndSortedPapers: () => {
    const { papers, selectedCollection, selectedTags, searchQuery, sortField, sortDirection } = get();
    let filtered = papers;

    if (selectedCollection && selectedCollection !== "all") {
      const collName = collectionNameMap[selectedCollection] || selectedCollection;
      filtered = filtered.filter((p) => p.collection === collName || p.collection === selectedCollection);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((p) => selectedTags.some((t) => p.tags.includes(t)));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.authors.some((a) => a.toLowerCase().includes(q)) ||
          p.abstract.toLowerCase().includes(q) ||
          (p.arxivId || "").toLowerCase().includes(q)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortField === "title") cmp = a.title.localeCompare(b.title);
      else if (sortField === "author") cmp = (a.authors[0] || "").localeCompare(b.authors[0] || "");
      else if (sortField === "year") cmp = (a.year || 0) - (b.year || 0);
      else if (sortField === "date") cmp = (a.date || "").localeCompare(b.date || "");
      return sortDirection === "asc" ? cmp : -cmp;
    });

    return sorted;
  },

  allTags: () => {
    const { papers, selectedCollection } = get();
    let filtered = papers;
    if (selectedCollection && selectedCollection !== "all") {
      filtered = filtered.filter((p) => p.collection === selectedCollection);
    }
    const tagMap = new Map<string, number>();
    for (const p of filtered) {
      for (const t of p.tags) {
        tagMap.set(t, (tagMap.get(t) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  },

  relatedPapers: () => {
    const { papers, selectedPaperId } = get();
    const paper = papers.find((p) => p.id === selectedPaperId);
    if (!paper) return [];
    return papers.filter(
      (p) =>
        p.id !== paper.id &&
        (p.tags.some((t) => paper.tags.includes(t)) ||
          p.collection === paper.collection)
    ).slice(0, 20);
  },

  paperById: (id) => get().papers.find((p) => p.id === id),
}));

// Auto-load library on first use
let initialized = false;
export function initStore() {
  if (initialized) return;
  initialized = true;
  useStore.getState().refresh().catch((err) => {
    console.error("Failed to initialize store:", err);
  });
}
