import { Library, Layers, FileText } from "lucide-react";
import type { MobileView } from "../types";

const tabs: { id: MobileView; label: string; icon: typeof Library }[] = [
  { id: "collections", label: "Library", icon: Library },
  { id: "items", label: "Items", icon: Layers },
  { id: "detail", label: "Detail", icon: FileText },
];

export function MobileNav({
  currentView,
  onSelect,
  hasSelection,
}: {
  currentView: MobileView;
  onSelect: (v: MobileView) => void;
  hasSelection: boolean;
}) {
  return (
    <nav className="flex items-center justify-around border-t border-zotero-border bg-white h-12 flex-shrink-0 safe-bottom">
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = currentView === id;
        const disabled = id === "detail" && !hasSelection;
        return (
          <button
            key={id}
            onClick={() => !disabled && onSelect(id)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 min-w-0 transition-colors ${
              isActive
                ? "text-zotero-accent"
                : disabled
                ? "text-zotero-border"
                : "text-zotero-text-secondary active:text-zotero-text"
            }`}
          >
            <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
