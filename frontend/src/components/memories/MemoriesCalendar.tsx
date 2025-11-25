import { useState, useEffect, useMemo, useCallback } from 'react';
import { TEXT } from '../../constants/text';
import { getMemories, getMemoryBlob } from '../../services/api';
import type { MemoryFile } from '../../services/api';
import './MemoriesCalendar.css';

// ============================================
// DEBUG MODE - Toggle this for development
// ============================================
const DEBUG_MODE = import.meta.env.DEV; // Only available in dev mode
const USE_MOCK_DATA = true; // Set to false to use real API

// Generate dummy data for the past few months
function generateMockMemories(): MemoryFile[] {
  const memories: MemoryFile[] = [];
  const today = new Date();
  
  // Generate random uploads over the past 3 months
  for (let i = 0; i < 90; i++) {
    // ~30% chance of having an upload on any given day
    if (Math.random() < 0.3) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = formatDateKey(date); // Use local timezone
      
      // Sometimes add multiple uploads per day
      const uploadsToday = Math.random() < 0.2 ? Math.floor(Math.random() * 3) + 2 : 1;
      
      for (let j = 0; j < uploadsToday; j++) {
        const isVideo = Math.random() < 0.3;
        const ext = isVideo ? 'mp4' : ['jpg', 'png', 'webp'][Math.floor(Math.random() * 3)];
        memories.push({
          filename: `memory_${dateStr}_${j}.${ext}`,
          timestamp: date.getTime() + j * 1000,
          date: dateStr,
        });
      }
    }
  }
  
  return memories;
}

interface MemoriesCalendarProps {
  token: string;
}

interface DayData {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  memories: MemoryFile[];
  thumbnailUrl?: string;
}

