import { useStore } from "../store/useStore";
import { Info, FileText, Tag, Link, BookOpen } from "lucide-react";
import { InfoTab } from "./InfoTab";
import { AbstractTab } from "./AbstractTab";
import { TagsTab } from "./TagsTab";
import { RelatedTab } from "./RelatedTab";
import { PdfPane } from "./PdfPane";

const TABS = [
  { id: "info" as const, label: "Info", icon: Info },
  { id: "abstract" as const, label: "Abstract", icon: FileText },
  { id: "tags" as const, label: "Tags", icon: Tag },
  { id: "related" as const, label: "Related", icon: Link },
  { id: "pdf" as const, label: "PDF", icon: BookOpen },
];

export function RightPane() {
  const { rightPaneTab, setRightPaneTab, selectedPaperId } = useStore();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center border-b border-zotero-border bg-zotero-header">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setRightPaneTab(id)}
            className={`flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium border-b-2 transition-colors ${
              rightPaneTab === id
                ? "border-zotero-accent text-zotero-accent bg-white"
                : "border-transparent text-zotero-text-secondary hover:text-zotero-text hover:bg-black/5"
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {!selectedPaperId ? (
          <div className="p-6 text-center text-xs text-zotero-text-secondary italic">
            Select an item to view details
          </div>
        ) : rightPaneTab === "info" ? (
          <InfoTab />
        ) : rightPaneTab === "abstract" ? (
          <AbstractTab />
        ) : rightPaneTab === "tags" ? (
          <TagsTab />
        ) : rightPaneTab === "related" ? (
          <RelatedTab />
        ) : (
          <PdfPane />
        )}
      </div>
    </div>
  );
}
