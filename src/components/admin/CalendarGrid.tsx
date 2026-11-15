// src/components/admin/CalendarGrid.tsx
// Interactive monthly calendar with event dots and modal

import { formatMoney } from '../../lib/money';
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, PartyPopper, FileText, ShoppingCart } from 'lucide-react';

interface Booking {
      _id: string;
      accountNumber: string;
      clientName: string;
      eventDate: string;
      paymentStatus: 'paid' | 'partial' | 'unpaid' | string;
      bookingType?: string;
      assignedSpace?: string;
      guestCount?: number;
      email?: string;
      phone?: string;
      eventType?: string;
      startTime?: string;
      endTime?: string;
      totalPrice?: number;
      amountPaid?: number;
}

interface Props {
      bookings: Booking[];
}

// Calendar grid component
export default function CalendarGrid({ bookings }: Props) {
      const [currentDate, setCurrentDate] = useState(new Date());
      // Payment panel: which group to show (dropdown in the panel)
      const [payFilter, setPayFilter] = useState<'paid' | 'partial' | 'unpaid'>('unpaid');
      const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
      const [isModalOpen, setIsModalOpen] = useState(false);

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();

// ── Get bookings for the current month ──
      const monthBookings = useMemo(() => {
            return bookings.filter((b) => {
                  const d = new Date(b.eventDate);
                  return d.getFullYear() === year && d.getMonth() === month;
      });
      }, [bookings, year, month]);

// ── Build calendar grid ──
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday

      const getDayBookings = (day: number) => {
            return monthBookings.filter((b) => {
                  const d = new Date(b.eventDate);
                  return d.getDate() === day;
            });
      };

// ── Navigation ──
      const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
      const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
      const goToToday = () => setCurrentDate(new Date());

// ── Date formatting ──
      const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
      ];

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Status colors ──
      const getStatusColor = (status: string) => {
            switch (status) {
                  case 'paid': return 'bg-emerald-500';
                  case 'partial': return 'bg-amber-500';
                  default: return 'bg-red-500';
            }
      };

      const getStatusLabel = (status: string) => {
            switch (status) {
                  case 'paid': return 'Paid';
                  case 'partial': return 'Partial';
                  default: return 'Unpaid';
            }
      };

      const getTypeIcon = (type?: string) => {
            switch (type) {
                  case 'lease': return <FileText className="w-3 h-3" />;
                  case 'market':
                  case 'market-booth': return <ShoppingCart className="w-3 h-3" />;
                  default: return <PartyPopper className="w-3 h-3" />;
            }
      };

