import { useState, useEffect, useCallback } from 'react';
import * as api from '../../services/api';
import type { AdminStats, ActivityDay, TopPoster, EngagementStats, SystemInfo } from '../../services/api';

interface DashboardProps {
  token: string;
}

export function Dashboard({ token }: DashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityDay[]>([]);
  const [topPosters, setTopPosters] = useState<TopPoster[]>([]);
  const [engagement, setEngagement] = useState<EngagementStats | null>(null);
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, activityRes, postersRes, engagementRes, systemRes] = await Promise.all([
        api.getAdminStats(token),
        api.getAdminActivity(token),
        api.getAdminTopPosters(token),
        api.getAdminEngagement(token),
        api.getSystemInfo(token),
      ]);
      setStats(statsRes);
      setActivity(activityRes.activity);
      setTopPosters(postersRes.topPosters);
      setEngagement(engagementRes);
      setSystemInfo(systemRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="admin-loading">
        <span className="cursor-blink">loading dashboard</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <span className="error-icon">(╯°□°)╯</span>
        <span>{error}</span>
        <button className="btn btn--secondary" onClick={loadData}>retry</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats?.totalUsers || 0}</div>
          <div className="stat-label">total users</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalPosts || 0}</div>
          <div className="stat-label">total posts</div>
        </div>
        <div className="stat-card stat-card--highlight">
          <div className="stat-value">{stats?.postsToday || 0}</div>
          <div className="stat-label">posts today</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.activeUsersThisWeek || 0}</div>
          <div className="stat-label">active this week</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.totalReactions || 0}</div>
          <div className="stat-label">total reactions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.pushSubscriptions || 0}</div>
          <div className="stat-label">push subscribers</div>
        </div>
      </div>

      {/* Activity Chart */}
      <div className="dashboard-section">
        <h2 className="section-title">activity (last 30 days)</h2>
        <div className="activity-chart">
          <ActivityChart data={activity} />
        </div>
        <div className="chart-legend">
          <span className="legend-item"><span className="legend-dot legend-dot--posts"></span> posts</span>
          <span className="legend-item"><span className="legend-dot legend-dot--signups"></span> signups</span>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="dashboard-columns">
        {/* Top Posters */}
        <div className="dashboard-section">
          <h2 className="section-title">top posters</h2>
          {topPosters.length === 0 ? (
            <p className="empty-text">no posts yet</p>
          ) : (
            <ul className="top-posters-list">
              {topPosters.map((poster, index) => (
                <li key={poster.user?.id || index} className="top-poster-item">
                  <span className="poster-rank">#{index + 1}</span>
                  <span className="poster-name">{poster.user?.displayName || 'Unknown'}</span>
                  <span className="poster-username">@{poster.user?.username || '?'}</span>
                  <span className="poster-count">{poster.postCount} posts</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Engagement Stats */}
        <div className="dashboard-section">
          <h2 className="section-title">engagement</h2>
          <div className="engagement-stat">
            <span className="engagement-label">avg reactions/post:</span>
            <span className="engagement-value">{engagement?.avgReactionsPerPost || 0}</span>
          </div>
          <h3 className="subsection-title">top kaomoji</h3>
          {engagement?.topKaomoji && engagement.topKaomoji.length > 0 ? (
            <ul className="kaomoji-list">
              {engagement.topKaomoji.map((k, i) => (
                <li key={i} className="kaomoji-item">
                  <span className="kaomoji-face">{k.kaomoji}</span>
                  <span className="kaomoji-count">{k.count}x</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-text">no reactions yet</p>
          )}
        </div>
      </div>

      {/* System Info */}
      <div className="dashboard-section">
        <h2 className="section-title">system</h2>
        <div className="system-info">
          <div className="system-row">
            <span className="system-label">vapid configured:</span>
            <span className={`system-value ${systemInfo?.vapidConfigured ? 'system-value--ok' : 'system-value--warn'}`}>
              {systemInfo?.vapidConfigured ? 'yes' : 'no'}
            </span>
          </div>
          <div className="system-row">
            <span className="system-label">next notification:</span>
            <span className="system-value">
              {systemInfo?.scheduledNotificationTime 
                ? new Date(systemInfo.scheduledNotificationTime).toLocaleString()
                : 'not scheduled'}
            </span>
          </div>
          <div className="system-row">
            <span className="system-label">node version:</span>
            <span className="system-value">{systemInfo?.nodeVersion || '?'}</span>
          </div>
          <div className="system-row">
            <span className="system-label">uptime:</span>
            <span className="system-value">{formatUptime(systemInfo?.uptime || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple SVG line chart component
function ActivityChart({ data }: { data: ActivityDay[] }) {
  if (data.length === 0) {
    return <div className="chart-empty">no data</div>;
  }

  const width = 600;
  const height = 150;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxPosts = Math.max(...data.map(d => d.posts), 1);
  const maxSignups = Math.max(...data.map(d => d.signups), 1);
  const maxValue = Math.max(maxPosts, maxSignups);

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartWidth;
  const yScale = (val: number) => padding.top + chartHeight - (val / maxValue) * chartHeight;

  const postsPath = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.posts)}`
  ).join(' ');

  const signupsPath = data.map((d, i) => 
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.signups)}`
  ).join(' ');

  // Y-axis labels
  const yLabels = [0, Math.round(maxValue / 2), maxValue];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
      {/* Grid lines */}
      {yLabels.map((val, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={yScale(val)}
            x2={width - padding.right}
            y2={yScale(val)}
            className="chart-grid"
          />
          <text
            x={padding.left - 5}
            y={yScale(val) + 4}
            className="chart-label"
            textAnchor="end"
          >
            {val}
          </text>
        </g>
      ))}

      {/* X-axis labels (show every 7 days) */}
      {data.map((d, i) => {
        if (i % 7 !== 0 && i !== data.length - 1) return null;
        const date = new Date(d.date);
        return (
          <text
            key={i}
            x={xScale(i)}
            y={height - 5}
            className="chart-label"
            textAnchor="middle"
          >
            {date.getDate()}/{date.getMonth() + 1}
          </text>
        );
      })}

      {/* Lines */}
      <path d={postsPath} className="chart-line chart-line--posts" />
      <path d={signupsPath} className="chart-line chart-line--signups" />

      {/* Data points */}
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(d.posts)} r="3" className="chart-dot chart-dot--posts" />
          <circle cx={xScale(i)} cy={yScale(d.signups)} r="3" className="chart-dot chart-dot--signups" />
        </g>
      ))}
    </svg>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}





