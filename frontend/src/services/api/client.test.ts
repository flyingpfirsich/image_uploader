/**
 * Unit tests for API client utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiError, authHeaders, jsonHeaders, apiGet, apiPost, apiDelete, apiPatch } from './client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ApiError', () => {
    it('should create error with message and status', () => {
      const error = new ApiError('Not found', 404);

      expect(error.message).toBe('Not found');
      expect(error.status).toBe(404);
      expect(error.name).toBe('ApiError');
      expect(error instanceof Error).toBe(true);
    });

    it('should be catchable as Error', () => {
      const error = new ApiError('Server error', 500);

      try {
        throw error;
      } catch (e) {
        expect(e instanceof Error).toBe(true);
        expect(e instanceof ApiError).toBe(true);
      }
    });
  });

  describe('authHeaders', () => {
    it('should return Authorization header with Bearer token', () => {
      const headers = authHeaders('my-token');

      expect(headers).toEqual({
        Authorization: 'Bearer my-token',
      });
    });
  });

  describe('jsonHeaders', () => {
    it('should return Content-Type header without token', () => {
      const headers = jsonHeaders();

      expect(headers).toEqual({
        'Content-Type': 'application/json',
      });
    });

    it('should return Content-Type and Authorization headers with token', () => {
      const headers = jsonHeaders('my-token');

      expect(headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      });
    });
  });

  describe('apiGet', () => {
    it('should make GET request and return JSON', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiGet('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/test'), {
        headers: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should pass custom headers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiGet('/api/test', {
        headers: { Authorization: 'Bearer token' },
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        headers: { Authorization: 'Bearer token' },
      });
    });

    it('should throw ApiError on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(apiGet('/api/test')).rejects.toThrow(ApiError);

      // Re-mock for the second call
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'Not found' }),
      });

      await expect(apiGet('/api/test')).rejects.toMatchObject({
        message: 'Not found',
        status: 404,
      });
    });

    it('should use custom error message on non-ok response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('JSON parse error')),
      });

      await expect(apiGet('/api/test', { errorMessage: 'Custom error' })).rejects.toMatchObject({
        message: 'Custom error',
      });
    });
  });

  describe('apiPost', () => {
    it('should make POST request with JSON body', async () => {
      const mockResponse = { success: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiPost('/api/test', {
        body: { name: 'test' },
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: undefined,
        body: JSON.stringify({ name: 'test' }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should make POST request without body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}),
      });

      await apiPost('/api/test');

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: undefined,
        body: undefined,
      });
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Bad request' }),
      });

      await expect(apiPost('/api/test')).rejects.toThrow(ApiError);
    });
  });

  describe('apiPatch', () => {
    it('should make PATCH request with JSON body', async () => {
      const mockResponse = { updated: true };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiPatch('/api/test', {
        body: { field: 'value' },
      });

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'PATCH',
        headers: undefined,
        body: JSON.stringify({ field: 'value' }),
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('apiDelete', () => {
    it('should make DELETE request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(''),
      });

      const result = await apiDelete('/api/test/1');

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'DELETE',
        headers: undefined,
        body: undefined,
      });
      expect(result).toBeUndefined();
    });

    it('should return JSON response if present', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('{"deleted":true}'),
      });

      const result = await apiDelete('/api/test/1');

      expect(result).toEqual({ deleted: true });
    });

    it('should throw ApiError on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      });

      await expect(apiDelete('/api/test/1')).rejects.toMatchObject({
        message: 'Forbidden',
        status: 403,
      });
    });
  });

  describe('error parsing', () => {
    it('should extract error message from API response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Username already taken' }),
      });

      await expect(apiPost('/api/register')).rejects.toMatchObject({
        message: 'Username already taken',
      });
    });

    it('should use fallback message when JSON parsing fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiGet('/api/test', { errorMessage: 'Fallback error' })).rejects.toMatchObject({
        message: 'Fallback error',
      });
    });

    it('should use default message when no error message provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      await expect(apiGet('/api/test')).rejects.toMatchObject({
        message: 'Request failed',
      });
    });
  });
});
