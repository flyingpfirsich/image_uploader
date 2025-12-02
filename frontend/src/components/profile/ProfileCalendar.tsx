import { useState, useMemo, useCallback } from 'react';
import type { User, Post } from '../../types';
import { DayDetailModal, type DayData } from './DayDetailModal';
import { UpcomingBirthdays } from './UpcomingBirthdays';
import './ProfileCalendar.css';

interface ProfileCalendarProps {
  posts: Post[];
  friends: User[];
  token: string;
}

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

// Streak kaomoji based on length
const STREAK_KAOMOJI: Record<number, string> = {
  0: '(´・ω・`)',
  1: '(・ω・)',
  2: '(・ω・)ノ',
  3: '(๑•̀ㅂ•́)و',
  5: '(•̀ᴗ•́)و',
  7: '(◕‿◕✿)',
  10: '(ノ´ヮ`)ノ*:･ﾟ✧',
  14: '(*≧▽≦)',
  21: '(づ￣ ³￣)づ',
  30: '٩(◕‿◕｡)۶',
  50: '(ノ°▽°)ノ︵┻━┻',
  100: '☆*:.｡.o(≧▽≦)o.｡.:*☆',
};

function getStreakKaomoji(streak: number): string {
  const thresholds = Object.keys(STREAK_KAOMOJI)
    .map(Number)
    .sort((a, b) => b - a);
  for (const threshold of thresholds) {
    if (streak >= threshold) {
      return STREAK_KAOMOJI[threshold];
    }
  }
  return STREAK_KAOMOJI[0];
}

// Birthday kaomoji
const BIRTHDAY_KAOMOJI = '(^o^)/';
const CAKE_KAOMOJI = '(ノ´ヮ`)ノ✧';

// Helper to format date as YYYY-MM-DD using LOCAL timezone
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get MM-DD for birthday matching
function formatMonthDay(dateStr: string): string {
  // birthday is stored as YYYY-MM-DD, we need MM-DD for annual matching
  return dateStr.slice(5);
}

