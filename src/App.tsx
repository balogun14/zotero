import { useState, useCallback, useRef, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useStore, initStore } from "./store/useStore";
import { LeftPane } from "./components/LeftPane";
import { MiddlePane } from "./components/MiddlePane";
import { RightPane } from "./components/RightPane";
import { Toolbar } from "./components/Toolbar";
import { MobileNav } from "./components/MobileNav";
import { BrandLoader } from "./components/BrandLoader";
import { BrandFooter } from "./components/BrandFooter";
import { SharePage } from "./components/SharePage";
import type { Paper } from "./types";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getProxiedPdfUrl } from "./utils/proxy";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

type MobileView = "collections" | "items" | "detail";

export default function App() {
  useEffect(() => {
    initStore();
  }, []);

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
  const setSelectedPaper = useStore((s) => s.setSelectedPaper);
  const openPdf = useStore((s) => s.openPdf);
  const closePdf = useStore((s) => s.closePdf);

  const filterKey = `${selectedCollection ?? "all"}|${selectedTags.join(",")}|${searchQuery}|${sortField}|${sortDirection}`;

  const [items, setItems] = useState<Paper[]>([]);
  const [leftWidth, setLeftWidth] = useState(260);
  const [middleWidth, setMiddleWidth] = useState(420);
  const isDraggingSplitter = useRef<"left" | "middle" | null>(null);
  const [mobileView, setMobileView] = useState<MobileView>("items");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);

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

  const handleMobileSelectPaper = (id: string) => {
    setSelectedPaper(id);
    setMobileDetailOpen(true);
  };

  const handleMobileBackToItems = () => {
    setMobileDetailOpen(false);
    setMobileView("items");
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [selectedCollection]);

  const handleMobileOpenCollections = () => {
    setMobileMenuOpen(true);
  };

  return (
    <Routes>
      <Route path="/share/:slug" element={<SharePage />} />
      <Route
        path="/*"
        element={
          <div className="flex flex-col h-full">
            <BrandLoader />
            <Toolbar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCount={selectedPaperId ? 1 : 0}
              totalCount={papers.length}
              onMenuClick={handleMobileOpenCollections}
              onBackClick={handleMobileBackToItems}
              mobileDetailOpen={mobileDetailOpen}
            />

            {/* Desktop: 3-pane layout */}
            <div className="hidden lg:flex flex-1 min-h-0">
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

            {/* Mobile: single-view layout */}
            <div className="lg:hidden flex flex-1 min-h-0 relative">
              {/* Collections view (overlay) */}
              {mobileMenuOpen && (
                <div className="absolute inset-0 z-30 flex flex-col bg-zotero-sidebar">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-zotero-border bg-zotero-header">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zotero-text-secondary">Collections</span>
                    <button onClick={() => setMobileMenuOpen(false)} className="px-2 py-0.5 text-xs border border-zotero-border rounded hover:bg-gray-100">
                      Close
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto min-h-0">
                    <LeftPane />
                  </div>
                </div>
              )}

              {/* Items view */}
              <div className={`flex-1 flex flex-col min-h-0 ${mobileMenuOpen ? "hidden" : ""}`}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.map((p) => p.id)} strategy={verticalListSortingStrategy}>
                    <MiddlePane items={items} onSelectMobile={handleMobileSelectPaper} />
                  </SortableContext>
                </DndContext>
              </div>

              {/* Detail view (slides in from right) */}
              {mobileDetailOpen && selectedPaperId && (
                <div className="absolute inset-0 z-20 flex flex-col bg-white">
                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <RightPane />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <BrandFooter />

            {/* Mobile bottom nav */}
            <div className="lg:hidden">
              <MobileNav
                currentView={mobileDetailOpen ? "detail" : mobileView}
                onSelect={(v) => {
                  if (v === "collections") setMobileMenuOpen(true);
                  else if (v === "detail" && selectedPaperId) setMobileDetailOpen(true);
                  setMobileView(v);
                }}
                hasSelection={!!selectedPaperId}
              />
            </div>

            {/* Fullscreen PDF modal */}
            {pdfPaperId && (
              <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={closePdf}>
                <div
                  className="bg-white w-[90vw] h-[90vh] max-lg:w-full max-lg:h-full max-lg:rounded-none rounded-lg shadow-2xl flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <PDFViewerInline paperId={pdfPaperId} onClose={closePdf} />
                </div>
              </div>
            )}
          </div>
        }
      />
    </Routes>
  );
}

function PDFViewerInline({ paperId, onClose }: { paperId: string; onClose: () => void }) {
  const paper = useStore((s) => s.papers.find((p) => p.id === paperId));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
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
          setError(`Failed to load PDF. ${(err?.message || String(err))}`);
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
      <div className="flex items-center justify-between px-3 py-2 border-b border-zotero-border bg-zotero-header gap-1">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="font-semibold text-xs truncate">{paper.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setPageNum((n) => Math.max(1, n - 1))} disabled={pageNum <= 1}
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100 disabled:opacity-30">Prev</button>
          <span className="text-[11px] tabular-nums">{pageNum}/{numPages}</span>
          <button onClick={() => setPageNum((n) => Math.min(numPages, n + 1))} disabled={pageNum >= numPages}
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100 disabled:opacity-30">Next</button>
          <button onClick={() => setScale((s) => Math.min(3, s + 0.2))}
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100">+</button>
          <span className="text-[10px] text-zotero-text-secondary">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.max(0.4, s - 0.2))}
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100">-</button>
          <a href={paper.pdfUrl} target="_blank" rel="noopener noreferrer"
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100 no-underline text-zotero-text">Open</a>
          <button onClick={onClose}
            className="px-1.5 py-0.5 text-[11px] border border-zotero-border rounded hover:bg-gray-100 font-bold">X</button>
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-zotero-pdf-bg flex justify-center p-4">
        {loading && <div className="text-white text-sm self-center">Loading PDF...</div>}
        {error && <div className="text-red-300 text-sm self-center max-w-lg whitespace-pre-wrap">{error}</div>}
        {!loading && !error && <canvas ref={canvasRef} className="shadow-lg max-w-full h-auto" />}
      </div>
    </>
  );
}
