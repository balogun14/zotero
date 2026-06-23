import { useStore } from "../store/useStore";

export function TagsTab() {
  const { paperById, selectedPaperId, toggleTag, selectedTags } = useStore();
  const paper = paperById(selectedPaperId || "");

  if (!paper) return null;

  const allTags = paper.tags;

  return (
    <div className="p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-zotero-text-secondary mb-2">
        Paper Tags ({allTags.length})
      </div>
      {allTags.length === 0 ? (
        <div className="text-xs text-zotero-text-secondary italic">No tags</div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-[11px] rounded-full border transition-colors ${
                  isActive
                    ? "bg-zotero-accent text-white border-zotero-accent"
                    : "bg-zotero-tag-bg text-zotero-tag-text border-transparent hover:border-zotero-accent"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-zotero-text-secondary mb-2">
        Quick Add Tag
      </div>
      <QuickAddTag paperId={paper.id} />
    </div>
  );
}

function QuickAddTag({ paperId }: { paperId: string }) {
  return (
    <div className="flex gap-1">
      <input
        type="text"
        placeholder="Type a tag and press Enter..."
        className="flex-1 px-2 py-1 text-[11px] border border-zotero-border rounded focus:outline-none focus:border-zotero-accent"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val) {
              const store = useStore.getState();
              const papers = store.papers.map((p) => {
                if (p.id === paperId && !p.tags.includes(val)) {
                  return { ...p, tags: [...p.tags, val] };
                }
                return p;
              });
              useStore.setState({ papers });
              (e.target as HTMLInputElement).value = "";
            }
          }
        }}
      />
    </div>
  );
}