// Generate days for a month
function generateMonthDays(
  year: number,
  month: number,
  postsByDate: Map<string, Post[]>,
  birthdaysByMonthDay: Map<string, User[]>
): DayData[] {
  const days: DayData[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get day of week (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;

  // Add padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    const dateKey = formatDateKey(date);
    const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    days.push({
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: false,
      uploads: postsByDate.get(dateKey) || [],
      birthdays: birthdaysByMonthDay.get(monthDay) || [],
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Add days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateKey = formatDateKey(date);
    const monthDay = `${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: true,
      uploads: postsByDate.get(dateKey) || [],
      birthdays: birthdaysByMonthDay.get(monthDay) || [],
      isToday: date.getTime() === today.getTime(),
    });
  }

  // Add padding days for next month to complete the grid
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateKey = formatDateKey(date);
      const monthDay = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: false,
        uploads: postsByDate.get(dateKey) || [],
        birthdays: birthdaysByMonthDay.get(monthDay) || [],
        isToday: date.getTime() === today.getTime(),
      });
    }
  }

  return days;
}

export function ProfileCalendar({ posts, friends, token }: ProfileCalendarProps) {
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);

  // Group posts by date
  const postsByDate = useMemo(() => {
    const map = new Map<string, Post[]>();
    posts.forEach((post) => {
      const date = new Date(post.createdAt);
      const dateKey = formatDateKey(date);
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, post]);
    });
    return map;
  }, [posts]);

  // Group friends by birthday (MM-DD for annual matching)
  const birthdaysByMonthDay = useMemo(() => {
    const map = new Map<string, User[]>();
    friends.forEach((friend) => {
      if (friend.birthday) {
        const monthDay = formatMonthDay(friend.birthday);
        const existing = map.get(monthDay) || [];
        map.set(monthDay, [...existing, friend]);
      }
    });
    return map;
  }, [friends]);

  // Calculate current streak
  const currentStreak = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const checkDate = new Date(today);

    // Check if there's a post today first
    const todayKey = formatDateKey(today);
    const hasPostToday = postsByDate.has(todayKey);

    // If no post today, check yesterday as the start
    if (!hasPostToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Count consecutive days with posts
    while (true) {
      const dateKey = formatDateKey(checkDate);
      if (postsByDate.has(dateKey)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [postsByDate]);

  // Calculate longest streak
  const longestStreak = useMemo(() => {
    if (posts.length === 0) return 0;

    // Get all unique dates with posts, sorted
    const dates = Array.from(postsByDate.keys()).sort();
    if (dates.length === 0) return 0;

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1]);
      const currDate = new Date(dates[i]);

      // Check if consecutive days
      const diffDays = Math.round(
        (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 1) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 1;
      }
    }

    return longest;
  }, [posts, postsByDate]);

  // Generate current viewed month
  const currentMonth = useMemo(() => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() - currentMonthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = generateMonthDays(year, month, postsByDate, birthdaysByMonthDay);
    return { year, month, days };
  }, [postsByDate, birthdaysByMonthDay, currentMonthOffset]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonthOffset((prev) => prev + 1);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonthOffset((prev) => Math.max(0, prev - 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonthOffset(0);
  }, []);

  // Total upload days count
  const totalUploadDays = postsByDate.size;

  return (
    <div className="profile-calendar">
      {/* Streak Header */}
      <div className="streak-header">
        <div className="streak-main">
          <span className="streak-kaomoji">{getStreakKaomoji(currentStreak)}</span>
          <div className="streak-info">
            <span className="streak-count">{currentStreak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>
        <div className="streak-stats">
          <div className="streak-stat">
            <span className="streak-stat-value">{longestStreak}</span>
            <span className="streak-stat-label">longest</span>
          </div>
          <div className="streak-stat">
            <span className="streak-stat-value">{totalUploadDays}</span>
            <span className="streak-stat-label">days active</span>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="calendar-section">
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            ←
          </button>
          <h3 className="calendar-month-title">
            {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
          </h3>
          <button
            className="calendar-nav-btn"
            onClick={goToNextMonth}
            disabled={currentMonthOffset === 0}
            aria-label="Next month"
          >
            →
          </button>
        </div>

        {currentMonthOffset > 0 && (
          <button className="calendar-today-btn" onClick={goToToday}>
            ↑ Today
          </button>
        )}

        <div className="calendar-weekdays">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {currentMonth.days.map((day, idx) => {
            const hasUploads = day.uploads.length > 0;
            const hasBirthday = day.birthdays.length > 0;

            return (
              <button
                key={idx}
                type="button"
                className={`
                  calendar-day
                  ${!day.isCurrentMonth ? 'other-month' : ''}
                  ${hasUploads ? 'has-uploads' : ''}
                  ${hasBirthday ? 'has-birthday' : ''}
                  ${day.isToday ? 'is-today' : ''}
                `}
                title={
                  hasBirthday
                    ? `${BIRTHDAY_KAOMOJI} ${day.birthdays.map((u) => u.displayName).join(', ')}`
                    : undefined
                }
                onClick={() => hasUploads && setSelectedDay(day)}
                disabled={!hasUploads}
              >
                <span className="day-number">{day.dayOfMonth}</span>

                {hasUploads && <span className="day-upload-dot" />}

                {hasBirthday && (
                  <span
                    className="day-birthday-indicator"
                    title={day.birthdays.map((u) => u.displayName).join(', ')}
                  >
                    {CAKE_KAOMOJI}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="calendar-legend">
          <div className="legend-item">
            <span className="legend-dot legend-dot--upload" />
            <span className="legend-label">Upload</span>
          </div>
          <div className="legend-item">
            <span className="legend-kaomoji">{CAKE_KAOMOJI}</span>
            <span className="legend-label">Birthday</span>
          </div>
        </div>
      </div>

      {/* Upcoming Birthdays */}
      {friends.some((f) => f.birthday) && <UpcomingBirthdays friends={friends} />}

      {/* Day Detail Modal */}
      {selectedDay && (
        <DayDetailModal day={selectedDay} token={token} onClose={() => setSelectedDay(null)} />
      )}
    </div>
  );
}
