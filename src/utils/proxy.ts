export function getProxiedPdfUrl(arxivUrl: string): string {
  const cleanUrl = arxivUrl.replace(/\.pdf$/, "");
  if (import.meta.env.DEV) {
    const pdfPath = cleanUrl.replace("https://arxiv.org/pdf/", "");
    return `/arxiv-pdf/pdf/${pdfPath}`;
  }
  if (import.meta.env.VITE_VERCEL) {
    return `/api/arxiv-pdf?url=${encodeURIComponent(cleanUrl)}`;
  }
  return `https://corsproxy.io/?${encodeURIComponent(cleanUrl)}`;
}
