import { useStore } from "../store/useStore";
import { Folder, FolderOpen, Library, Share2, Check } from "lucide-react";
import { useState } from "react";
import type { Collection } from "../types";

export function CollectionTree() {
  const collections = useStore((s) => s.collections);
  const selectedCollection = useStore((s) => s.selectedCollection);
  const setSelectedCollection = useStore((s) => s.setSelectedCollection);
  const updateCollection = useStore((s) => s.updateCollection);
  const papers = useStore((s) => s.papers);

  const root = collections.find((c) => c.id === "all");
  const children = collections.filter((c) => c.parentId === "all" && c.id !== "all");

  const countForCollection = (collId: string) => {
    if (collId === "all") return papers.length;
    const coll = collections.find((c) => c.id === collId);
    if (!coll) return 0;
    return papers.filter((p) => p.collection === coll.id || p.collection === coll.name).length;
  };

  const handleShare = async (e: React.MouseEvent, collection: Collection) => {
    e.stopPropagation();
    const slug = collection.shareSlug || `${collection.id}-share`;
    await updateCollection(collection.id, { isPublic: true, shareSlug: slug });
    const url = `${window.location.origin}/share/${slug}`;
    await navigator.clipboard.writeText(url);
    alert(`Public share link copied:\n${url}`);
  };

  return (
    <div className="py-1">
      {root && (
        <CollectionItem
          collection={root}
          count={countForCollection("all")}
          isSelected={selectedCollection === "all"}
          onClick={() => setSelectedCollection("all")}
          icon={<Library size={14} />}
          depth={0}
        />
      )}
      {children.map((c) => (
        <CollectionItem
          key={c.id}
          collection={c}
          count={countForCollection(c.id)}
          isSelected={selectedCollection === c.id}
          onClick={() => setSelectedCollection(c.id)}
          icon={<Folder size={14} />}
          selectedIcon={<FolderOpen size={14} />}
          depth={1}
          onShare={(e) => handleShare(e, c)}
        />
      ))}
    </div>
  );
}

function CollectionItem({
  collection,
  count,
  isSelected,
  onClick,
  icon,
  selectedIcon,
  depth,
  onShare,
}: {
  collection: Collection;
  count: number;
  isSelected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  selectedIcon?: React.ReactNode;
  depth: number;
  onShare?: (e: React.MouseEvent) => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleShareClick = async (e: React.MouseEvent) => {
    if (!onShare) return;
    await onShare(e);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-1 px-2 py-1 cursor-pointer text-[13px] select-none ${
        isSelected
          ? "bg-zotero-selected text-zotero-accent font-semibold"
          : "hover:bg-black/5 text-zotero-text"
      }`}
      style={{ paddingLeft: 6 + depth * 16 }}
    >
      <span className="flex-shrink-0">{isSelected && selectedIcon ? selectedIcon : icon}</span>
      <span className="flex-1 truncate">{collection.name}</span>
      {onShare && (
        <button
          onClick={handleShareClick}
          title="Copy public share link"
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/10 transition-opacity"
        >
          {copied ? <Check size={12} /> : <Share2 size={12} />}
        </button>
      )}
      <span className="text-[11px] text-zotero-text-secondary tabular-nums flex-shrink-0">{count}</span>
    </div>
  );
}
