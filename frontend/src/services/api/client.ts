/**
 * Shared API client utilities
 */

export const API_URL = import.meta.env.PROD
  ? ''
  : import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Get authorization headers with Bearer token
 */
export function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get JSON content-type headers with optional auth token
 */
export function jsonHeaders(token?: string): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * API error class for structured error handling
 */
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Parse error response from API
 */
async function parseErrorResponse(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const data = await res.json();
    return data.error || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

/**
 * Perform a GET request with error handling
 */
export async function apiGet<T>(
  url: string,
  options: {
    headers?: HeadersInit;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    headers: options.headers,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  return res.json();
}

/**
 * Perform a POST request with JSON body
 */
export async function apiPost<T>(
  url: string,
  options: {
    headers?: HeadersInit;
    body?: unknown;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: options.headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  return res.json();
}

/**
 * Perform a POST request with FormData body
 */
export async function apiPostForm<T>(
  url: string,
  options: {
    headers?: HeadersInit;
    body: FormData;
    errorMessage?: string;
  }
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'POST',
    headers: options.headers,
    body: options.body,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  return res.json();
}

/**
 * Perform a PATCH request with FormData body
 */
export async function apiPatchForm<T>(
  url: string,
  options: {
    headers?: HeadersInit;
    body: FormData;
    errorMessage?: string;
  }
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'PATCH',
    headers: options.headers,
    body: options.body,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  return res.json();
}

/**
 * Perform a PATCH request with JSON body
 */
export async function apiPatch<T>(
  url: string,
  options: {
    headers?: HeadersInit;
    body?: unknown;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'PATCH',
    headers: options.headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  return res.json();
}

/**
 * Perform a DELETE request
 */
export async function apiDelete<T = void>(
  url: string,
  options: {
    headers?: HeadersInit;
    body?: unknown;
    errorMessage?: string;
  } = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${url}`, {
    method: 'DELETE',
    headers: options.headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const message = await parseErrorResponse(res, options.errorMessage || 'Request failed');
    throw new ApiError(message, res.status);
  }

  // For void responses, check if there's content
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text);
}

/**
 * Fetch a blob with authentication
 */
export async function apiFetchBlob(
  url: string,
  options: {
    headers?: HeadersInit;
    errorMessage?: string;
  } = {}
): Promise<Blob> {
  const res = await fetch(`${API_URL}${url}`, {
    headers: options.headers,
  });

  if (!res.ok) {
    throw new ApiError(options.errorMessage || 'Failed to load resource', res.status);
  }

  return res.blob();
}
