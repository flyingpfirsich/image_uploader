import { useState, useEffect } from 'react';
import type { List } from '../../types';
import * as api from '../../services/api';
import { ListCard } from './ListCard';
import { ListDetail } from './ListDetail';
import { CreateList } from './CreateList';

interface ListSectionProps {
  userId: string;
  currentUserId: string;
  token: string;
}

export function ListSection({ userId, currentUserId, token }: ListSectionProps) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isOwnProfile = userId === currentUserId;

  useEffect(() => {
    const fetchLists = async () => {
      try {
        const { lists: userLists } = await api.getListsByUser(token, userId);
        setLists(userLists);
      } catch (error) {
        console.error('Failed to fetch lists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLists();
  }, [token, userId]);

  const handleListCreate = (newList: List) => {
    setLists([newList, ...lists]);
    setExpandedListId(newList.id);
  };

  const handleListUpdate = (updatedList: List) => {
    setLists(lists.map((list) => (list.id === updatedList.id ? updatedList : list)));
  };

  const handleListDelete = (listId: string) => {
    setLists(lists.filter((list) => list.id !== listId));
    setExpandedListId(null);
  };

  const handleToggleExpand = (listId: string) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  if (isLoading) {
    return (
      <section className="list-section">
        <h3 className="section-title">Lists</h3>
        <div className="list-section__loading">Loading lists...</div>
      </section>
    );
  }

  return (
    <section className="list-section">
      <div className="list-section__header">
        <h3 className="section-title">Lists ({lists.length})</h3>
        {isOwnProfile && (
          <button
            className="btn btn--secondary btn--small"
            onClick={() => setShowCreateModal(true)}
          >
            + New List
          </button>
        )}
      </div>

      {lists.length === 0 ? (
        <div className="list-section__empty">
          <span className="list-section__empty-kaomoji">(´・ω・`)</span>
          <p>No lists yet</p>
          {isOwnProfile && (
            <button className="btn btn--secondary" onClick={() => setShowCreateModal(true)}>
              Create your first list
            </button>
          )}
        </div>
      ) : (
        <div className="list-section__lists">
          {lists.map((list) => (
            <div key={list.id} className="list-section__list-container">
              <ListCard
                list={list}
                isExpanded={expandedListId === list.id}
                onClick={() => handleToggleExpand(list.id)}
              />

              {expandedListId === list.id && (
                <ListDetail
                  list={list}
                  currentUserId={currentUserId}
                  token={token}
                  onClose={() => setExpandedListId(null)}
                  onListUpdate={handleListUpdate}
                  onListDelete={() => handleListDelete(list.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateList
          token={token}
          onCreate={handleListCreate}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </section>
  );
}