const DAYS_OF_WEEK = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function MemoriesCalendar({ token }: MemoriesCalendarProps) {
  const [memories, setMemories] = useState<MemoryFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = current month, 1 = last month, etc.
  const [useMockData, setUseMockData] = useState(USE_MOCK_DATA); // Debug toggle state

  // Load memories from API (or use mock data in debug mode)
  useEffect(() => {
    async function loadMemories() {
      try {
        setLoading(true);
        setError(null);
        
        // Use mock data in debug mode
        if (DEBUG_MODE && useMockData) {
          console.log('[DEBUG] Using mock data for calendar');
          await new Promise(resolve => setTimeout(resolve, 300)); // Simulate loading
          setMemories(generateMockMemories());
          return;
        }
        
        const response = await getMemories(token);
        
        if (response.success && response.files) {
          setMemories(response.files);
        } else {
          setError(response.error || 'Failed to load memories');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    loadMemories();
  }, [token, useMockData]);

  // Group memories by date (using LOCAL timezone from timestamp)
  const memoriesByDate = useMemo(() => {
    const map = new Map<string, MemoryFile[]>();
    memories.forEach(memory => {
      // Convert timestamp to local date key instead of using server's UTC date
      const localDate = new Date(memory.timestamp);
      const dateKey = formatDateKey(localDate);
      const existing = map.get(dateKey) || [];
      map.set(dateKey, [...existing, memory]);
    });
    return map;
  }, [memories]);

  // Load thumbnails for days with memories
  useEffect(() => {
    async function loadThumbnails() {
      const newThumbnails = new Map<string, string>();
      
      // Get unique dates with memories
      const dates = Array.from(memoriesByDate.entries());
      
      for (const [date, files] of dates) {
        if (files.length > 0) {
          // Get the most recent file for this date
          const mostRecent = files.reduce((a, b) => 
            a.timestamp > b.timestamp ? a : b
          );
          
          // Check if it's an image (for thumbnail)
          const ext = mostRecent.filename.split('.').pop()?.toLowerCase();
          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
          
          if (isImage) {
            try {
              const blob = await getMemoryBlob(mostRecent.filename, token);
              if (blob) {
                const url = URL.createObjectURL(blob);
                newThumbnails.set(date, url);
              }
            } catch {
              // Skip failed thumbnails
            }
          }
        }
      }
      
      setThumbnails(newThumbnails);
    }
    
    if (memoriesByDate.size > 0) {
      loadThumbnails();
    }
    
    // Cleanup URLs on unmount
    return () => {
      thumbnails.forEach(url => URL.revokeObjectURL(url));
    };
  }, [memoriesByDate, token]);

  // Generate current viewed month
  const currentMonth = useMemo(() => {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() - currentMonthOffset, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = generateMonthDays(year, month, memoriesByDate);
    return { year, month, days };
  }, [memoriesByDate, currentMonthOffset]);

  // Navigation handlers
  const goToPreviousMonth = useCallback(() => {
    setCurrentMonthOffset(prev => prev + 1);
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonthOffset(prev => Math.max(0, prev - 1));
  }, []);

  const goToToday = useCallback(() => {
    setCurrentMonthOffset(0);
  }, []);

  // Check if date is today
  const isToday = useCallback((date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }, []);

  // Calculate streak length (consecutive days with uploads ending on this date)
  const getStreakLength = useCallback((date: Date, memoriesByDate: Map<string, MemoryFile[]>): number => {
    const dateStr = formatDateKey(date);
    if (!memoriesByDate.has(dateStr)) return 0;
    
    let streak = 1;
    let checkDate = new Date(date);
    
    // Count backwards from yesterday
    while (streak < 999) {
      checkDate.setDate(checkDate.getDate() - 1);
      const checkStr = formatDateKey(checkDate);
      if (memoriesByDate.has(checkStr)) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }, []);

  // Get kaomoji based on streak length
  const getStreakKaomoji = useCallback((streak: number): string | null => {
    if (streak < 2) return null; // No streak indicator for single days
    if (streak >= 100) return '(ノ°▽°)ノ︵┻━┻';
    if (streak >= 50) return '٩(◕‿◕｡)۶';
    if (streak >= 30) return '(づ￣ ³￣)づ';
    if (streak >= 20) return '(*≧▽≦)';
    if (streak >= 10) return '(ノ´ヮ`)ノ*:･ﾟ✧';
    if (streak >= 7) return '(◕‿◕✿)';
    if (streak >= 5) return '(•̀ᴗ•́)و';
    if (streak >= 3) return '(๑•̀ㅂ•́)و';
    return '(･ω･)'; // 2 day streak
  }, []);

  if (loading) {
    return (
      <div className="memories-container">
        <div className="memories-loading">
          <div className="memories-spinner" />
          <p>{TEXT.memories.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="memories-container">
        <div className="memories-error">
          <p>{TEXT.memories.error}</p>
          <p className="memories-error-detail">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="memories-container">
      {memories.length === 0 ? (
        <div className="memories-empty">
          <div className="empty-calendar-icon">(´・ω・`)</div>
          <p>{TEXT.memories.empty}</p>
          <p className="memories-hint">Upload photos/videos to see them here</p>
        </div>
      ) : (
        <div className="memories-calendar">
          <div className="calendar-month">
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
                {TEXT.memories.today}
              </button>
            )}
            
            <div className="calendar-weekdays">
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="calendar-weekday">{day}</div>
              ))}
            </div>
            
            <div className="calendar-grid">
              {currentMonth.days.map((day, idx) => {
                const dateKey = formatDateKey(day.date);
                const thumbnail = thumbnails.get(dateKey);
                const hasMemories = day.memories.length > 0;
                const streakLength = getStreakLength(day.date, memoriesByDate);
                const streakKaomoji = getStreakKaomoji(streakLength);
                
                return (
                  <div
                    key={idx}
                    className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${hasMemories ? 'has-memories' : ''} ${isToday(day.date) ? 'is-today' : ''}`}
                    onClick={() => hasMemories && setSelectedDay(day)}
                  >
                    {streakKaomoji && (
                      <span className="streak-indicator">{streakKaomoji}</span>
                    )}
                    
                    {thumbnail ? (
                      <div className="day-thumbnail-container">
                        <img 
                          src={thumbnail} 
                          alt="" 
                          className="day-thumbnail"
                        />
                        {day.memories.length > 1 && (
                          <span className="day-count">{day.memories.length}</span>
                        )}
                      </div>
                    ) : hasMemories ? (
                      <div className="day-dot-container">
                        <span className="day-number">{day.dayOfMonth}</span>
                        <span className="day-dot" />
                        {day.memories.length > 1 && (
                          <span className="day-count">{day.memories.length}</span>
                        )}
                      </div>
                    ) : (
                      <span className="day-number">{day.dayOfMonth}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetailModal 
          day={selectedDay} 
          token={token}
          onClose={() => setSelectedDay(null)} 
        />
      )}

      {/* Debug toggle - only visible in dev mode */}
      {DEBUG_MODE && (
        <div className="debug-panel">
          <span className="debug-label">[DEV]</span>
          <button 
            className={`debug-toggle ${useMockData ? 'active' : ''}`}
            onClick={() => setUseMockData(!useMockData)}
          >
            {useMockData ? 'MOCK DATA: ON' : 'MOCK DATA: OFF'}
          </button>
          <span className="debug-info">
            {memories.length} memories loaded
          </span>
        </div>
      )}
    </div>
  );
}

// Helper to format date as YYYY-MM-DD using LOCAL timezone (not UTC)
function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate days for a month including padding days
function generateMonthDays(
  year: number, 
  month: number, 
  memoriesByDate: Map<string, MemoryFile[]>
): DayData[] {
  const days: DayData[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Get day of week (0 = Sunday, convert to Monday = 0)
  let startDayOfWeek = firstDay.getDay() - 1;
  if (startDayOfWeek < 0) startDayOfWeek = 6;
  
  // Add padding days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    const dateKey = formatDateKey(date);
    days.push({
      date,
      dayOfMonth: date.getDate(),
      isCurrentMonth: false,
      memories: memoriesByDate.get(dateKey) || [],
    });
  }
  
  // Add days of current month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateKey = formatDateKey(date);
    days.push({
      date,
      dayOfMonth: d,
      isCurrentMonth: true,
      memories: memoriesByDate.get(dateKey) || [],
    });
  }
  
  // Add padding days for next month to complete the grid
  const remainingDays = 7 - (days.length % 7);
  if (remainingDays < 7) {
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateKey = formatDateKey(date);
      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: false,
        memories: memoriesByDate.get(dateKey) || [],
      });
    }
  }
  
  return days;
}

// Day detail modal component
interface DayDetailModalProps {
  day: DayData;
  token: string;
  onClose: () => void;
}

function DayDetailModal({ day, token, onClose }: DayDetailModalProps) {
  const [mediaUrls, setMediaUrls] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMedia() {
      setLoading(true);
      const urls = new Map<string, string>();
      
      for (const memory of day.memories) {
        try {
          const blob = await getMemoryBlob(memory.filename, token);
          if (blob) {
            urls.set(memory.filename, URL.createObjectURL(blob));
          }
        } catch {
          // Skip failed loads
        }
      }
      
      setMediaUrls(urls);
      setLoading(false);
    }
    
    loadMedia();
    
    return () => {
      mediaUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [day.memories, token]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="day-modal-overlay" onClick={onClose}>
      <div className="day-modal" onClick={e => e.stopPropagation()}>
        <div className="day-modal-header">
          <button className="day-modal-close" onClick={onClose}>✕</button>
          <h3 className="day-modal-title">{formatDate(day.date)}</h3>
          <div className="day-modal-spacer" />
        </div>
        
        <div className="day-modal-content">
          {loading ? (
            <div className="memories-loading">
              <div className="memories-spinner" />
            </div>
          ) : (
            <div className="day-modal-grid">
              {day.memories.map(memory => {
                const url = mediaUrls.get(memory.filename);
                const ext = memory.filename.split('.').pop()?.toLowerCase();
                const isVideo = ['mp4', 'mov', 'webm'].includes(ext || '');
                
                return (
                  <div key={memory.filename} className="day-modal-item">
                    {url ? (
                      isVideo ? (
                        <video 
                          src={url} 
                          controls 
                          className="day-modal-media"
                        />
                      ) : (
                        <img 
                          src={url} 
                          alt={memory.filename}
                          className="day-modal-media"
                        />
                      )
                    ) : (
                      <div className="day-modal-placeholder">
                        {memory.filename}
                      </div>
                    )}
                    <div className="day-modal-filename">
                      {memory.filename}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

