import { useState } from 'react';
import type { ListItem } from '../../types';
import * as api from '../../services/api';

interface ListItemRowProps {
  item: ListItem;
  listId: string;
  currentUserId: string;
  canEdit: boolean;
  token: string;
  onUpdate: (item: ListItem) => void;
  onDelete: (itemId: string) => void;
}

// Parse checkbox from title: "[ ] text" or "[x] text"
function parseCheckboxTitle(title: string): { isTask: boolean; checked: boolean; text: string } {
  const uncheckedMatch = title.match(/^\[\s*\]\s*(.*)$/);
  if (uncheckedMatch) {
    return { isTask: true, checked: false, text: uncheckedMatch[1] };
  }

  const checkedMatch = title.match(/^\[x\]\s*(.*)$/i);
  if (checkedMatch) {
    return { isTask: true, checked: true, text: checkedMatch[1] };
  }

  return { isTask: false, checked: false, text: title };
}

export function ListItemRow({
  item,
  listId,
  currentUserId,
  canEdit,
  token,
  onUpdate,
  onDelete,
}: ListItemRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const { isTask, checked, text } = parseCheckboxTitle(item.title);
  const isOwner = item.addedById === currentUserId;

  const handleToggleComplete = async () => {
    if (!isTask || !canEdit) return;

    // Toggle the checkbox in title
    const newTitle = checked ? `[ ] ${text}` : `[x] ${text}`;

    try {
      const updatedItem = await api.updateListItem(token, listId, item.id, {
        title: newTitle,
      });
      onUpdate(updatedItem);
    } catch (error) {
      console.error('Failed to toggle complete:', error);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || !canEdit) return;
    setIsDeleting(true);
    try {
      await api.deleteListItem(token, listId, item.id);
      onDelete(item.id);
    } catch (error) {
      console.error('Failed to delete item:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`list-item-row ${checked ? 'list-item-row--completed' : ''}`}>
      <div className="list-item-row__main">
        {isTask ? (
          <button
            className={`list-item-row__checkbox ${checked ? 'list-item-row__checkbox--checked' : ''}`}
            onClick={handleToggleComplete}
            disabled={!canEdit}
            aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
          >
            {checked ? '[x]' : '[ ]'}
          </button>
        ) : (
          <span className="list-item-row__bullet">-</span>
        )}

        <div className="list-item-row__content">
          <span
            className={`list-item-row__title ${checked ? 'list-item-row__title--completed' : ''}`}
          >
            {text}
          </span>

          {item.note && <span className="list-item-row__note">{item.note}</span>}

          {item.externalUrl && (
            <a
              href={item.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="list-item-row__link"
              onClick={(e) => e.stopPropagation()}
            >
              [link]
            </a>
          )}
        </div>
      </div>

      <div className="list-item-row__actions">
        <span className="list-item-row__added-by">@{item.addedBy.username}</span>
        <span className="list-item-row__delete-container">
          {canEdit && isOwner ? (
            <button
              className="list-item-row__delete"
              onClick={handleDelete}
              disabled={isDeleting}
              aria-label="Delete item"
            >
              x
            </button>
          ) : (
            <span className="list-item-row__delete-placeholder"></span>
          )}
        </span>
      </div>
    </div>
  );
}
