import { useState } from "react";
import { Search, X, FolderPlus, BookPlus } from "lucide-react";
import { useStore } from "../store/useStore";

export function Toolbar({
  searchQuery,
  onSearchChange,
  selectedCount,
  totalCount,
}: {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCount: number;
  totalCount: number;
}) {
  const papers = useStore((s) => s.papers);
  const addCollection = useStore((s) => s.addCollection);
  const addPaper = useStore((s) => s.addPaper);
  const collections = useStore((s) => s.collections);
  const selectedCollection = useStore((s) => s.selectedCollection);

  const [showNewCollection, setShowNewCollection] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [collName, setCollName] = useState("");

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [abstract, setAbstract] = useState("");
  const [tags, setTags] = useState("");
  const [itemCollection, setItemCollection] = useState("");

  const activeColl = collections.find((c) => c.id === selectedCollection);

  const handleCreateCollection = () => {
    const name = collName.trim();
    if (!name) return;
    addCollection(name);
    setCollName("");
    setShowNewCollection(false);
  };

  const handleCreateItem = () => {
    const t = title.trim();
    if (!t) return;
    addPaper({
      title: t,
      authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
      year: parseInt(year, 10) || new Date().getFullYear(),
      date: new Date().toISOString().slice(0, 10),
      abstract: abstract.trim(),
      doi: "",
      collection: itemCollection || activeColl?.name || "My Library",
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      journal: "",
    });
    setTitle("");
    setAuthors("");
    setYear(new Date().getFullYear().toString());
    setAbstract("");
    setTags("");
    setItemCollection("");
    setShowNewItem(false);
  };

  return (
    <>
      <div className="flex items-center h-[38px] px-2 border-b border-zotero-border bg-zotero-header gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => setShowNewCollection(true)}
            className="px-2 py-1 text-[11px] border border-zotero-border rounded bg-white hover:bg-gray-100 transition-colors font-medium flex items-center gap-1"
            title="New Collection"
          >
            <FolderPlus size={12} /> New Collection
          </button>
          <button
            onClick={() => setShowNewItem(true)}
            className="px-2 py-1 text-[11px] border border-zotero-border rounded bg-white hover:bg-gray-100 transition-colors flex items-center gap-1"
            title="New Item"
          >
            <BookPlus size={12} /> New Item
          </button>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1 bg-white border border-zotero-border rounded px-2 py-1 flex-shrink-0">
          <Search size={12} className="text-zotero-text-secondary flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search all fields..."
            className="w-[200px] text-[12px] bg-transparent outline-none placeholder:text-zotero-text-secondary/60"
          />
          {searchQuery && (
            <button onClick={() => onSearchChange("")} className="flex-shrink-0 hover:bg-black/10 rounded">
              <X size={12} className="text-zotero-text-secondary" />
            </button>
          )}
        </div>

        <div className="text-[11px] text-zotero-text-secondary flex-shrink-0 tabular-nums">
          {selectedCount > 0 && <span className="font-semibold text-zotero-text">{selectedCount} selected</span>}
          {selectedCount > 0 && " / "}
          {totalCount} items
        </div>
      </div>

      {showNewCollection && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-32" onClick={() => setShowNewCollection(false)}>
          <div className="bg-white rounded-lg shadow-xl w-80 p-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-[13px] font-semibold mb-3">New Collection</div>
            <input
              type="text"
              value={collName}
              onChange={(e) => setCollName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateCollection()}
              placeholder="Collection name..."
              className="w-full px-2 py-1.5 text-[12px] border border-zotero-border rounded focus:outline-none focus:border-zotero-accent mb-3"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNewCollection(false)} className="px-3 py-1 text-[11px] border border-zotero-border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateCollection} disabled={!collName.trim()} className="px-3 py-1 text-[11px] bg-zotero-accent text-white rounded hover:bg-zotero-accent-hover disabled:opacity-40">Create</button>
            </div>
          </div>
        </div>
      )}

      {showNewItem && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-start justify-center pt-16 overflow-y-auto" onClick={() => setShowNewItem(false)}>
          <div className="bg-white rounded-lg shadow-xl w-[480px] p-5 my-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-[13px] font-semibold mb-4">New Item</div>

            <div className="space-y-3">
              <Field label="Title" required>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Paper title..." className="field-input" autoFocus />
              </Field>
              <Field label="Authors (comma-separated)">
                <input type="text" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="Author A, Author B..." className="field-input" />
              </Field>
              <Field label="Year">
                <input type="text" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" className="field-input w-24" />
              </Field>
              <Field label="Collection">
                <select value={itemCollection} onChange={(e) => setItemCollection(e.target.value)} className="field-input">
                  <option value="">{activeColl?.name || "Select..."}</option>
                  {collections.filter((c) => c.id !== "all" && c.id !== selectedCollection).map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tags (comma-separated)">
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tag1, tag2..." className="field-input" />
              </Field>
              <Field label="Abstract">
                <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} placeholder="Abstract text..." className="field-input h-20 resize-none" />
              </Field>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNewItem(false)} className="px-3 py-1 text-[11px] border border-zotero-border rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreateItem} disabled={!title.trim()} className="px-3 py-1 text-[11px] bg-zotero-accent text-white rounded hover:bg-zotero-accent-hover disabled:opacity-40">Add Item</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zotero-text-secondary block mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
