import { useState, useEffect } from 'react';
import type { List, ListItem, ListWithItems } from '../../types';
import * as api from '../../services/api';
import { ListItemRow } from './ListItemRow';
import { AddListItem } from './AddListItem';

interface ListDetailProps {
  list: List;
  currentUserId: string;
  token: string;
  onClose: () => void;
  onListUpdate?: (list: List) => void;
  onListDelete?: () => void;
}

export function ListDetail({
  list,
  currentUserId,
  token,
  onClose,
  onListUpdate,
  onListDelete,
}: ListDetailProps) {
  const [fullList, setFullList] = useState<ListWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [editDescription, setEditDescription] = useState(list.description || '');
  const [editAllowAnyoneAdd, setEditAllowAnyoneAdd] = useState(list.allowAnyoneAdd);

  const isOwner = list.creatorId === currentUserId;
  const canAddItems = list.allowAnyoneAdd || isOwner;

  useEffect(() => {
    const fetchList = async () => {
      try {
        const data = await api.getList(token, list.id);
        setFullList(data);
      } catch (error) {
        console.error('Failed to fetch list:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchList();
  }, [token, list.id]);

  const handleItemAdd = (item: ListItem) => {
    if (fullList) {
      setFullList({
        ...fullList,
        items: [item, ...fullList.items],
        itemCount: fullList.itemCount + 1,
      });
    }
  };

  const handleItemUpdate = (updatedItem: ListItem) => {
    if (fullList) {
      setFullList({
        ...fullList,
        items: fullList.items.map((item) => (item.id === updatedItem.id ? updatedItem : item)),
      });
    }
  };

  const handleItemDelete = (itemId: string) => {
    if (fullList) {
      setFullList({
        ...fullList,
        items: fullList.items.filter((item) => item.id !== itemId),
        itemCount: fullList.itemCount - 1,
      });
    }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await api.updateList(token, list.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        allowAnyoneAdd: editAllowAnyoneAdd,
      });
      setFullList(fullList ? { ...fullList, ...updated } : null);
      onListUpdate?.(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update list:', error);
    }
  };

  const handleDeleteList = async () => {
    if (!confirm('Delete this list? This cannot be undone.')) return;
    try {
      await api.deleteList(token, list.id);
      onListDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="list-detail">
        <div className="list-detail__loading">Loading...</div>
      </div>
    );
  }

  if (!fullList) {
    return (
      <div className="list-detail">
        <div className="list-detail__error">Failed to load list</div>
      </div>
    );
  }

  return (
    <div className="list-detail">
      {isEditing ? (
        <div className="list-detail__edit-form">
          <input
            type="text"
            className="list-detail__edit-title"
            placeholder="List title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <textarea
            className="list-detail__edit-description"
            placeholder="Description (optional)"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            rows={2}
          />
          <div className="list-detail__edit-toggle-wrapper">
            <span className="list-detail__edit-toggle-label">Anyone can add items</span>
            <button
              type="button"
              className={`notification-toggle ${editAllowAnyoneAdd ? 'active' : ''}`}
              onClick={() => setEditAllowAnyoneAdd(!editAllowAnyoneAdd)}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>
          <div className="list-detail__edit-actions">
            <button className="btn btn--secondary" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
            <button className="btn" onClick={handleSaveEdit}>
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          {isOwner && (
            <div className="list-detail__owner-actions">
              <button className="list-detail__action-link" onClick={() => setIsEditing(true)}>
                Edit
              </button>
              <button
                className="list-detail__action-link list-detail__action-link--danger"
                onClick={handleDeleteList}
              >
                Delete
              </button>
            </div>
          )}
        </>
      )}

      <div className="list-detail__items">
        {canAddItems && <AddListItem listId={list.id} token={token} onAdd={handleItemAdd} />}

        {fullList.items.length === 0 ? (
          <div className="list-detail__empty">
            <span className="list-detail__empty-kaomoji">(´・ω・`)</span>
            <span>No items yet</span>
          </div>
        ) : (
          <div className="list-detail__items-list">
            {fullList.items.map((item) => (
              <ListItemRow
                key={item.id}
                item={item}
                listId={list.id}
                currentUserId={currentUserId}
                canEdit={canAddItems}
                token={token}
                onUpdate={handleItemUpdate}
                onDelete={handleItemDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
