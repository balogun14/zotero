import { useStore } from "../store/useStore";
import { Tag } from "lucide-react";

export function TagFilter() {
  const { allTags, selectedTags, toggleTag } = useStore();
  const tags = allTags();

  if (tags.length === 0) {
    return <div className="px-3 py-4 text-xs text-zotero-text-secondary italic">No tags</div>;
  }

  return (
    <div className="py-1">
      {tags.map(({ tag, count }) => (
        <div
          key={tag}
          onClick={() => toggleTag(tag)}
          className={`flex items-center gap-1 px-2 py-[3px] cursor-pointer text-[12px] select-none ${
            selectedTags.includes(tag)
              ? "bg-zotero-selected text-zotero-accent font-semibold"
              : "hover:bg-black/5 text-zotero-text"
          }`}
        >
          <Tag size={12} className="flex-shrink-0" />
          <span className="flex-1 truncate">{tag}</span>
          <span className="text-[10px] text-zotero-text-secondary tabular-nums flex-shrink-0">{count}</span>
        </div>
      ))}
    </div>
  );
}
