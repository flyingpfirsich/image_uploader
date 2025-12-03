import { eq, desc, sql } from 'drizzle-orm';
import { db, lists, listItems, users, List, ListItem } from '../db/index.js';
import { generateId } from '../utils/nanoid.js';

// Types for API responses
export interface ListWithDetails extends List {
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  itemCount: number;
}

export interface ListItemWithDetails extends ListItem {
  addedBy: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
}

export interface ListFullDetails extends ListWithDetails {
  items: ListItemWithDetails[];
}

// Activity types for feed
export interface ListActivity {
  type: 'list_created' | 'item_added';
  listId: string;
  listTitle: string;
  itemTitle?: string;
  userId: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string | null;
  };
  createdAt: Date;
}

// Create a new list
export async function createList(input: {
  creatorId: string;
  title: string;
  description?: string;
  allowAnyoneAdd?: boolean;
}): Promise<ListWithDetails> {
  const listId = generateId();

  await db.insert(lists).values({
    id: listId,
    creatorId: input.creatorId,
    title: input.title,
    description: input.description || null,
    allowAnyoneAdd: input.allowAnyoneAdd ?? true,
  });

  return getListById(listId, input.creatorId) as Promise<ListWithDetails>;
}

// Get a single list by ID (with item count)
export async function getListById(
  listId: string,
  _currentUserId: string
): Promise<ListWithDetails | null> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list) return null;

  const creator = await db.query.users.findFirst({
    where: eq(users.id, list.creatorId),
  });

  if (!creator) return null;

  // Count items
  const itemCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(listItems)
    .where(eq(listItems.listId, listId));

  return {
    ...list,
    creator: {
      id: creator.id,
      username: creator.username,
      displayName: creator.displayName,
      avatar: creator.avatar,
    },
    itemCount: itemCountResult[0]?.count ?? 0,
  };
}

// Get full list with items
export async function getListFullDetails(
  listId: string,
  currentUserId: string
): Promise<ListFullDetails | null> {
  const list = await getListById(listId, currentUserId);
  if (!list) return null;

  const items = await getListItems(listId, currentUserId);

  return {
    ...list,
    items,
  };
}

// Get all items for a list
export async function getListItems(
  listId: string,
  _currentUserId: string
): Promise<ListItemWithDetails[]> {
  const items = await db.query.listItems.findMany({
    where: eq(listItems.listId, listId),
    orderBy: [desc(listItems.createdAt)],
  });

  return Promise.all(
    items.map(async (item) => {
      const addedBy = await db.query.users.findFirst({
        where: eq(users.id, item.addedById),
      });

      return {
        ...item,
        addedBy: {
          id: addedBy!.id,
          username: addedBy!.username,
          displayName: addedBy!.displayName,
          avatar: addedBy!.avatar,
        },
      };
    })
  );
}

// Get lists by user ID
export async function getListsByUser(
  userId: string,
  currentUserId: string
): Promise<ListWithDetails[]> {
  const userLists = await db.query.lists.findMany({
    where: eq(lists.creatorId, userId),
    orderBy: [desc(lists.createdAt)],
  });

  const listsWithDetails = await Promise.all(
    userLists.map((list) => getListById(list.id, currentUserId))
  );

  return listsWithDetails.filter((l): l is ListWithDetails => l !== null);
}

// Get all lists (for feed activity)
export async function getAllLists(currentUserId: string): Promise<ListWithDetails[]> {
  const allLists = await db.query.lists.findMany({
    orderBy: [desc(lists.createdAt)],
  });

  const listsWithDetails = await Promise.all(
    allLists.map((list) => getListById(list.id, currentUserId))
  );

  return listsWithDetails.filter((l): l is ListWithDetails => l !== null);
}

// Update a list (creator only)
export async function updateList(
  listId: string,
  userId: string,
  updates: {
    title?: string;
    description?: string;
    allowAnyoneAdd?: boolean;
  }
): Promise<ListWithDetails | null> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list || list.creatorId !== userId) {
    return null;
  }

  await db
    .update(lists)
    .set({
      title: updates.title ?? list.title,
      description: updates.description !== undefined ? updates.description : list.description,
      allowAnyoneAdd: updates.allowAnyoneAdd ?? list.allowAnyoneAdd,
    })
    .where(eq(lists.id, listId));

  return getListById(listId, userId);
}

// Delete a list (creator only)
export async function deleteList(listId: string, userId: string): Promise<boolean> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list || list.creatorId !== userId) {
    return false;
  }

  await db.delete(lists).where(eq(lists.id, listId));
  return true;
}

// Check if user can add to list
export async function canAddToList(listId: string, userId: string): Promise<boolean> {
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, listId),
  });

  if (!list) return false;

  // Creator can always add
  if (list.creatorId === userId) return true;

  // Check if anyone can add
  return list.allowAnyoneAdd;
}

