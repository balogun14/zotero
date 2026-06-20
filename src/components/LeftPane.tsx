import { useStore } from "../store/useStore";
import { CollectionTree } from "./CollectionTree";
import { TagFilter } from "./TagFilter";

export function LeftPane() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zotero-text-secondary border-b border-zotero-border">
        Collections
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <CollectionTree />
      </div>
      <div className="border-t border-zotero-border flex-1 overflow-y-auto min-h-0">
        <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zotero-text-secondary border-b border-zotero-border">
          Tags
        </div>
        <TagFilter />
      </div>
    </div>
  );
}
