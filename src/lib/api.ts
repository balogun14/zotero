import type { Paper, Collection } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  getPapers(params?: { collection?: string | null; q?: string; tag?: string }) {
    const query = new URLSearchParams();
    if (params?.collection && params.collection !== 'all') query.set('collection', params.collection);
    if (params?.q) query.set('q', params.q);
    if (params?.tag) query.set('tag', params.tag);
    return request<{ papers: Paper[] }>(`/api/papers?${query.toString()}`);
  },

  getPaper(id: string) {
    return request<{ paper: Paper }>(`/api/papers/${id}`);
  },

  createPaper(paper: Partial<Paper>) {
    return request<{ paper: Paper }>('/api/papers', {
      method: 'POST',
      body: JSON.stringify(paper),
    });
  },

  updatePaper(id: string, updates: Partial<Paper>) {
    return request<{ paper: Paper }>(`/api/papers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deletePaper(id: string) {
    return request<void>(`/api/papers/${id}`, { method: 'DELETE' });
  },

  getCollections() {
    return request<{ collections: Collection[] }>('/api/collections');
  },

  createCollection(collection: Partial<Collection>) {
    return request<{ collection: Collection }>('/api/collections', {
      method: 'POST',
      body: JSON.stringify(collection),
    });
  },

  updateCollection(id: string, updates: Partial<Collection>) {
    return request<{ collection: Collection }>(`/api/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  deleteCollection(id: string) {
    return request<void>(`/api/collections/${id}`, { method: 'DELETE' });
  },

  getTags() {
    return request<{ tags: { tag: string; count: number }[] }>('/api/tags');
  },

  getPublicShare(slug: string) {
    return request<{ collection: Collection; papers: Paper[] }>(`/api/public/share/${slug}`);
  },
};
