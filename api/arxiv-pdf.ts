import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Range");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).json({ error: "Missing ?url parameter" });
    return;
  }

  const allowed = url.startsWith("https://arxiv.org/pdf/");
  if (!allowed) {
    res.status(403).json({ error: "Only arxiv.org PDF URLs are allowed" });
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/pdf,*/*" },
      redirect: "follow",
    });

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: `arXiv returned ${upstream.status}` });
      return;
    }

    const contentType = upstream.headers.get("content-type") || "application/pdf";
    const contentLength = upstream.headers.get("content-length");

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Content-Type", contentType);
    if (contentLength) res.setHeader("Content-Length", contentLength);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

    if (!upstream.body) {
      res.status(500).json({ error: "Empty response from arXiv" });
      return;
    }

    const reader = upstream.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err: any) {
    res.status(502).json({ error: `Proxy error: ${err.message}` });
  }
}
