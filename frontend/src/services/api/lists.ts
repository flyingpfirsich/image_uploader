/**
 * Lists API functions
 */
import type { List, ListItem, ListWithItems, ListActivity } from '../../types';
import { apiGet, apiPost, apiPatch, apiDelete, authHeaders, jsonHeaders } from './client';
import type { ListsResponse } from './types';

export interface ListActivityResponse {
  activity: ListActivity[];
}

// Get all lists
export async function getLists(token: string): Promise<ListsResponse> {
  return apiGet<ListsResponse>('/api/lists', {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch lists',
  });
}

// Get lists by user
export async function getListsByUser(token: string, userId: string): Promise<ListsResponse> {
  return apiGet<ListsResponse>(`/api/lists/user/${userId}`, {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch user lists',
  });
}

// Get list activity for feed
export async function getListActivity(
  token: string,
  limit?: number
): Promise<ListActivityResponse> {
  const url = limit ? `/api/lists/activity?limit=${limit}` : '/api/lists/activity';
  return apiGet<ListActivityResponse>(url, {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch list activity',
  });
}

// Get single list with items
export async function getList(token: string, listId: string): Promise<ListWithItems> {
  return apiGet<ListWithItems>(`/api/lists/${listId}`, {
    headers: authHeaders(token),
    errorMessage: 'Failed to fetch list',
  });
}

// Create a new list
export async function createList(
  token: string,
  data: {
    title: string;
    description?: string;
    allowAnyoneAdd?: boolean;
  }
): Promise<List> {
  return apiPost<List>('/api/lists', {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to create list',
  });
}

// Update a list
export async function updateList(
  token: string,
  listId: string,
  data: {
    title?: string;
    description?: string;
    allowAnyoneAdd?: boolean;
  }
): Promise<List> {
  return apiPatch<List>(`/api/lists/${listId}`, {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to update list',
  });
}

// Delete a list
export async function deleteList(token: string, listId: string): Promise<void> {
  return apiDelete(`/api/lists/${listId}`, {
    headers: authHeaders(token),
    errorMessage: 'Failed to delete list',
  });
}

// Add item to list
export async function addListItem(
  token: string,
  listId: string,
  data: {
    title: string;
    note?: string;
    externalUrl?: string;
  }
): Promise<ListItem> {
  return apiPost<ListItem>(`/api/lists/${listId}/items`, {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to add item',
  });
}

// Update list item
export async function updateListItem(
  token: string,
  listId: string,
  itemId: string,
  data: {
    title?: string;
    note?: string;
    externalUrl?: string;
    completed?: boolean;
  }
): Promise<ListItem> {
  return apiPatch<ListItem>(`/api/lists/${listId}/items/${itemId}`, {
    headers: jsonHeaders(token),
    body: data,
    errorMessage: 'Failed to update item',
  });
}

// Delete list item
export async function deleteListItem(token: string, listId: string, itemId: string): Promise<void> {
  return apiDelete(`/api/lists/${listId}/items/${itemId}`, {
    headers: authHeaders(token),
    errorMessage: 'Failed to delete item',
  });
}
