import { useState, useEffect } from "react";

export function BrandLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2300);
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer); };
  }, []);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-500 ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-12 h-12 rounded-lg bg-zotero-accent animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-semibold text-zotero-text tracking-wide">Zotero-ArXiv Library</span>
          <span className="text-[11px] text-zotero-text-secondary">
            by{" "}
            <a
              href="https://www.linkedin.com/in/balogun14/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zotero-accent hover:underline font-medium"
            >
              balogun14
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
