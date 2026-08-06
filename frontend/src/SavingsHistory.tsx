import { useEffect, useState } from 'react';
import { getSavingsSummary } from './api';
import type { PeriodSummaryOut } from './types';

type GroupBy = 'day' | 'week' | 'month' | 'year';

function formatPeriodLabel(periodStart: string, groupBy: GroupBy): string {
  const date = new Date(periodStart);
  if (groupBy === 'day') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  if (groupBy === 'week') return `Week of ${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  if (groupBy === 'month') return date.toLocaleDateString([], { month: 'long', year: 'numeric' });
  return date.toLocaleDateString([], { year: 'numeric' });
}

function SavingsHistory() {
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [rows, setRows] = useState<PeriodSummaryOut[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSavingsSummary(groupBy)
      .then(setRows)
      .catch(() => setError('Could not load savings history.'));
  }, [groupBy]);

  const totalSaved = rows.reduce((sum, r) => sum + r.total_saved, 0);

  return (
    <div className="history">
      <div className="history-header">
        <div>
          <div className="eyebrow">Savings history</div>
          <div className="total-saved">€{totalSaved.toFixed(2)} saved</div>
        </div>
        <div className="period-toggle">
          {(['day', 'week', 'month', 'year'] as GroupBy[]).map((g) => (
            <button
              key={g}
              className={`period-btn ${groupBy === g ? 'active' : ''}`}
              onClick={() => setGroupBy(g)}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {!error && rows.length === 0 && (
        <p className="empty-state">No charging sessions recorded yet for this view.</p>
      )}

      <div className="history-list">
        {rows.map((row, i) => (
          <div className="history-row" key={i}>
            <span className="history-period">{formatPeriodLabel(row.period_start, groupBy)}</span>
            <span className="history-count">
              {row.request_count} session{row.request_count !== 1 ? 's' : ''}
            </span>
            <span className="history-saved">€{row.total_saved.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavingsHistory;
