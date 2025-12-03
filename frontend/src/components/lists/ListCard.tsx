import type { List } from '../../types';

interface ListCardProps {
  list: List;
  isExpanded: boolean;
  onClick: () => void;
}

export function ListCard({ list, isExpanded, onClick }: ListCardProps) {
  return (
    <button className={`list-card ${isExpanded ? 'list-card--expanded' : ''}`} onClick={onClick}>
      <div className="list-card__header">
        <span className="list-card__title">{list.title}</span>
        <span className="list-card__count">{list.itemCount}</span>
        <span className="list-card__expand-icon">{isExpanded ? 'v' : '>'}</span>
      </div>

      {list.description && !isExpanded && (
        <p className="list-card__description">{list.description}</p>
      )}

      <div className="list-card__meta">
        <span className="list-card__creator">by @{list.creator.username}</span>
        {!list.allowAnyoneAdd && (
          <span className="list-card__locked" title="Only owner can add items">
            [locked]
          </span>
        )}
      </div>
    </button>
  );
}
