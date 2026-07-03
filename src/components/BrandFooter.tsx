import { ExternalLink } from "lucide-react";

export function BrandFooter() {
  return (
    <footer className="flex items-center justify-center gap-2 h-[28px] px-3 border-t border-zotero-border bg-zotero-header flex-shrink-0">
      <span className="text-[10px] text-zotero-text-secondary">
        Built by{" "}
        <a
          href="https://www.linkedin.com/in/balogun14/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zotero-accent hover:underline font-medium inline-flex items-center gap-1"
        >
          balogun14
          <ExternalLink size={10} />
        </a>
      </span>
    </footer>
  );
}
