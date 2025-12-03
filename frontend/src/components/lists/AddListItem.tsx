import { useState } from 'react';
import type { ListItem } from '../../types';
import * as api from '../../services/api';

interface AddListItemProps {
  listId: string;
  token: string;
  onAdd: (item: ListItem) => void;
  onCancel?: () => void;
}

export function AddListItem({ listId, token, onAdd, onCancel }: AddListItemProps) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showExtras, setShowExtras] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const item = await api.addListItem(token, listId, {
        title: title.trim(),
        note: note.trim() || undefined,
        externalUrl: externalUrl.trim() || undefined,
      });
      onAdd(item);
      setTitle('');
      setNote('');
      setExternalUrl('');
      setShowExtras(false);
    } catch (error) {
      console.error('Failed to add item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel?.();
    }
  };

  return (
    <form className="add-list-item" onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
      <div className="add-list-item__main">
        <input
          type="text"
          className="add-list-item__input"
          placeholder="Add item..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <button
          type="submit"
          className="add-list-item__submit"
          disabled={!title.trim() || isSubmitting}
        >
          {isSubmitting ? '...' : '+'}
        </button>
      </div>

      <div className="add-list-item__extras-toggle">
        <button type="button" className="btn--text" onClick={() => setShowExtras(!showExtras)}>
          {showExtras ? '− less' : '+ more options'}
        </button>
      </div>

      {showExtras && (
        <div className="add-list-item__extras">
          <input
            type="text"
            className="add-list-item__input add-list-item__input--note"
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <input
            type="url"
            className="add-list-item__input add-list-item__input--url"
            placeholder="Link URL (optional)"
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
        </div>
      )}
    </form>
  );
}
