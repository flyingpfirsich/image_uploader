const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3000');

export interface LoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export interface UploadResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface MemoryFile {
  filename: string;
  timestamp: number;
  date: string; // YYYY-MM-DD format
}

export interface MemoriesResponse {
  success: boolean;
  files?: MemoryFile[];
  error?: string;
}

export async function login(password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
}

export async function uploadFile(file: File, token: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

export async function getMemories(token: string): Promise<MemoriesResponse> {
  const res = await fetch(`${API_URL}/memories`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}

export function getMemoryUrl(filename: string, token: string): string {
  return `${API_URL}/memories/${encodeURIComponent(filename)}?token=${encodeURIComponent(token)}`;
}

export async function getMemoryBlob(filename: string, token: string): Promise<Blob | null> {
  try {
    const res = await fetch(`${API_URL}/memories/${encodeURIComponent(filename)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.blob();
  } catch {
    return null;
  }
}

