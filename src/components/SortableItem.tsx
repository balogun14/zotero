import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useStore } from "../store/useStore";
import { GripVertical, ChevronRight, ChevronDown, FileText, ExternalLink } from "lucide-react";
import type { Paper } from "../types";

export function SortableItem({ paper, index, isSelected }: { paper: Paper; index: number; isSelected: boolean }) {
  const { setSelectedPaper, toggleExpand, expandedPapers, openPdf } = useStore();
  const isExpanded = expandedPapers.has(paper.id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: paper.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={() => setSelectedPaper(paper.id)}
        onDoubleClick={() => openPdf(paper.id)}
        className={`flex items-center border-b border-zotero-border/50 text-[12px] leading-tight cursor-pointer select-none ${
          isSelected
            ? "bg-zotero-selected"
            : index % 2 === 0
            ? "bg-white hover:bg-zotero-row-hover"
            : "bg-[#fafafa] hover:bg-zotero-row-hover"
        }`}
      >
        <div className="flex-shrink-0 px-1 py-1.5 text-zotero-text-secondary">
          <button
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="p-0.5 hover:bg-black/10 rounded cursor-grab active:cursor-grabbing"
          >
            <GripVertical size={12} />
          </button>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); toggleExpand(paper.id); }}
          className="flex-shrink-0 px-0.5 py-1.5 text-zotero-text-secondary hover:bg-black/10 rounded"
        >
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <div className="flex-shrink-0 px-1 py-1.5 text-zotero-text-secondary">
          <FileText size={12} />
        </div>

        <div className="flex-[3] px-1 py-1.5 truncate font-medium">{paper.title}</div>
        <div className="flex-[2] px-1 py-1.5 truncate text-zotero-text-secondary">
          {paper.authors.slice(0, 2).join(", ") + (paper.authors.length > 2 ? " et al." : "")}
        </div>
        <div className="flex-[1] px-1 py-1.5 text-center tabular-nums">{paper.year}</div>
        <div className="flex-[1] px-1 py-1.5 text-zotero-text-secondary text-[11px]">{paper.date}</div>

        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 px-1 py-1.5 text-zotero-text-secondary hover:text-zotero-accent"
          title="Open on arXiv"
        >
          <ExternalLink size={12} />
        </a>
      </div>

      {isExpanded && (
        <div className={`border-b border-zotero-border/50 px-6 py-2 text-[12px] text-zotero-text-secondary bg-white ${
          isSelected ? "bg-blue-50/50" : "bg-gray-50/50"
        }`}>
          <div className="mb-1">
            <span className="font-semibold text-zotero-text">Authors:</span>{" "}
            {paper.authors.join("; ")}
          </div>
          {paper.journal && (
            <div className="mb-1">
              <span className="font-semibold text-zotero-text">Journal:</span> {paper.journal}
            </div>
          )}
          <div className="mb-1">
            <span className="font-semibold text-zotero-text">arXiv:</span>{" "}
            <a href={paper.url} target="_blank" rel="noopener noreferrer"
              className="text-zotero-accent hover:underline">{paper.arxivId}</a>
          </div>
          {paper.doi && (
            <div className="mb-1">
              <span className="font-semibold text-zotero-text">DOI:</span>{" "}
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                className="text-zotero-accent hover:underline">{paper.doi}</a>
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-1">
            {paper.tags.map((t) => (
              <span key={t} className="px-1.5 py-0.5 text-[10px] bg-zotero-tag-bg text-zotero-tag-text rounded">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
