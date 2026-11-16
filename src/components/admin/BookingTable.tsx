// src/components/admin/BookingTable.tsx
import { useState, useMemo } from 'react';
import { formatMoney } from '../../lib/money';
import { useAppDialog } from './useAppDialog';
import { Search, Inbox, Trash2, Edit, X, Plus } from 'lucide-react';
import CustomSelect from './CustomSelect';
import NewBookingModal from './NewBookingModal';

interface Booking {
  _id: string;
  accountNumber: string;
  clientName: string;
  email: string;
  phone?: string;
  eventDate: string;
  eventType?: string;
  bookingType?: string;
  assignedSpace?: string;
  spaceType?: string;
  guestCount: number;
  totalPrice?: number;
  amountPaid?: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid' | string;
  notes?: string;
  createdAt: string;
}

interface Props { initialBookings: Booking[]; openNew?: boolean; }

const statusStyle = (s: string) =>
  s === 'paid'    ? 'bg-emerald-700 text-white' :
  s === 'partial' ? 'bg-amber-700 text-white' :
  s === 'owe'     ? 'bg-blue-600 text-white' :
                    'bg-red-600 text-white';

const statusLabel = (s: string) =>
  s === 'paid' ? 'Paid' : s === 'partial' ? 'Partial' : s === 'owe' ? 'Owes Refund' : 'Unpaid';

const FILTERS = ['all', 'paid', 'partial', 'unpaid', 'owe'] as const;



