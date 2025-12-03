import { useState } from 'react';
import type { List } from '../../types';
import * as api from '../../services/api';

interface CreateListProps {
  token: string;
  onCreate: (list: List) => void;
  onClose: () => void;
}

export function CreateList({ token, onCreate, onClose }: CreateListProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowAnyoneAdd, setAllowAnyoneAdd] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const list = await api.createList(token, {
        title: title.trim(),
        description: description.trim() || undefined,
        allowAnyoneAdd,
      });
      onCreate(list);
      onClose();
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal create-list-modal">
        <div className="modal__header">
          <h2>Create List</h2>
          <button className="modal__close" onClick={onClose}>
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-list-form">
          <input
            type="text"
            className="create-list-form__title"
            placeholder="List title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <textarea
            className="create-list-form__description"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          <div className="create-list-form__toggle-wrapper">
            <span className="create-list-form__toggle-label">Anyone can add items</span>
            <button
              type="button"
              className={`notification-toggle ${allowAnyoneAdd ? 'active' : ''}`}
              onClick={() => setAllowAnyoneAdd(!allowAnyoneAdd)}
            >
              <span className="toggle-track">
                <span className="toggle-thumb" />
              </span>
            </button>
          </div>

          <div className="create-list-form__actions">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={!title.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
