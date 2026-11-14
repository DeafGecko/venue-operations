// src/components/admin/DashboardCharts.tsx
interface Props {
  monthly: { month: string; revenue: number }[];
  statusCounts: { paid: number; partial: number; unpaid: number };
  revenueSlices: { label: string; value: number }[];
}

const COLORS = ['#a66f00','#3f8f6c','#c45f3c','#3f78c5','#b94e7c','#7357c7','#168477','#c25712','#64748b','#4b5563'];

function PieChart({ slices }: { slices: { label: string; value: number }[] }) {
  const total = slices.reduce((s, i) => s + i.value, 0);
  if (total === 0) return <p className="py-8 text-center text-xs text-[#6b7280]">No revenue data</p>;

  const r = 44; const cx = 60; const cy = 60;
  let cumulative = 0;

  const paths = slices.map(({ value }, i) => {
    const pct = value / total;
    const start = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += pct;
    const end = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    return { d: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${pct > 0.5 ? 1 : 0},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length] };
  });

  return (
    <div>
      <div className="flex items-center justify-center py-2">
      <svg
        viewBox="0 0 120 120"
        className="h-36 w-36 shrink-0 drop-shadow-[0_10px_20px_rgba(17,24,39,0.12)]"
        role="img"
        aria-label={`Revenue by event type. Total $${total.toLocaleString()}. ${slices.map(({ label, value }) => `${label}: $${value.toLocaleString()}`).join("; ")}.`}
      >
        {paths.map((path, index) => (
          <path
            key={index}
            d={path.d}
            fill={path.color}
            stroke="#ffffff"
            strokeWidth="2"
            className="transition-opacity hover:opacity-80"
          />
        ))}
        <circle cx={cx} cy={cy} r={27} fill="#ffffff" />
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="8" fill="#6b7280">TOTAL</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="11" fill="#111827" fontWeight="700">${(total/1000).toFixed(1)}k</text>
      </svg>
      </div>
      <ul className="mt-2 space-y-3">
        {slices.map(({ label, value }, i) => (
          <li key={label}>
            <div className="mb-1.5 flex items-center gap-2 text-[0.65rem]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="truncate font-medium text-[#4b5563]">{label}</span>
              <span className="ml-auto shrink-0 font-semibold text-[#111827]">${(value / 1000).toFixed(1)}k</span>
              <span className="w-8 shrink-0 text-right text-[#6b7280]">{Math.round((value / total) * 100)}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eef0f2]">
              <div
                className="h-full rounded-full"
                style={{ width: `${(value / total) * 100}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BarChart({ monthly }: { monthly: Props['monthly'] }) {
  const max = Math.max(...monthly.map(m => m.revenue), 1);
  const summary = monthly
    .map(({ month, revenue }) => `${month}: $${revenue.toLocaleString()}`)
    .join("; ");
  return (
    <div
      className="relative h-40 w-full"
      role="img"
      aria-label={`Revenue by month. ${summary}.`}
    >
      <div aria-hidden="true" className="absolute inset-x-0 bottom-5 top-5 flex flex-col justify-between">
        {[0, 1, 2, 3].map((line) => (
          <span key={line} className="border-t border-dashed border-[#d7e4de]" />
        ))}
      </div>
      <div className="relative flex h-full gap-2 sm:gap-3">
      {monthly.map(({ month, revenue }) => (
        <div key={month} className="flex-1 flex min-w-0 flex-col items-center gap-1">
          <span aria-hidden="true" className="text-[0.55rem] font-semibold text-[#4b5563]">
            ${(revenue / 1000).toFixed(1)}k
          </span>
          <div className="flex min-h-0 w-full flex-1 items-end">
            <div
              aria-hidden="true"
              className={`w-full rounded-t-md border transition-all duration-300 hover:-translate-y-1 hover:brightness-105 ${
                month === monthly.at(-1)?.month
                  ? "border-[#805600] bg-[#a66f00] shadow-[0_8px_18px_rgba(166,111,0,0.2)]"
                  : "border-[#287451] bg-[#3f8f6c]"
              }`}
              style={{ height: `${Math.max((revenue / max) * 100, 2)}%` }}
              title={`${month}: $${revenue.toLocaleString()}`}
            />
          </div>
          <span aria-hidden="true" className={`w-full truncate text-center text-[0.6rem] ${
            month === monthly.at(-1)?.month ? "font-semibold text-[#765000]" : "text-[#6b7280]"
          }`}>{month}</span>
        </div>
      ))}
      </div>
    </div>
  );
}

export default function DashboardCharts({ monthly, revenueSlices }: Props) {
  const monthlyTotal = monthly.reduce((sum, item) => sum + item.revenue, 0);
  const monthlyAverage = monthly.length > 0 ? monthlyTotal / monthly.length : 0;
  const latestRevenue = monthly.at(-1)?.revenue ?? 0;
  const previousRevenue = monthly.at(-2)?.revenue ?? 0;
  const growth = previousRevenue > 0
    ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
    : 0;
  const eventTypeTotal = revenueSlices.reduce((sum, item) => sum + item.value, 0);
  const leadingEventType = revenueSlices.reduce<(typeof revenueSlices)[number] | undefined>(
    (leading, item) => !leading || item.value > leading.value ? item : leading,
    undefined,
  );
  const leadingShare = leadingEventType && eventTypeTotal > 0
    ? (leadingEventType.value / eventTypeTotal) * 100
    : 0;

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="relative h-full overflow-hidden rounded-lg border border-[#d9e7e0] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#287451]">Revenue by Month</p>
            <p className="mt-1 text-[0.65rem] text-[#6b7280]">Six-month booked performance</p>
          </div>
          <span className={`rounded-full border px-2 py-1 text-[0.6rem] font-semibold ${
            growth >= 0
              ? "border-[#b9ddcc] bg-[#edf8f2] text-[#287451]"
              : "border-red-200 bg-red-50 text-red-600"
          }`}>
            {growth >= 0 ? "+" : ""}{growth.toFixed(1)}%
          </span>
        </div>
        <div className="mb-4 flex items-end gap-2">
          <p className="text-3xl font-semibold leading-none text-[#111827]">
            ${(monthlyTotal / 1000).toFixed(1)}k
          </p>
          <p className="pb-0.5 text-[0.65rem] text-[#6b7280]">booked revenue</p>
        </div>
        <BarChart monthly={monthly} />
        <div className="mt-3 flex items-center justify-between border-t border-[#e5e7eb] pt-3 text-[0.6rem]">
          <span className="text-[#6b7280]">Monthly average</span>
          <span className="font-semibold text-[#374151]">${(monthlyAverage / 1000).toFixed(1)}k</span>
        </div>
      </div>
      <div className="h-full overflow-hidden rounded-lg border border-[#eadfbf] bg-white p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#765000]">Revenue by Event Type</p>
            <p className="mt-1 text-[0.65rem] text-[#6b7280]">Portfolio contribution mix</p>
          </div>
          <span className="rounded-full border border-[#d1b35a] bg-[#fff9e7] px-2 py-1 text-[0.6rem] font-semibold text-[#765000]">
            {revenueSlices.length} segments
          </span>
        </div>
        <PieChart slices={revenueSlices} />
        <div className="mt-4 flex items-center justify-between border-t border-[#e5e7eb] pt-3 text-[0.6rem]">
          <span className="text-[#6b7280]">Largest contributor</span>
          <span className="font-semibold text-[#374151]">{leadingEventType?.label ?? "None"} · {leadingShare.toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}
