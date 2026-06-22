import { useStore } from "../store/useStore";

export function AbstractTab() {
  const { paperById, selectedPaperId } = useStore();
  const paper = paperById(selectedPaperId || "");

  if (!paper) return null;

  return (
    <div className="p-4">
      <h3 className="text-[14px] font-semibold text-zotero-text mb-3">{paper.title}</h3>
      <div className="text-[12px] text-zotero-text-secondary mb-3">
        {paper.authors.join(", ")} &middot; {paper.year}
      </div>
      <div className="text-[13px] text-zotero-text leading-relaxed whitespace-pre-line">
        {paper.abstract}
      </div>
      <div className="mt-4 flex gap-2">
        <a
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[12px] bg-zotero-accent text-white rounded hover:bg-zotero-accent-hover transition-colors no-underline"
        >
          View on arXiv
        </a>
        <a
          href={paper.pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 text-[12px] border border-zotero-border rounded hover:bg-gray-50 transition-colors no-underline text-zotero-text"
        >
          Open PDF
        </a>
      </div>
    </div>
  );
}
