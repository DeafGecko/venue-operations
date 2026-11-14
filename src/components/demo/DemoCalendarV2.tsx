import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Users,
  WalletCards,
  X,
  TrendingUp,
} from "lucide-react";
import type { DemoBooking } from "../../data/demoVenue";

type StatusFilter = "all" | DemoBooking["paymentStatus"];
type Props = { bookings: DemoBooking[] };

const monthNames = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

const statusStyles = {
  paid:    { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-700", label: "Paid" },
  partial: { dot: "bg-amber-500",   chip: "bg-amber-50 text-amber-700",     label: "Partial" },
  unpaid:  { dot: "bg-rose-500",    chip: "bg-rose-50 text-rose-700",       label: "Unpaid" },
};

// Left-border accent per booking type — adds visual variety to event chips
const typeAccents: Record<DemoBooking["bookingType"], string> = {
  corporate:      "border-l-sky-400",
  party:          "border-l-violet-400",
  community:      "border-l-emerald-400",
  "market-booth": "border-l-amber-400",
};

export default function DemoCalendarV2({ bookings }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1));
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedDay, setSelectedDay] = useState(25);
  const [selectedBooking, setSelectedBooking] = useState<DemoBooking | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthBookings = useMemo(
    () => bookings.filter((b) => {
      const d = new Date(b.eventDate);
      return d.getFullYear() === year && d.getMonth() === month &&
        (statusFilter === "all" || b.paymentStatus === statusFilter);
    }),
    [bookings, month, statusFilter, year],
  );

  const selectedDayBookings = monthBookings.filter(
    (b) => new Date(b.eventDate).getDate() === selectedDay,
  );
  const confirmedRevenue = monthBookings.reduce((t, b) => t + b.revenue, 0);
  const totalGuests = monthBookings.reduce((t, b) => t + b.guestCount, 0);
  const averageReadiness = monthBookings.length
    ? Math.round(monthBookings.reduce((t, b) => t + b.readiness, 0) / monthBookings.length)
    : 0;

  const getDayBookings = (day: number) =>
    monthBookings.filter((b) => new Date(b.eventDate).getDate() === day);

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(year, month + offset, 1));
    setSelectedDay(1);
  };

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3" aria-label="Calendar summary">
        {[
          { label: "Events",           value: monthBookings.length,              detail: "on the books",    icon: CalendarDays,  iconBg: "bg-sky-50",     iconColor: "text-sky-600"     },
          { label: "Expected revenue", value: `$${confirmedRevenue.toLocaleString()}`, detail: "this month", icon: WalletCards,   iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
          { label: "Guest traffic",    value: totalGuests.toLocaleString(),      detail: "expected guests", icon: Users,         iconBg: "bg-violet-50",  iconColor: "text-violet-600"  },
          { label: "Readiness",        value: `${averageReadiness}%`,            detail: "average score",   icon: CheckCircle2,  iconBg: "bg-amber-50",   iconColor: "text-amber-600"   },
        ].map(({ label, value, detail, icon: Icon, iconBg, iconColor }) => (
          <article key={label} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">{label}</p>
                <p className="mt-1 text-xl font-semibold text-[#111827]">{value}</p>
                <p className="text-[0.65rem] text-[#9ca3af]">{detail}</p>
              </div>
              <span className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center shrink-0 ${iconColor}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </span>
            </div>
          </article>
        ))}
      </section>

      {/* Calendar card */}
      <section className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <header className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="w-8 h-8 rounded-md border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f9fafb] transition"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-40 text-center">
              <h2 className="text-base font-semibold text-[#111827]">{monthNames[month]} {year}</h2>
              <p className="text-[0.6rem] uppercase tracking-widest text-[#9ca3af]">Venue schedule</p>
            </div>
            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="w-8 h-8 rounded-md border border-[#e5e7eb] flex items-center justify-center hover:bg-[#f9fafb] transition"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Status filter */}
          <div className="flex items-center p-0.5 rounded-md bg-[#f3f4f6]" aria-label="Filter by payment status">
            {(["all","paid","partial","unpaid"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                aria-pressed={statusFilter === s}
                className={`px-3 py-1.5 rounded text-[0.65rem] font-medium capitalize transition ${statusFilter === s ? "bg-white text-[#111827] shadow-sm" : "text-[#6b7280] hover:text-[#111827]"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </header>

        <div className="grid xl:grid-cols-[minmax(0,1fr)_18rem]">
          {/* Calendar grid */}
          <div className="overflow-x-auto" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div className="min-w-175">
              <div className="grid grid-cols-7 bg-[#f9fafb]" style={{ borderBottom: '1px solid var(--admin-border)' }}>
                {dayNames.map((d) => (
                  <div key={d} className="py-2 text-center text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`lead-${i}`} className="min-h-27 bg-[#f9fafb]" style={{ borderRight: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)' }} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayBookings = getDayBookings(day);
                  const isSelected = day === selectedDay;
                  const isToday = year === 2026 && month === 7 && day === 25;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={`min-h-27 p-2 bg-white text-left align-top hover:bg-[#fafafa] transition ${isSelected ? "ring-2 ring-inset ring-[#374151]" : ""}`}
                      style={{ borderRight: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)' }}
                      aria-label={`${monthNames[month]} ${day}, ${dayBookings.length} events`}
                    >
                      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold ${isToday ? "bg-[#111827] text-white" : "text-[#6b7280]"}`}>
                        {day}
                      </span>
                      <span className="mt-1.5 block space-y-1">
                        {dayBookings.slice(0, 2).map((b) => (
                          <span
                            key={b._id}
                            className={`flex items-center gap-1.5 rounded px-1.5 py-1 bg-[#f9fafb] border-l-2 ${typeAccents[b.bookingType]} text-[0.6rem] text-[#374151]`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyles[b.paymentStatus].dot}`} />
                            <span className="truncate">{b.eventName}</span>
                          </span>
                        ))}
                        {dayBookings.length > 2 && (
                          <span className="block pl-1 text-[0.55rem] text-[#6b7280]">+{dayBookings.length - 2} more</span>
                        )}
                      </span>
                    </button>
                  );
                })}
                {Array.from({ length: (7 - ((firstDayIndex + daysInMonth) % 7)) % 7 }).map((_, i) => (
                  <div key={`trail-${i}`} className="min-h-27 bg-[#f9fafb]" style={{ borderRight: '1px solid var(--admin-border)', borderBottom: '1px solid var(--admin-border)' }} />
                ))}
              </div>
            </div>
          </div>

          {/* Daily agenda sidebar */}
          <aside className="bg-[#fafafa] p-4" style={{ borderLeft: '1px solid var(--admin-border)' }} aria-label="Selected day agenda">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-[#9ca3af]">Daily agenda</p>
                <h3 className="mt-1 text-base font-semibold text-[#111827]">{monthNames[month]} {selectedDay}</h3>
              </div>
              <span className="text-[0.6rem] font-semibold text-[#6b7280]">{selectedDayBookings.length} events</span>
            </div>

            {selectedDayBookings.length ? (
              <div className="space-y-2">
                {selectedDayBookings.map((b) => (
                  <button
                    key={b._id}
                    type="button"
                    onClick={() => setSelectedBooking(b)}
                    className={`w-full bg-white border-l-2 ${typeAccents[b.bookingType]} rounded-md p-3 text-left transition`}
                    style={{ border: '1px solid var(--admin-border)', borderLeftWidth: '2px' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[0.6rem] font-semibold text-[#6b7280]">
                        {new Date(b.eventDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[0.55rem] font-semibold ${statusStyles[b.paymentStatus].chip}`}>
                        {statusStyles[b.paymentStatus].label}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-[#111827]">{b.eventName}</p>
                    <p className="mt-0.5 text-[0.65rem] text-[#6b7280] truncate">{b.clientName}</p>
                    <div className="mt-3 flex items-center justify-between text-[0.6rem] text-[#9ca3af]">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{b.assignedSpace}</span>
                      <span>{b.readiness}% ready</span>
                    </div>
                    {/* Readiness bar */}
                    <div className="mt-2 h-1 rounded-full bg-[#e5e7eb] overflow-hidden">
                      <div
                        className={`h-full rounded-full ${b.readiness >= 85 ? "bg-emerald-500" : b.readiness >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${b.readiness}%` }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#d1d5db] rounded-md px-4 py-10 text-center">
                <CalendarDays className="w-5 h-5 mx-auto text-[#9ca3af]" />
                <p className="mt-2 text-xs font-medium text-[#6b7280]">No events scheduled</p>
                <p className="mt-1 text-[0.6rem] text-[#9ca3af]">Select another date or adjust the filter.</p>
              </div>
            )}

            {/* Type legend */}
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
              <p className="text-[0.55rem] uppercase tracking-widest text-[#9ca3af] mb-2">Event types</p>
              <div className="space-y-1">
                {(Object.entries(typeAccents) as [DemoBooking["bookingType"], string][]).map(([type, cls]) => (
                  <div key={type} className="flex items-center gap-2 text-[0.6rem] text-[#6b7280] capitalize">
                    <span className={`w-2.5 h-2.5 rounded-sm border-l-2 ${cls.replace("border-l-","border-")}`} />
                    {type.replace("-", " ")}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <footer className="px-4 py-3 bg-white flex flex-wrap items-center gap-4 text-[0.6rem] text-[#6b7280]" style={{ borderTop: '1px solid var(--admin-border)' }}>
          {Object.entries(statusStyles).map(([status, style]) => (
            <span key={status} className="flex items-center gap-1.5 capitalize">
              <span className={`w-2 h-2 rounded-full ${style.dot}`} />
              {status}
            </span>
          ))}
          <span className="ml-auto">Click a date · then an event for details</span>
        </footer>
      </section>

      {/* Event detail modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 z-60 bg-black/45 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ev2-title"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-[#e5e7eb] flex items-start justify-between gap-4">
              <div>
                <span className={`inline-flex px-2 py-1 rounded text-[0.55rem] font-semibold ${statusStyles[selectedBooking.paymentStatus].chip}`}>
                  {statusStyles[selectedBooking.paymentStatus].label}
                </span>
                <h3 id="ev2-title" className="mt-3 text-xl font-semibold text-[#111827]">{selectedBooking.eventName}</h3>
                <p className="mt-1 text-xs text-[#6b7280]">{selectedBooking.clientName} · {selectedBooking.accountNumber}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-md flex items-center justify-center hover:bg-[#f3f4f6]"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </header>

            <div className="p-5 grid grid-cols-2 gap-4 text-xs">
              {[
                { label: "Schedule",    value: `${new Date(selectedBooking.eventDate).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})} – ${selectedBooking.endTime}`, icon: Clock3 },
                { label: "Space",       value: selectedBooking.assignedSpace, icon: MapPin },
                { label: "Attendance",  value: `${selectedBooking.guestCount} guests`, icon: Users },
                { label: "Coordinator", value: selectedBooking.coordinator, icon: CheckCircle2 },
                { label: "Revenue",     value: `$${selectedBooking.revenue.toLocaleString()}`, icon: WalletCards },
                { label: "Readiness",   value: `${selectedBooking.readiness}%`, icon: TrendingUp },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label}>
                  <p className="text-[0.55rem] uppercase tracking-widest text-[#9ca3af]">{label}</p>
                  <p className="mt-1 text-[#374151] flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#9ca3af] shrink-0" />
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mx-5 mb-5 p-3 bg-[#f9fafb] rounded-lg">
              <div className="flex items-center justify-between text-[0.6rem] mb-2">
                <span className="font-medium text-[#374151]">Operational readiness</span>
                <span className={`font-semibold ${selectedBooking.readiness >= 85 ? "text-emerald-600" : selectedBooking.readiness >= 70 ? "text-amber-600" : "text-rose-600"}`}>
                  {selectedBooking.readiness}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-[#e5e7eb] overflow-hidden">
                <div
                  className={`h-full rounded-full ${selectedBooking.readiness >= 85 ? "bg-emerald-500" : selectedBooking.readiness >= 70 ? "bg-amber-500" : "bg-rose-500"}`}
                  style={{ width: `${selectedBooking.readiness}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
