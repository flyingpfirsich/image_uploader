import { useMemo } from 'react';
import type { User } from '../../types';

// Birthday kaomoji
const BIRTHDAY_KAOMOJI = '(^o^)/';
const CAKE_KAOMOJI = '(ノ´ヮ`)ノ✧';

interface UpcomingBirthdaysProps {
  friends: User[];
}

export function UpcomingBirthdays({ friends }: UpcomingBirthdaysProps) {
  const upcomingBirthdays = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();

    const friendsWithBirthdays = friends
      .filter((f) => f.birthday)
      .map((friend) => {
        const [, month, day] = friend.birthday!.split('-').map(Number);
        let birthdayThisYear = new Date(currentYear, month - 1, day);

        // If birthday already passed this year, use next year
        if (birthdayThisYear < today) {
          birthdayThisYear = new Date(currentYear + 1, month - 1, day);
        }

        const daysUntil = Math.ceil(
          (birthdayThisYear.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          friend,
          birthdayThisYear,
          daysUntil,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 3); // Show next 3 birthdays

    return friendsWithBirthdays;
  }, [friends]);

  if (upcomingBirthdays.length === 0) return null;

  return (
    <div className="upcoming-birthdays">
      <h4 className="upcoming-title">{BIRTHDAY_KAOMOJI} Upcoming Birthdays</h4>
      <ul className="upcoming-list">
        {upcomingBirthdays.map(({ friend, birthdayThisYear, daysUntil }) => (
          <li key={friend.id} className="upcoming-item">
            <span className="upcoming-name">{friend.displayName}</span>
            <span className="upcoming-date">
              {birthdayThisYear.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {daysUntil === 0 && <span className="upcoming-today"> — TODAY! {CAKE_KAOMOJI}</span>}
              {daysUntil === 1 && <span className="upcoming-soon"> — tomorrow!</span>}
              {daysUntil > 1 && daysUntil <= 7 && (
                <span className="upcoming-soon"> — in {daysUntil} days</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
