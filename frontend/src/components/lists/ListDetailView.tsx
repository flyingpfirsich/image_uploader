import { useState, useEffect } from 'react';
import type { List, ListItem, ListWithItems } from '../../types';
import * as api from '../../services/api';
import { ListItemRow } from './ListItemRow';
import { AddListItem } from './AddListItem';

interface ListDetailViewProps {
  list: List;
  currentUserId: string;
  token: string;
  onClose: () => void;
  onListUpdate?: (list: List) => void;
  onListDelete?: () => void;
}

export function ListDetailView({
  list,
  currentUserId,
  token,
  onClose,
  onListUpdate,
  onListDelete,
}: ListDetailViewProps) {
  const [fullList, setFullList] = useState<ListWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [editDescription, setEditDescription] = useState(list.description || '');
  const [editAllowAnyoneAdd, setEditAllowAnyoneAdd] = useState(list.allowAnyoneAdd);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    try {
      await api.deleteList(token, list.id);
      onListDelete?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete list:', error);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal list-detail-view">
        {/* Header */}
        <header className="list-detail-view__header">
          <button className="list-detail-view__back" onClick={onClose}>
            &lt;
          </button>
          <div className="list-detail-view__title-row">
            <h2 className="list-detail-view__title">{list.title}</h2>
            {isOwner && (
              <div className="list-detail-view__header-actions">
                {showDeleteConfirm ? (
                  <>
                    <button className="btn--text btn--small btn--danger" onClick={handleDeleteList}>
                      Confirm
                    </button>
                    <button
                      className="btn--text btn--small"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="btn--text btn--small btn--danger" onClick={handleDeleteList}>
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Meta info */}
        <div className="list-detail-view__meta">
          <span>by @{list.creator.username}</span>
          <span>·</span>
          <span>{fullList?.itemCount ?? list.itemCount} items</span>
          {!list.allowAnyoneAdd && <span>[locked]</span>}
        </div>

        {/* Edit form */}
        {isEditing && (
          <div className="list-detail-view__edit-form">
            <input
              type="text"
              className="list-detail-view__edit-input"
              placeholder="List title"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <textarea
              className="list-detail-view__edit-textarea"
              placeholder="Description (optional)"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
            />
            <div className="list-detail-view__edit-toggle">
              <span>Anyone can add items</span>
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
            <div className="list-detail-view__edit-actions">
              <button className="btn btn--secondary btn--small" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button className="btn btn--small" onClick={handleSaveEdit}>
                Save
              </button>
            </div>
          </div>
        )}

        {/* Owner actions (Edit button) */}
        {isOwner && !isEditing && (
          <div className="list-detail-view__owner-actions">
            <button className="btn--text btn--small" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          </div>
        )}

        {/* Content */}
        <div className="list-detail-view__content">
          {isLoading ? (
            <div className="list-detail-view__loading">Loading...</div>
          ) : !fullList ? (
            <div className="list-detail-view__error">Failed to load list</div>
          ) : fullList.items.length === 0 ? (
            <div className="list-detail-view__empty">
              <span className="list-detail-view__empty-kaomoji">(´・ω・`)</span>
              <span>No items yet</span>
            </div>
          ) : (
            <div className="list-detail-view__items">
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

        {/* Bottom input bar */}
        {canAddItems && (
          <div className="list-detail-view__input-bar">
            <AddListItem listId={list.id} token={token} onAdd={handleItemAdd} />
          </div>
        )}
      </div>
    </div>
  );
}