// ── Open modal ──
      const openModal = (booking: Booking) => {
            setSelectedBooking(booking);
            setIsModalOpen(true);
      };

      const closeModal = () => {
            setIsModalOpen(false);
            setSelectedBooking(null);
      };

      // ── Month totals and payment groups for the top cards and the right-hand panel ──
      const sum = (list: Booking[], pick: (b: Booking) => number) => list.reduce((t, b) => t + (pick(b) || 0), 0);
      const byDate = (a: Booking, b: Booking) => (a.eventDate < b.eventDate ? -1 : 1);
      const paidList = monthBookings.filter(b => b.paymentStatus === 'paid').sort(byDate);
      const partialList = monthBookings.filter(b => b.paymentStatus === 'partial').sort(byDate);
      const unpaidList = monthBookings.filter(b => b.paymentStatus !== 'paid' && b.paymentStatus !== 'partial').sort(byDate);
      const expectedRevenue = sum(monthBookings, b => b.totalPrice || 0);
      const guestTotal = sum(monthBookings, b => b.guestCount || 0);
      const paidShare = monthBookings.length ? Math.round((paidList.length / monthBookings.length) * 100) : 0;
      const moneyFull = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const statCards = [
            { label: 'Events', value: String(monthBookings.length), note: 'this month' },
            { label: 'Expected revenue', value: moneyFull(expectedRevenue), note: 'booked this month' },
            { label: 'Guests', value: guestTotal.toLocaleString('en-US'), note: 'expected this month' },
            { label: 'Paid', value: `${paidShare}%`, note: `${paidList.length} of ${monthBookings.length} paid` },
      ];

      const PaymentGroup = ({ title, tone, list }: { title: string; tone: string; list: Booking[] }) => (
            <div>
                  <div className="flex items-center justify-between mb-2">
                        <span className={`text-[0.72rem] font-semibold uppercase tracking-widest ${tone}`}>{title}</span>
                        <span className="text-xs text-[var(--cal-muted)]">{list.length}</span>
                  </div>
                  {list.length === 0 ? (
                        <p className="text-xs text-[var(--cal-muted)] py-2">None this month.</p>
                  ) : (
                        <ul className="space-y-1">
                              {list.map((b) => (
                                    <li key={b._id}>
                                          <button type="button" onClick={() => openModal(b)}
                                                className="w-full flex items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-[var(--cal-hover)] transition">
                                                <span className="min-w-0">
                                                      <span className="block text-sm text-[var(--cal-text)] truncate">{b.clientName}</span>
                                                      <span className="block text-xs text-[var(--cal-muted)]">{shortDate(b.eventDate)} · {b.accountNumber}</span>
                                                </span>
                                                <span className="shrink-0 text-xs font-semibold text-[var(--cal-text)]">{moneyFull(Math.max((b.totalPrice || 0) - (b.amountPaid || 0), 0))} due</span>
                                          </button>
                                    </li>
                              ))}
                        </ul>
                  )}
            </div>
      );

      return (
      <div className="space-y-6">
        {/* Top cards: this month at a glance */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((c) => (
            <div key={c.label} className="cal-root rounded-2xl border border-[var(--cal-line)] px-8 py-5 shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--cal-muted)]">{c.label}</p>
              <p className="mt-2 text-2xl font-semibold text-[var(--cal-text)] leading-tight">{c.value}</p>
              <p className="mt-2 text-xs text-[var(--cal-muted)]">{c.note}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          <div className="flex-1 min-w-0 w-full">
      <div className="cal-root rounded-lg border border-[var(--cal-line)] overflow-hidden">
      <style>{`
        :root {
          --cal-bg: #ffffff; --cal-past: #f1f3f4; --cal-hover: #f8f9fa; --cal-line: #dadce0;
          --cal-text: #202124; --cal-muted: #5f6368; --cal-link: #1a73e8;
        }
        .dark, [data-theme="dark"] {
          --cal-bg: #1f2937; --cal-past: #0b1220; --cal-hover: #273244; --cal-line: #374151;
          --cal-text: #f3f4f6; --cal-muted: #d1d5db; --cal-link: #8ab4f8;
        }
        .cal-root { background: var(--cal-bg); color: var(--cal-text); }
        .cal-cell { background: var(--cal-bg); }
        .cal-cell.cal-past { background: var(--cal-past); }
        .cal-cell:hover { background: var(--cal-hover); }
        .cal-chip-plain { background: transparent; color: var(--cal-text); padding-left: 0.375rem; }
        .cal-chip-paid { background: #e6f4ea; color: #137333; }
        .cal-chip-partial { background: #fef7e0; color: #7a4a00; }
        .cal-chip-unpaid { background: #fce8e6; color: #a50e0e; }
        .dark .cal-chip-paid, [data-theme="dark"] .cal-chip-paid { background: #14532d; color: #bbf7d0; }
        .dark .cal-chip-partial, [data-theme="dark"] .cal-chip-partial { background: #713f12; color: #fde68a; }
        .dark .cal-chip-unpaid, [data-theme="dark"] .cal-chip-unpaid { background: #7f1d1d; color: #fecaca; }
      `}</style>

{/* ── Toolbar (Google Calendar style) ── */}
            <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                        <button
                              onClick={goToToday}
                              className="px-4 py-1.5 rounded-full border border-[var(--cal-line)] hover:bg-[var(--cal-past)] transition text-sm font-medium text-[var(--cal-text)]"
                        >
                              Today
                        </button>
                        <div className="flex items-center">
                              <button onClick={prevMonth} aria-label="Previous month" className="p-2 rounded-full hover:bg-[var(--cal-past)] transition">
                                    <ChevronLeft className="w-5 h-5 text-[var(--cal-muted)]" />
                              </button>
                              <button onClick={nextMonth} aria-label="Next month" className="p-2 rounded-full hover:bg-[var(--cal-past)] transition">
                                    <ChevronRight className="w-5 h-5 text-[var(--cal-muted)]" />
                              </button>
                        </div>
                        <h2 className="text-[22px] font-normal text-[var(--cal-text)]">
                              {monthNames[month]} {year}
                        </h2>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--cal-muted)]">
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#34a853]" />Paid</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#f9ab00]" />Partial</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#ea4335]" />Unpaid</span>
                  </div>
            </div>

{/* ── Day headers ── */}
            <div className="grid grid-cols-7 border-t border-[var(--cal-line)]">
                  {dayNames.map((day) => (
                        <div key={day} className="py-2 text-center text-[11px] font-medium text-[var(--cal-muted)] uppercase tracking-wide">
                              {day}
                        </div>
                  ))}
            </div>

{/* ── Calendar grid ── */}
            <div className="grid grid-cols-7 gap-px bg-[var(--cal-line)] border-t border-[var(--cal-line)]">
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                        <div key={`empty-${i}`} className="cal-cell min-h-[112px]" />
                  ))}

{Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            // Stack order inside a day: unpaid (top), partial (middle), paid (bottom)
            const STATUS_ORDER: Record<string, number> = { unpaid: 0, partial: 1, paid: 2 };
            const dayBookings = [...getDayBookings(day)].sort(
                  (a, b) => (STATUS_ORDER[a.paymentStatus] ?? 0) - (STATUS_ORDER[b.paymentStatus] ?? 0)
            );
            const isToday = new Date().getDate() === day &&
                  new Date().getMonth() === month &&
                  new Date().getFullYear() === year;
            const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
            const isPast = new Date(year, month, day) < todayStart;
            // Today's highlight only shows when today has at least one event
            const showToday = isToday && dayBookings.length > 0;

            return (
                  <div
                        key={day}
                        className={`min-h-[112px] p-1.5 flex flex-col gap-1 ${isPast ? 'cal-cell cal-past' : 'cal-cell'} transition`}
                  >
                        <span
                              className={`self-start text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${showToday ? 'bg-[#1a73e8] text-white' : isPast ? 'text-[var(--cal-muted)]' : 'text-[var(--cal-text)]'}`}
                        >
                              {day}
                        </span>

                        <div className="space-y-0.5">
                              {dayBookings.slice(0, 3).map((b) => {
                                    // Past days in 2026: plain text, no colored bar. Today and later keep the payment colors.
                                    const plainMonth = year === 2026 && isPast;
                                    const tone = plainMonth
                                          ? 'cal-chip-plain'
                                          : b.paymentStatus === 'paid'
                                          ? 'cal-chip cal-chip-paid'
                                          : b.paymentStatus === 'partial'
                                          ? 'cal-chip cal-chip-partial'
                                          : 'cal-chip cal-chip-unpaid';
                                    const time = (b as any).startTime ? `${(b as any).startTime} ` : '';
                                    return (
                                          <button
                                                key={b._id}
                                                onClick={() => openModal(b)}
                                                title={`${b.clientName} · ${getStatusLabel(b.paymentStatus)}`}
                                                className={`w-full text-left text-[11px] leading-tight line-clamp-2 break-words px-1.5 py-0.5 rounded hover:brightness-95 transition ${tone}`}
                                          >
                                                <span className="inline-flex items-center gap-1 align-middle">
                                                      <span className="shrink-0 opacity-80" aria-hidden="true">{getTypeIcon(b.bookingType)}</span>
                                                      {time && <span className="font-medium">{time}</span>}
                                                      {b.clientName}
                                                </span>
                                          </button>
                                    );
                              })}
                              {dayBookings.length > 3 && (
                                    <div className="text-[11px] font-medium text-[var(--cal-link)] pl-1.5">
                                          +{dayBookings.length - 3} more
                                    </div>
                              )}
                        </div>
                  </div>
                  );
            })}
      {/* Trailing empty cells to complete the last row */}
      {Array.from({ length: (7 - (firstDayIndex + daysInMonth) % 7) % 7 }).map((_, i) => (
        <div key={`trail-${i}`} className="cal-cell min-h-25 p-1" />
      ))}
      </div>

