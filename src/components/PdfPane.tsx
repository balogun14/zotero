import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getProxiedPdfUrl } from "../utils/proxy";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export function PdfPane() {
  const selectedPaperId = useStore((s) => s.selectedPaperId);
  const paper = useStore((s) => (selectedPaperId ? s.papers.find((p) => p.id === selectedPaperId) : undefined));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    if (!selectedPaperId) return;
    const currentPaper = useStore.getState().papers.find((p) => p.id === selectedPaperId);
    if (!currentPaper?.pdfUrl) {
      setError("No PDF URL available for this paper.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setPageNum(1);

    const load = async () => {
      try {
        if (cancelled) return;
        const task = pdfjsLib.getDocument({ url: getProxiedPdfUrl(currentPaper.pdfUrl) });
        const pdf = await task.promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
        renderPage(1, pdf);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || String(err);
          setError(`Failed to load PDF. ${msg}`);
          setLoading(false);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedPaperId]);

  const renderPage = async (num: number, pdf?: any) => {
    const doc = pdf || pdfDocRef.current;
    if (!doc || !canvasRef.current) return;
    try {
      const page = await doc.getPage(num);
      const canvas = canvasRef.current;
      const viewport = page.getViewport({ scale });
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;
      await page.render({ canvasContext: ctx, viewport }).promise;
    } catch {
      setError("Failed to render page.");
    }
  };

  useEffect(() => {
    if (pdfDocRef.current) renderPage(pageNum);
  }, [pageNum, scale]);

  if (!paper) return null;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-zotero-border bg-zotero-header">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPageNum((n) => Math.max(1, n - 1))}
            disabled={pageNum <= 1}
            className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-[11px] tabular-nums min-w-[60px] text-center">
            {pageNum}/{numPages}
          </span>
          <button
            onClick={() => setPageNum((n) => Math.min(numPages, n + 1))}
            disabled={pageNum >= numPages}
            className="p-0.5 hover:bg-black/10 rounded disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="p-0.5 hover:bg-black/10 rounded">
            <ZoomIn size={13} />
          </button>
          <span className="text-[10px] tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            className="p-0.5 hover:bg-black/10 rounded">
            <ZoomOut size={13} />
          </button>
          <a
            href={paper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-0.5 hover:bg-black/10 rounded text-zotero-accent"
            title="Open in new tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-auto bg-zotero-pdf-bg flex justify-center p-2 min-h-0">
        {loading && (
          <div className="text-white text-xs self-center">Loading PDF...</div>
        )}
        {error && (
          <div className="text-red-300 text-xs self-center">{error}</div>
        )}
        {!loading && !error && (
          <canvas ref={canvasRef} className="shadow-lg" />
        )}
      </div>
    </div>
  );
}
