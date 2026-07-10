import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../lib/api";
import type { Paper, Collection } from "../types";
import { Library, ExternalLink, Calendar, Users, Tag } from "lucide-react";

export function SharePage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    api.getPublicShare(slug)
      .then((data) => {
        setCollection(data.collection);
        setPapers(data.papers);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zotero-sidebar text-zotero-text">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-zotero-accent border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm">Loading shared library…</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zotero-sidebar text-zotero-text p-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold mb-2">Shared library not found</h1>
          <p className="text-zotero-text-secondary text-sm mb-4">{error || "This link may have been removed or made private."}</p>
          <Link to="/" className="text-zotero-accent hover:underline text-sm">Open main library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zotero-sidebar text-zotero-text">
      <header className="border-b border-zotero-border bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Library size={18} className="text-zotero-accent" />
          <h1 className="font-semibold text-sm truncate">{collection.name}</h1>
          <span className="text-[11px] text-zotero-text-secondary bg-zotero-sidebar px-2 py-0.5 rounded-full">
            {papers.length} papers
          </span>
        </div>
        <Link to="/" className="text-xs text-zotero-accent hover:underline">Open my library →</Link>
      </header>

      <main className="max-w-4xl mx-auto p-4">
        {papers.length === 0 ? (
          <p className="text-center text-zotero-text-secondary text-sm py-12">No papers in this shared library yet.</p>
        ) : (
          <div className="bg-white border border-zotero-border rounded-lg overflow-hidden">
            {papers.map((paper) => (
              <div key={paper.id} className="border-b border-zotero-border last:border-b-0 p-4 hover:bg-zotero-sidebar/50 transition-colors">
                <h2 className="font-semibold text-sm mb-1">{paper.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zotero-text-secondary mb-2">
                  <span className="flex items-center gap-1"><Users size={11} /> {paper.authors.slice(0, 3).join(", ")}{paper.authors.length > 3 ? " et al." : ""}</span>
                  <span className="flex items-center gap-1"><Calendar size={11} /> {paper.year || paper.date}</span>
                </div>
                <p className="text-[12px] text-zotero-text leading-relaxed mb-3 line-clamp-3">{paper.abstract}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {paper.tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zotero-sidebar border border-zotero-border rounded text-[10px]">
                      <Tag size={9} /> {tag}
                    </span>
                  ))}
                </div>
                <a href={paper.url || paper.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-zotero-accent hover:underline">
                  <ExternalLink size={11} /> View source
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