// Add item to list
export async function addItem(input: {
  listId: string;
  addedById: string;
  title: string;
  note?: string;
  externalUrl?: string;
}): Promise<ListItemWithDetails | null> {
  // Check permission
  const canAdd = await canAddToList(input.listId, input.addedById);
  if (!canAdd) return null;

  const itemId = generateId();

  // Get max order
  const maxOrderResult = await db
    .select({ maxOrder: sql<number>`coalesce(max(${listItems.order}), -1)` })
    .from(listItems)
    .where(eq(listItems.listId, input.listId));

  const newOrder = (maxOrderResult[0]?.maxOrder ?? -1) + 1;

  await db.insert(listItems).values({
    id: itemId,
    listId: input.listId,
    addedById: input.addedById,
    title: input.title,
    note: input.note || null,
    externalUrl: input.externalUrl || null,
    order: newOrder,
  });

  const item = await db.query.listItems.findFirst({
    where: eq(listItems.id, itemId),
  });

  const addedBy = await db.query.users.findFirst({
    where: eq(users.id, input.addedById),
  });

  return {
    ...item!,
    addedBy: {
      id: addedBy!.id,
      username: addedBy!.username,
      displayName: addedBy!.displayName,
      avatar: addedBy!.avatar,
    },
  };
}

// Update item (toggle completed, update title)
export async function updateItem(
  itemId: string,
  userId: string,
  updates: {
    title?: string;
    note?: string;
    externalUrl?: string;
    completed?: boolean;
  }
): Promise<ListItemWithDetails | null> {
  const item = await db.query.listItems.findFirst({
    where: eq(listItems.id, itemId),
  });

  if (!item) return null;

  // Get list to check permissions
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, item.listId),
  });

  if (!list) return null;

  // Only item adder or list creator can update
  if (item.addedById !== userId && list.creatorId !== userId) {
    return null;
  }

  await db
    .update(listItems)
    .set({
      title: updates.title ?? item.title,
      note: updates.note !== undefined ? updates.note : item.note,
      externalUrl: updates.externalUrl !== undefined ? updates.externalUrl : item.externalUrl,
      completed: updates.completed ?? item.completed,
    })
    .where(eq(listItems.id, itemId));

  // Fetch updated item
  const updatedItem = await db.query.listItems.findFirst({
    where: eq(listItems.id, itemId),
  });

  const addedBy = await db.query.users.findFirst({
    where: eq(users.id, updatedItem!.addedById),
  });

  return {
    ...updatedItem!,
    addedBy: {
      id: addedBy!.id,
      username: addedBy!.username,
      displayName: addedBy!.displayName,
      avatar: addedBy!.avatar,
    },
  };
}

// Delete item (adder or list creator)
export async function deleteItem(itemId: string, userId: string): Promise<boolean> {
  const item = await db.query.listItems.findFirst({
    where: eq(listItems.id, itemId),
  });

  if (!item) return false;

  // Get list to check permissions
  const list = await db.query.lists.findFirst({
    where: eq(lists.id, item.listId),
  });

  if (!list) return false;

  // Only item adder or list creator can delete
  if (item.addedById !== userId && list.creatorId !== userId) {
    return false;
  }

  await db.delete(listItems).where(eq(listItems.id, itemId));
  return true;
}

// Get recent list activity for feed
export async function getRecentListActivity(limit: number = 20): Promise<ListActivity[]> {
  const activities: ListActivity[] = [];

  // Get recently created lists
  const recentLists = await db.query.lists.findMany({
    orderBy: [desc(lists.createdAt)],
    limit,
  });

  for (const list of recentLists) {
    const creator = await db.query.users.findFirst({
      where: eq(users.id, list.creatorId),
    });

    if (creator) {
      activities.push({
        type: 'list_created',
        listId: list.id,
        listTitle: list.title,
        userId: creator.id,
        user: {
          id: creator.id,
          username: creator.username,
          displayName: creator.displayName,
          avatar: creator.avatar,
        },
        createdAt: list.createdAt,
      });
    }
  }

  // Get recently added items
  const recentItems = await db.query.listItems.findMany({
    orderBy: [desc(listItems.createdAt)],
    limit,
  });

  for (const item of recentItems) {
    const list = await db.query.lists.findFirst({
      where: eq(lists.id, item.listId),
    });

    const addedBy = await db.query.users.findFirst({
      where: eq(users.id, item.addedById),
    });

    if (list && addedBy) {
      activities.push({
        type: 'item_added',
        listId: list.id,
        listTitle: list.title,
        itemTitle: item.title,
        userId: addedBy.id,
        user: {
          id: addedBy.id,
          username: addedBy.username,
          displayName: addedBy.displayName,
          avatar: addedBy.avatar,
        },
        createdAt: item.createdAt,
      });
    }
  }

  // Sort by createdAt descending
  activities.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return activities.slice(0, limit);
}
