import type { List } from '../../types';

interface ListCardProps {
  list: List;
  onClick: () => void;
}

export function ListCard({ list, onClick }: ListCardProps) {
  return (
    <button className="list-card" onClick={onClick}>
      <div className="list-card__header">
        <span className="list-card__title">{list.title}</span>
        <span className="list-card__count">{list.itemCount}</span>
        <span className="list-card__expand-icon">&gt;</span>
      </div>

      {list.description && <p className="list-card__description">{list.description}</p>}

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
