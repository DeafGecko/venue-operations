// src/components/admin/DashboardCharts.tsx
// Bento chart cards for the admin dashboard. Each card is its own island so the grid can place it.
import { useState } from 'react';

type MonthRow = { month: string; key: string; revenue: number };
type TypeRow = { label: string; amount: number; month: string };

// Segment colors (same family as the mockup): gold, green, terracotta, blue, then extras.
const SEGMENT = ['#9a6b1f', '#4f8a6b', '#b86a4f', '#4f72b8', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899', '#64748b'];
const BAR_NORMAL = '#5a8c70';
const BAR_CURRENT = '#9a6b1f';

const money = (n: number) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const moneyK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : money(n));

// ── Revenue by Month ─────────────────────────────────────────────────────────
export function MonthRevenueCard({ monthly }: { monthly: MonthRow[] }) {
  const max = Math.max(...monthly.map(m => m.revenue), 1);
  const total = monthly.reduce((s, m) => s + m.revenue, 0);
  const average = monthly.length ? total / monthly.length : 0;
  const last = monthly[monthly.length - 1];
  const prev = monthly[monthly.length - 2];
  const change = prev && prev.revenue > 0 ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : null;
  const AREA = 230; // tall enough to fill the card beside the action queue

  return (
    <div className="h-full bg-white border border-[#e5e7eb] rounded-2xl p-10 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#3f7d5d]">Revenue by Month</p>
          <p className="mt-1 text-sm text-[#6b7280]">Six-month booked performance</p>
        </div>
        {change !== null && (
          <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${change >= 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl font-semibold text-[#111827]">{moneyK(total)}</span>
        <span className="text-sm text-[#6b7280]">booked revenue</span>
      </div>

      <div className="mt-5 flex gap-2">
        {monthly.map((m, i) => {
          const isCurrent = i === monthly.length - 1;
          const h = m.revenue > 0 ? Math.max((m.revenue / max) * AREA, 4) : 2;
          return (
            <a key={m.key} href={`/admin/?month=${m.key}&from=dashboard`}
               aria-label={`${m.month} revenue ${money(m.revenue)}. Show bookings for ${m.month}`}
               className="flex-1 min-w-0 flex flex-col items-center gap-1.5 rounded-md hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#374151] transition">
              <span className="text-[0.7rem] font-medium text-[#374151]">{moneyK(m.revenue)}</span>
              <div className="w-full flex items-end" style={{ height: `${AREA}px` }}>
                <div className="w-full rounded-t-md transition-opacity hover:opacity-90" style={{ height: `${h}px`, backgroundColor: isCurrent ? BAR_CURRENT : BAR_NORMAL }} />
              </div>
              <span className={`text-xs ${isCurrent ? 'font-semibold text-[#8a5a10]' : 'text-[#6b7280]'}`}>{m.month}</span>
            </a>
          );
        })}
      </div>

      <div className="mt-auto pt-4 mt-5 border-t border-[#e5e7eb] flex items-center justify-between text-sm">
        <span className="text-[#6b7280]">Monthly average</span>
        <span className="font-semibold text-[#111827]">{moneyK(average)}</span>
      </div>
    </div>
  );
}

// ── Revenue by Event Type (with month filter and counts) ─────────────────────
function Donut({ slices, total }: { slices: { value: number }[]; total: number }) {
  const r = 46, cx = 60, cy = 60;
  let cum = 0;
  const paths = slices.map((sl, i) => {
    const pct = total > 0 ? sl.value / total : 0;
    const a0 = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const a1 = cum * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(a0), y1 = cy + r * Math.sin(a0);
    const x2 = cx + r * Math.cos(a1), y2 = cy + r * Math.sin(a1);
    const d = pct >= 1
      ? `M${cx - r},${cy} A${r},${r} 0 1,1 ${cx + r},${cy} A${r},${r} 0 1,1 ${cx - r},${cy} Z`
      : `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${x2},${y2} Z`;
    return <path key={i} d={d} fill={SEGMENT[i % SEGMENT.length]} stroke="#ffffff" strokeWidth="1.5" />;
  });
  return (
    <svg viewBox="0 0 120 120" className="w-40 h-40 shrink-0" role="img" aria-label={`Total ${moneyK(total)}`}>
      {paths}
      <circle cx={cx} cy={cy} r={30} fill="#ffffff" />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="8" fill="#6b7280">TOTAL</text>
      <text x={cx} y={cy + 11} textAnchor="middle" fontSize="11" fontWeight="700" fill="#111827">{moneyK(total)}</text>
    </svg>
  );
}

export function EventTypeCard({ typeRows }: { typeRows: TypeRow[] }) {
  const [period, setPeriod] = useState('all');
  const months = Array.from(new Set(typeRows.map(r => r.month).filter(Boolean))).sort().reverse();
  const monthText = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleString('en-US', { month: 'short', year: 'numeric' });

  const totals: Record<string, { value: number; count: number }> = {};
  for (const r of typeRows) {
    if (period !== 'all' && r.month !== period) continue;
    const t = (totals[r.label] ??= { value: 0, count: 0 });
    t.value += r.amount;
    t.count += 1;
  }
  const slices = Object.entries(totals).map(([label, t]) => ({ label, value: t.value, count: t.count })).sort((a, b) => b.value - a.value);
  const total = slices.reduce((s, x) => s + x.value, 0);
  const largest = slices[0];

  return (
    <div className="h-full bg-white border border-[#e5e7eb] rounded-2xl p-10 shadow-sm flex flex-col">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[#8a5a10]">Revenue by Event Type</p>
          <p className="mt-1 text-sm text-[#6b7280]">Portfolio contribution mix</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="type-period">Choose month</label>
          <select id="type-period" value={period} onChange={(e) => setPeriod(e.target.value)}
            className="h-7 rounded-md border border-[#e5e7eb] bg-white px-2 text-xs text-[#374151] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#374151]">
            <option value="all">All time</option>
            {months.map(m => <option key={m} value={m}>{monthText(m)}</option>)}
          </select>
        </div>
      </div>

      {total === 0 ? (
        <p className="py-10 text-center text-xs text-[#6b7280]">No revenue for this period.</p>
      ) : (
        <>
          <div className="mt-4 flex justify-center">
            <Donut slices={slices} total={total} />
          </div>
          <ul className="mt-4 space-y-3">
            {slices.map((sl, i) => {
              const pct = Math.round((sl.value / total) * 100);
              return (
                <li key={sl.label}>
                  <a href="/admin/bills?from=dashboard" className="block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#374151]">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: SEGMENT[i % SEGMENT.length] }} />
                      <span className="text-[#374151] truncate">{sl.label}</span>
                      <span className="text-xs text-[#9ca3af]">({sl.count})</span>
                      <span className="ml-auto font-semibold text-[#111827]">{moneyK(sl.value)}</span>
                      <span className="w-10 text-right text-[#6b7280]">{pct}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#eef0f3] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: SEGMENT[i % SEGMENT.length] }} />
                    </div>
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto pt-4 mt-4 border-t border-[#e5e7eb] flex items-center justify-between text-sm">
            <span className="text-[#6b7280]">Largest contributor</span>
            <span className="font-semibold text-[#111827]">{largest.label} · {Math.round((largest.value / total) * 100)}%</span>
          </div>
        </>
      )}
    </div>
  );
}