export default function BookingTable({ initialBookings, openNew = false }: Props) {
  const { confirm, notify, dialog } = useAppDialog();
  const [bookings, setBookings] = useState(initialBookings);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [loading, setLoading]   = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(openNew);

  const deriveStatus = (b: Booking) => {
    const paid = b.amountPaid || 0;
    const total = b.totalPrice || 0;
    if (paid > total && total > 0) return 'owe';
    return b.paymentStatus || 'unpaid';
  };

  const filtered = useMemo(() =>
    bookings.filter((b) => {
      const q = search.toLowerCase();
      const matchSearch = b.clientName.toLowerCase().includes(q) ||
        (b.accountNumber || '').toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q);
      const effectiveStatus = deriveStatus(b);
      const matchFilter = filter === 'all' || effectiveStatus === filter ||
        (filter === 'unpaid' && !b.paymentStatus);
      return matchSearch && matchFilter;
    }), [bookings, search, filter]);

  const handleDelete = async (id: string) => {
    if (!(await confirm('Delete this booking? This cannot be undone.', { danger: true, confirmLabel: 'Delete' }))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' });
      if (res.ok) { setBookings(b => b.filter(x => x._id !== id)); setSelectedIds(s => s.filter(x => x !== id)); }
      else void notify('Failed to delete booking.');
    } catch { void notify('Error deleting booking.'); }
    finally { setLoading(false); }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length || !(await confirm(`Delete ${selectedIds.length} bookings?`, { danger: true, confirmLabel: 'Delete' }))) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/admin/bookings/${id}`, { method: 'DELETE' })));
      setBookings(b => b.filter(x => !selectedIds.includes(x._id)));
      setSelectedIds([]);
    } catch { void notify('Error deleting bookings.'); }
    finally { setLoading(false); }
  };

  const allSelected = selectedIds.length === filtered.length && filtered.length > 0;
  const toggleAll   = () => setSelectedIds(allSelected ? [] : filtered.map(b => b._id));
  const toggleOne   = (id: string) => setSelectedIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const counts = {
    paid:    bookings.filter(b => deriveStatus(b) === 'paid').length,
    partial: bookings.filter(b => deriveStatus(b) === 'partial').length,
    unpaid:  bookings.filter(b => deriveStatus(b) === 'unpaid').length,
    owe:     bookings.filter(b => deriveStatus(b) === 'owe').length,
  };

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      {dialog}
    <>
    <div className="bg-white border border-[#e5e7eb] rounded-xl shadow-sm flex flex-col max-h-[calc(100vh-13rem)]">

      {/* Toolbar */}
      <div className="px-3 py-2 border-b border-[#e5e7eb] flex items-center gap-2 shrink-0">
        <div className="relative flex-1 min-w-36">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b7280]" />
          <input type="search" placeholder="Search name, account, email…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 border border-[#e5e7eb] rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-[#374151]" />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1">
          {FILTERS.map(f => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`h-8 px-4 rounded-md text-xs font-medium transition capitalize ${filter === f ? 'btn-primary' : 'border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]'}`}>
              {f === 'all' ? `All (${bookings.length})` :
               f === 'paid' ? `Paid (${counts.paid})` :
               f === 'partial' ? `Partial (${counts.partial})` :
               f === 'owe' ? `Owes Refund (${counts.owe})` :
               `Unpaid (${counts.unpaid})`}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 ? (
          <button type="button" onClick={handleBulkDelete} disabled={loading}
            className="h-8 flex items-center gap-1 px-4 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50 transition">
            <Trash2 className="w-3.5 h-3.5" /> Delete {selectedIds.length}
          </button>
        ) : (
          <button type="button" onClick={openModal}
            className="h-8 flex items-center gap-1 px-4 rounded-md btn-primary text-xs transition">
            <Plus className="w-3.5 h-3.5" /> New Booking
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <th className="px-4 py-3 w-8">
                <input type="checkbox" title="Select all" checked={allSelected} onChange={toggleAll}
                  className="rounded border-[#d1d5db]" />
              </th>
              {['Account', 'Client', 'Email', 'Date', 'Guests', 'Total', 'Status', 'Actions'].map(h => (
                <th key={h} className={`text-left px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280]
                  ${h === 'Email'  ? 'hidden md:table-cell' : ''}
                  ${h === 'Date'   ? 'hidden lg:table-cell' : ''}
                  ${h === 'Guests' ? 'hidden sm:table-cell' : ''}
                  ${h === 'Total'  ? 'hidden md:table-cell' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-[#6b7280]">
                  <Inbox className="w-10 h-10 mx-auto mb-2 text-[#e5e7eb]" />
                  <p className="text-xs">No bookings found.</p>
                </td>
              </tr>
            ) : filtered.map(b => (
              <tr key={b._id} className="hover:bg-[#fafafa] transition">
                <td className="px-4 py-3">
                  <input type="checkbox" title={`Select ${b.clientName}`} checked={selectedIds.includes(b._id)} onChange={() => toggleOne(b._id)}
                    className="rounded border-[#d1d5db]" />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{b.accountNumber}</td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-[#111827] leading-tight">{b.clientName}</p>
                  <p className="text-xs text-[#6b7280] md:hidden">{b.email}</p>
                </td>
                <td className="px-4 py-3 text-sm text-[#6b7280] hidden md:table-cell">{b.email}</td>
                <td className="px-4 py-3 text-xs text-[#6b7280] hidden lg:table-cell">
                  {new Date(b.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="px-4 py-3 text-xs text-[#6b7280] hidden sm:table-cell">{b.guestCount}</td>
                <td className="px-4 py-3 text-xs font-medium text-[#111827] hidden md:table-cell">${formatMoney(b.totalPrice || 0)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center justify-center min-w-22 px-2 py-0.5 rounded-full text-[0.72rem] font-medium ${statusStyle(deriveStatus(b))}`}>
                    {statusLabel(deriveStatus(b))}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <a href={`/admin/edit/${b._id}`} title={`Edit ${b.clientName}`}
                      className="p-1.5 rounded-md text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] transition">
                      <Edit className="w-3.5 h-3.5" />
                    </a>
                    <button type="button" title={`Delete ${b.clientName}`} onClick={() => handleDelete(b._id)} disabled={loading}
                      className="p-1.5 rounded-md text-[#6b7280] hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#e5e7eb] flex items-center justify-between gap-3 text-xs text-[#6b7280] shrink-0">
        <span>Showing <strong className="text-[#374151]">{filtered.length}</strong> of <strong className="text-[#374151]">{bookings.length}</strong></span>
        <div className="flex items-center gap-3">
          {([['bg-emerald-500', 'Paid', counts.paid], ['bg-amber-500', 'Partial', counts.partial], ['bg-red-500', 'Unpaid', counts.unpaid]] as const).map(([color, label, count]) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${color}`} />
              {label}: <strong className="text-[#374151]">{count}</strong>
            </span>
          ))}
        </div>
      </div>
    </div>

    <NewBookingModal open={showModal} onClose={closeModal} />
    </>
    </>
  );
}