{/* ── Legend ── */}
      <div className="px-6 py-3 border-t border-[var(--cal-line)] bg-[var(--cal-past)] flex flex-wrap items-center gap-4 text-xs text-[var(--cal-muted)]">
            <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
            Paid
            </span>
            <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500" />
            Partial
            </span>
            <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500" />
            Unpaid
            </span>
            <span className="flex items-center gap-1.5 ml-4">
                  <PartyPopper className="w-3 h-3" /> Party
            </span>
            <span className="flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Lease
            </span>
            <span className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3 h-3" /> Market
            </span>
            <span className="ml-auto text-[var(--cal-muted)]">
                  {monthBookings.length} events this month
            </span>
      </div>

{/* ── Modal ── */}
      {isModalOpen && selectedBooking && (
            <div
                  className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                  onClick={closeModal}
            >
            <div
                  className="cal-root rounded-xl max-w-md w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
            >
            <div className="flex justify-between items-start mb-4">
                  <div>
                        <h3 className="text-xl font-light tracking-wide">{selectedBooking.clientName}</h3>
                        <p className="text-sm text-[var(--cal-muted)]">{selectedBooking.accountNumber}</p>
                  </div>
                  <button
                        onClick={closeModal}
                        className="p-1 hover:bg-[var(--cal-hover)] rounded-md transition"
                  >
                        <X className="w-5 h-5 text-[var(--cal-muted)]" />
                  </button>
            </div>

            <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                        <span className="text-[var(--cal-muted)]">Date</span>
                        <span className="text-[var(--cal-text)]">
                              {new Date(selectedBooking.eventDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                        })}
                        </span>
                  </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                  <span className="text-[var(--cal-muted)]">Time</span>
                  <span className="text-[var(--cal-text)]">
                        {new Date(selectedBooking.eventDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        })}
                  </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                  <span className="text-[var(--cal-muted)]">Type</span>
                  <span className="text-[var(--cal-text)]">
                        <span className="flex items-center gap-1.5">
                          {selectedBooking.bookingType === 'lease' ? <><FileText className="w-3.5 h-3.5" /> Lease</> :
                          selectedBooking.bookingType === 'market-booth' ? <><ShoppingCart className="w-3.5 h-3.5" /> Market Booth</> :
                          <><PartyPopper className="w-3.5 h-3.5" /> Party / Event</>}
                        </span>
                  </span>
            </div>
            {selectedBooking.assignedSpace && (
                  <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                        <span className="text-[var(--cal-muted)]">Space</span>
                        <span className="text-[var(--cal-text)] font-mono">{selectedBooking.assignedSpace}</span>
                  </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                  <span className="text-[var(--cal-muted)]">Guests</span>
                  <span className="text-[var(--cal-text)]">{selectedBooking.guestCount || '—'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-[var(--cal-line)]">
                  <span className="text-[var(--cal-muted)]">Status</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        selectedBooking.paymentStatus === 'paid'
                              ? 'bg-emerald-500 text-white'
                              : selectedBooking.paymentStatus === 'partial'
                              ? 'bg-amber-500 text-white'
                              : 'bg-red-500 text-white'
                        }`}>
                              {getStatusLabel(selectedBooking.paymentStatus)}
                  </span>
            </div> 
            </div>

            {/* Contact and balance: what the admin needs to reach this client quickly */}
            {(() => {
                  const b = selectedBooking;
                  const balance = Math.max((b.totalPrice || 0) - (b.amountPaid || 0), 0);
                  const reminderSubject = encodeURIComponent(`Balance due for booking ${b.accountNumber}`);
                  const reminderBody = encodeURIComponent(
                        `Hello ${b.clientName},\n\nThis is a reminder that $${formatMoney(balance)} is still due for your booking ${b.accountNumber}.\n\nThank you.`
                  );
                  return (
                        <div className="mt-5 pt-4 border-t border-[var(--cal-line)] space-y-2 text-sm">
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cal-muted)]">Contact</p>
                              <div className="flex justify-between py-1">
                                    <span className="text-[var(--cal-muted)]">Phone</span>
                                    {b.phone
                                          ? <a href={`tel:${b.phone}`} className="text-[var(--cal-link)] hover:underline">{b.phone}</a>
                                          : <span className="text-[var(--cal-muted)]">Not on file</span>}
                              </div>
                              <div className="flex justify-between py-1">
                                    <span className="text-[var(--cal-muted)]">Email</span>
                                    {b.email
                                          ? <a href={`mailto:${b.email}`} className="text-[var(--cal-link)] hover:underline break-all">{b.email}</a>
                                          : <span className="text-[var(--cal-muted)]">Not on file</span>}
                              </div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--cal-muted)] pt-2">Money</p>
                              <div className="flex justify-between py-1">
                                    <span className="text-[var(--cal-muted)]">Total</span>
                                    <span className="text-[var(--cal-text)]">${formatMoney(b.totalPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between py-1">
                                    <span className="text-[var(--cal-muted)]">Paid</span>
                                    <span className="text-[var(--cal-text)]">${formatMoney(b.amountPaid || 0)}</span>
                              </div>
                              <div className="flex justify-between py-1 font-medium">
                                    <span className="text-[var(--cal-muted)]">Balance due</span>
                                    <span className={balance > 0 ? 'text-red-600' : 'text-emerald-600'}>${formatMoney(balance)}</span>
                              </div>
                              <div className="flex flex-wrap gap-2 pt-2">
                                    {b.email && (
                                          <a href={`mailto:${b.email}?subject=${encodeURIComponent(`Your booking ${b.accountNumber}`)}`}
                                                className="px-3 py-1.5 rounded-md border border-[var(--cal-line)] hover:bg-[var(--cal-hover)] transition text-xs">
                                                Email client
                                          </a>
                                    )}
                                    {b.phone && (
                                          <a href={`tel:${b.phone}`}
                                                className="px-3 py-1.5 rounded-md border border-[var(--cal-line)] hover:bg-[var(--cal-hover)] transition text-xs">
                                                Call
                                          </a>
                                    )}
                                    {b.email && balance > 0 && (
                                          <a href={`mailto:${b.email}?subject=${reminderSubject}&body=${reminderBody}`}
                                                className="px-3 py-1.5 rounded-md border border-[var(--cal-line)] hover:bg-[var(--cal-hover)] transition text-xs">
                                                Send balance reminder
                                          </a>
                                    )}
                              </div>
                        </div>
                  );
            })()}

            <div className="mt-6 flex gap-3">
                  <a
                        href={`/admin/edit/${selectedBooking._id}?from=calendar`}
                        className="flex-1 text-center px-4 py-2 rounded-md btn-primary transition text-sm"
                  >
                        Edit Booking
                  </a>
                  <button
                        onClick={closeModal}
                        className="px-4 py-2 rounded-md border border-[var(--cal-line)] hover:bg-[var(--cal-hover)] transition text-sm"
                  >
                        Close
                  </button>
            </div>
      </div>
      </div>
      )}
      </div>
          </div>

          {/* Right side: paid, partial, and unpaid bookings for the month */}
          <aside aria-label="Payments this month" className="cal-root w-full xl:w-80 shrink-0 rounded-lg border border-[var(--cal-line)] p-6 space-y-6">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-[var(--cal-muted)]">Payments this month</p>
              <p className="mt-1 text-sm text-[var(--cal-muted)]">Tap a booking to open it</p>
            </div>
            <div>
              <label htmlFor="pay-filter" className="sr-only">Show payment status</label>
              <select
                id="pay-filter"
                value={payFilter}
                onChange={(e) => setPayFilter(e.target.value as 'paid' | 'partial' | 'unpaid')}
                className="w-full h-9 rounded-md border border-[var(--cal-line)] bg-transparent px-3 text-sm text-[var(--cal-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cal-link)]"
              >
                <option value="paid">Paid</option>
                <option value="partial">Partial</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
            <PaymentGroup
              title={payFilter.charAt(0).toUpperCase() + payFilter.slice(1)}
              tone={payFilter === 'paid' ? 'text-emerald-600' : payFilter === 'partial' ? 'text-amber-600' : 'text-red-600'}
              list={payFilter === 'paid' ? paidList : payFilter === 'partial' ? partialList : unpaidList}
            />
          </aside>
        </div>
      </div>
);
}