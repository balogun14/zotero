import { useStore } from "../store/useStore";
import { SortableItem } from "./SortableItem";
import type { Paper } from "../types";

const SORT_LABELS: Record<string, string> = {
  title: "Title",
  author: "Author",
  year: "Year",
  date: "Date Added",
};

export function MiddlePane({ items, onSelectMobile }: { items: Paper[]; onSelectMobile?: (id: string) => void }) {
  const { sortField, sortDirection, setSortField, toggleSortDirection, selectedPaperId } = useStore();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center border-b border-zotero-border bg-zotero-header text-[11px] font-semibold text-zotero-text-secondary">
        {(["title", "author", "year", "date"] as const).map((field) => (
          <button
            key={field}
            onClick={() => {
              if (sortField === field) toggleSortDirection();
              else setSortField(field);
            }}
            className={`px-2 py-1.5 hover:bg-black/5 flex items-center gap-0.5 ${
              field === "title" ? "flex-[3]" : field === "author" ? "flex-[2]" : "flex-[1]"
            } ${sortField === field ? "text-zotero-accent" : ""}`}
          >
            {SORT_LABELS[field]}
            {sortField === field && (
              <span className="text-[10px]">{sortDirection === "asc" ? "\u25B2" : "\u25BC"}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 && (
          <div className="p-4 text-center text-xs text-zotero-text-secondary italic">
            No items to display
          </div>
        )}
        {items.map((paper, idx) => (
          <SortableItem
            key={paper.id}
            paper={paper}
            index={idx}
            isSelected={selectedPaperId === paper.id}
            onSelectMobile={onSelectMobile}
          />
        ))}
      </div>
    </div>
  );
}
