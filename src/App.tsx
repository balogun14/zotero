import { useState, useCallback, useRef, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useStore } from "./store/useStore";
import { LeftPane } from "./components/LeftPane";
import { MiddlePane } from "./components/MiddlePane";
import { RightPane } from "./components/RightPane";
import { Toolbar } from "./components/Toolbar";
import type { Paper } from "./types";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getProxiedPdfUrl } from "./utils/proxy";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

export default function App() {
  const selectedCollection = useStore((s) => s.selectedCollection);
  const selectedTags = useStore((s) => s.selectedTags);
  const searchQuery = useStore((s) => s.searchQuery);
  const sortField = useStore((s) => s.sortField);
  const sortDirection = useStore((s) => s.sortDirection);
  const selectedPaperId = useStore((s) => s.selectedPaperId);
  const pdfPaperId = useStore((s) => s.pdfPaperId);
  const papers = useStore((s) => s.papers);
  const filteredAndSortedPapers = useStore((s) => s.filteredAndSortedPapers);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const openPdf = useStore((s) => s.openPdf);
  const closePdf = useStore((s) => s.closePdf);

  const filterKey = `${selectedCollection ?? "all"}|${selectedTags.join(",")}|${searchQuery}|${sortField}|${sortDirection}`;

  const [items, setItems] = useState<Paper[]>([]);
  const [leftWidth, setLeftWidth] = useState(260);
  const [middleWidth, setMiddleWidth] = useState(420);
  const isDraggingSplitter = useRef<"left" | "middle" | null>(null);

  useEffect(() => {
    setItems(filteredAndSortedPapers());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey, filteredAndSortedPapers]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = useCallback((event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIdx = prev.findIndex((p) => p.id === active.id);
      const newIdx = prev.findIndex((p) => p.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(oldIdx, 1);
      next.splice(newIdx, 0, moved);
      return next;
    });
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingSplitter.current === "left") {
        const w = Math.max(180, Math.min(400, e.clientX));
        setLeftWidth(w);
      } else if (isDraggingSplitter.current === "middle") {
        const w = Math.max(280, Math.min(700, e.clientX - leftWidth - 4));
        setMiddleWidth(w);
      }
    };
    const onMouseUp = () => {
      isDraggingSplitter.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };
  }, [leftWidth]);

  const startDrag = (pane: "left" | "middle") => (e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingSplitter.current = pane;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  return (
    <div className="flex flex-col h-full">
      <Toolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCount={selectedPaperId ? 1 : 0}
        totalCount={papers.length}
      />

      <div className="flex flex-1 min-h-0">
        <div style={{ width: leftWidth }} className="flex-shrink-0 flex flex-col border-r border-zotero-border bg-zotero-sidebar">
          <LeftPane />
        </div>

        <div
          className="w-1 flex-shrink-0 cursor-col-resize bg-zotero-border hover:bg-zotero-accent transition-colors"
          onMouseDown={startDrag("left")}
        />

        <div style={{ width: middleWidth }} className="flex-shrink-0 flex flex-col border-r border-zotero-border">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <MiddlePane items={items} />
            </SortableContext>
          </DndContext>
        </div>

        <div
          className="w-1 flex-shrink-0 cursor-col-resize bg-zotero-border hover:bg-zotero-accent transition-colors"
          onMouseDown={startDrag("middle")}
        />

        <div className="flex-1 min-w-0 flex flex-col bg-white">
          <RightPane />
        </div>
      </div>

      {pdfPaperId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={closePdf}>
          <div
            className="bg-white w-[90vw] h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <PDFViewerInline paperId={pdfPaperId} onClose={closePdf} />
          </div>
        </div>
      )}
    </div>
  );
}

function PDFViewerInline({ paperId, onClose }: { paperId: string; onClose: () => void }) {
  const paper = useStore((s) => s.papers.find((p) => p.id === paperId));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.3);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    if (!paperId) return;
    const currentPaper = useStore.getState().papers.find((p) => p.id === paperId);
    if (!currentPaper?.pdfUrl) {
      setError("No PDF URL available for this paper.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setError("");
    setLoading(true);
    const loadPdf = async () => {
      try {
        if (cancelled) return;
        const loadingTask = pdfjsLib.getDocument({ url: getProxiedPdfUrl(currentPaper.pdfUrl) });
        const pdf = await loadingTask.promise;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
        renderPage(1, pdf, scale);
      } catch (err: any) {
        if (!cancelled) {
          const msg = err?.message || String(err);
          setError(`Failed to load PDF. ${msg}`);
          setLoading(false);
        }
      }
    };
    loadPdf();
    return () => { cancelled = true; };
  }, [paperId]);

  const renderPage = async (num: number, pdf?: any, s?: number) => {
    const pdfDoc = pdf || pdfDocRef.current;
    if (!pdfDoc || !canvasRef.current) return;
    const page = await pdfDoc.getPage(num);
    const canvas = canvasRef.current;
    const viewport = page.getViewport({ scale: s || scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
  };

  useEffect(() => {
    if (pdfDocRef.current) renderPage(pageNum);
  }, [pageNum, scale]);

  if (!paper) return null;

  return (
    <>
      <div className="flex items-center justify-between px-4 py-2 border-b border-zotero-border bg-zotero-header">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold truncate">{paper.title}</span>
          <span className="text-xs text-zotero-text-secondary">({paper.arxivId})</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={() => setPageNum((n) => Math.max(1, n - 1))} disabled={pageNum <= 1}
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100 disabled:opacity-30">Prev</button>
          <span className="text-xs tabular-nums">{pageNum} / {numPages}</span>
          <button onClick={() => setPageNum((n) => Math.min(numPages, n + 1))} disabled={pageNum >= numPages}
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100 disabled:opacity-30">Next</button>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100">+</button>
          <button onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100">-</button>
          <span className="text-xs text-zotero-text-secondary">{Math.round(scale * 100)}%</span>
          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100">Open</a>
          <button onClick={onClose}
            className="px-2 py-1 text-xs border border-zotero-border rounded hover:bg-gray-100 font-bold">X</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-zotero-pdf-bg flex justify-center p-4">
        {loading && <div className="text-white text-sm self-center">Loading PDF...</div>}
        {error && <div className="text-red-300 text-sm self-center max-w-lg whitespace-pre-wrap">{error}</div>}
        {!loading && !error && <canvas ref={canvasRef} className="shadow-lg" />}
      </div>
    </>
  );
}
