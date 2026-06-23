import { useStore } from "../store/useStore";
import { FileText } from "lucide-react";

export function RelatedTab() {
  const { relatedPapers, setSelectedPaper, openPdf } = useStore();
  const related = relatedPapers();

  if (related.length === 0) {
    return (
      <div className="p-4 text-xs text-zotero-text-secondary italic">
        No related papers found.
      </div>
    );
  }

  return (
    <div className="py-1">
      {related.map((paper) => (
        <div
          key={paper.id}
          onClick={() => setSelectedPaper(paper.id)}
          onDoubleClick={() => openPdf(paper.id)}
          className="flex items-start gap-2 px-3 py-2 border-b border-zotero-border/50 cursor-pointer hover:bg-zotero-row-hover transition-colors"
        >
          <FileText size={13} className="flex-shrink-0 mt-0.5 text-zotero-text-secondary" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-zotero-text leading-tight line-clamp-2">
              {paper.title}
            </div>
            <div className="text-[10px] text-zotero-text-secondary mt-0.5">
              {paper.authors.slice(0, 2).join(", ")}
              {paper.authors.length > 2 ? " et al." : ""} &middot; {paper.year}
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {paper.tags.slice(0, 3).map((t) => (
                <span key={t} className="px-1 py-0 text-[9px] bg-zotero-tag-bg text-zotero-tag-text rounded">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
