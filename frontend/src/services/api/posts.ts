/**
 * Posts API functions
 */
import type { Post } from '../../types';
import { apiGet, apiPostForm, apiPost, apiDelete, authHeaders, jsonHeaders } from './client';
import type { FeedResponse } from './types';

export async function getFeed(token: string): Promise<FeedResponse> {
  return apiGet<FeedResponse>('/api/feed', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch feed',
  });
}

export async function createPost(
  token: string,
  data: {
    text?: string;
    location?: string;
    linkUrl?: string;
    linkTitle?: string;
    hasMusic?: boolean;
  },
  mediaFiles?: File[]
): Promise<Post> {
  const formData = new FormData();

  if (data.text) formData.append('text', data.text);
  if (data.location) formData.append('location', data.location);
  if (data.linkUrl) formData.append('linkUrl', data.linkUrl);
  if (data.linkTitle) formData.append('linkTitle', data.linkTitle);
  if (data.hasMusic) formData.append('hasMusic', 'true');

  if (mediaFiles) {
    mediaFiles.forEach((file) => {
      formData.append('media', file);
    });
  }

  return apiPostForm<Post>('/api/posts', {
    headers: authHeaders(token),
    body: formData,
    errorMessage: 'Failed to create post',
  });
}

export async function deletePost(token: string, postId: string): Promise<void> {
  return apiDelete('/api/posts/' + postId, {
    headers: authHeaders(token),
    errorMessage: 'Failed to delete post',
  });
}

export async function addReaction(token: string, postId: string, kaomoji: string): Promise<void> {
  await apiPost('/api/posts/' + postId + '/react', {
    headers: jsonHeaders(token),
    body: { kaomoji },
    errorMessage: 'Failed to add reaction',
  });
}

export async function removeReaction(
  token: string,
  postId: string,
  kaomoji: string
): Promise<void> {
  return apiDelete('/api/posts/' + postId + '/react', {
    headers: jsonHeaders(token),
    body: { kaomoji },
    errorMessage: 'Failed to remove reaction',
  });
}
