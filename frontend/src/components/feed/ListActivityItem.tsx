import { useState } from 'react';
import type { ListActivity, List } from '../../types';
import * as api from '../../services/api';
import { ListDetail } from '../lists/ListDetail';

interface ListActivityItemProps {
  activity: ListActivity;
  token: string;
  currentUserId: string;
  onUserClick?: (userId: string) => void;
}

function formatTime(date: Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function ListActivityItem({
  activity,
  token,
  currentUserId,
  onUserClick,
}: ListActivityItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [list, setList] = useState<List | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (!isExpanded && !list) {
      setIsLoading(true);
      try {
        const data = await api.getList(token, activity.listId);
        setList(data);
        setIsExpanded(true);
      } catch (error) {
        console.error('Failed to fetch list:', error);
        // Fallback to navigating to user profile
        onUserClick?.(activity.userId);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="list-activity-item-wrapper">
      <button
        className={`list-activity-item ${isExpanded ? 'list-activity-item--expanded' : ''}`}
        onClick={handleClick}
        disabled={isLoading}
      >
        <span className="list-activity-item__icon">#</span>
        <div className="list-activity-item__content">
          <p className="list-activity-item__text">
            <span className="list-activity-item__user">@{activity.user.username}</span>
            {activity.type === 'list_created' ? (
              <>
                {' '}
                created list{' '}
                <span className="list-activity-item__list-title">"{activity.listTitle}"</span>
              </>
            ) : (
              <>
                {' '}
                added <span className="list-activity-item__item-title">
                  "{activity.itemTitle}"
                </span>{' '}
                to <span className="list-activity-item__list-title">"{activity.listTitle}"</span>
              </>
            )}
          </p>
          <span className="list-activity-item__time">
            {isLoading ? 'loading...' : formatTime(activity.createdAt)}
          </span>
        </div>
        <span className="list-activity-item__expand-icon">{isExpanded ? 'v' : '>'}</span>
      </button>

      {isExpanded && list && (
        <div className="list-activity-item__detail">
          <ListDetail
            list={list}
            currentUserId={currentUserId}
            token={token}
            onClose={() => setIsExpanded(false)}
            onListUpdate={(updated) => setList(updated)}
          />
        </div>
      )}
    </div>
  );
}
