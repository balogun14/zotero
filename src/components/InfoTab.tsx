import { useStore } from "../store/useStore";

export function InfoTab() {
  const { paperById, selectedPaperId } = useStore();
  const paper = paperById(selectedPaperId || "");

  if (!paper) return null;

  const fields: [string, string][] = [
    ["Item Type", "Journal Article"],
    ["Title", paper.title],
    ["Authors", paper.authors.join("; ")],
    ["Abstract", paper.abstract],
    ["Publication", paper.journal || "arXiv preprint"],
    ["Year", String(paper.year)],
    ["Date", paper.date],
    ["arXiv ID", paper.arxivId],
    ["DOI", paper.doi || "N/A"],
    ["URL", paper.url],
    ["Collection", paper.collection],
    ["Categories", paper.categories.join(", ")],
  ];

  return (
    <div className="p-3">
      {fields.map(([label, value]) => (
        <div key={label} className="mb-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-zotero-text-secondary mb-0.5">
            {label}
          </div>
          <div className="text-[12px] text-zotero-text leading-relaxed break-words">
            {label === "URL" || label === "arXiv ID" ? (
              <a
                href={label === "URL" ? value : `https://arxiv.org/abs/${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zotero-accent hover:underline"
              >
                {value}
              </a>
            ) : label === "DOI" && value !== "N/A" ? (
              <a
                href={`https://doi.org/${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zotero-accent hover:underline"
              >
                {value}
              </a>
            ) : (
              value
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
