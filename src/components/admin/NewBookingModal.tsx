// src/components/admin/NewBookingModal.tsx
// The New Booking popup. Used by the Bookings page and by the dashboard's "+ New booking" button.
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { formatMoney } from '../../lib/money';

const EMPTY_FORM = {
  clientName: '', email: '', phone: '',
  eventDate: '', eventType: 'other', bookingType: 'party',
  assignedSpace: '', spaceType: '', guestCount: 1,
  totalPrice: 0, amountPaid: 0, paymentStatus: 'unpaid', notes: '',
};

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="block text-[0.72rem] font-semibold uppercase tracking-widest text-[#6b7280] mb-0.5">{children}</span>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} className={`w-full border border-[#e5e7eb] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151] ${props.className || ''}`} />
);

export default function NewBookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Start with a clean form every time the popup opens
  useEffect(() => {
    if (open) { setFormData({ ...EMPTY_FORM }); setFormError(null); setSaving(false); }
  }, [open]);

  // Escape closes the popup
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(p => ({ ...p, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError(null);
    try {
      const res = await fetch('/api/admin/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create booking');
      // Reload so the new booking appears with its generated account number
      window.location.reload();
    } catch (err: any) {
      setFormError(err.message);
      setSaving(false);
    }
  };

  const balance = (formData.totalPrice || 0) - (formData.amountPaid || 0);

  return (
    <>
  {/* ── New Booking Modal ── */}
  {open && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl" onClick={e => e.stopPropagation()}>

        {/* Modal header */}
        <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-[#e5e7eb]">
          <h3 className="text-sm font-semibold text-[#111827]">New Booking</h3>
          <button type="button" onClick={onClose} title="Close" className="p-1 rounded-md text-[#6b7280] hover:text-[#374151] hover:bg-[#f3f4f6] transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="px-10 pb-10 pt-6 space-y-6">
          {formError && (
            <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">{formError}</div>
          )}

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Client Name *</Label>
              <Input name="clientName" value={formData.clientName} onChange={handleChange} required placeholder="Jane Smith" />
            </div>
            <div>
              <Label>Email *</Label>
              <Input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="jane@email.com" />
            </div>
          </div>

          <div>
            <Label>Phone *</Label>
            <Input type="tel" name="phone" required aria-required="true" value={formData.phone} onChange={handleChange} placeholder="(555) 000-0000" />
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Event Date & Time *</Label>
              <Input type="datetime-local" name="eventDate" value={formData.eventDate} onChange={handleChange} required />
            </div>
            <div>
              <Label>Guests *</Label>
              <Input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} min="1" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label>Booking Type</Label>
              <CustomSelect value={formData.bookingType} onChange={v => setFormData(p => ({ ...p, bookingType: v }))}
                options={[
                  { value: 'party', label: 'Party / Event' },
                  { value: 'lease', label: 'Lease / Rental' },
                  { value: 'market-booth', label: 'Farm Market Booth' },
                ]} />
            </div>
            <div>
              <Label>Event Type</Label>
              <CustomSelect value={formData.eventType} onChange={v => setFormData(p => ({ ...p, eventType: v }))}
                options={[
                  { value: 'wedding', label: 'Wedding' },
                  { value: 'corporate', label: 'Corporate' },
                  { value: 'birthday', label: 'Birthday' },
                  { value: 'party', label: 'Party' },
                  { value: 'graduation', label: 'Graduation' },
                  { value: 'shower', label: 'Baby/Bridal Shower' },
                  { value: 'concert', label: 'Concert / Show' },
                  { value: 'farm-market', label: 'Farm Market' },
                  { value: 'tenant', label: 'Tenant' },
                  { value: 'venue-rental', label: 'Venue Rental' },
                  { value: 'other', label: 'Other' },
                ]} />
            </div>
          </div>

          <div>
            <Label>Assigned Space</Label>
            <Input name="assignedSpace" value={formData.assignedSpace} onChange={handleChange} placeholder="e.g. A1, B3" />
          </div>

          {/* Financial */}
          <div className="grid grid-cols-3 gap-5">
            <div>
              <Label>Total Price ($)</Label>
              <Input type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <Label>Amount Paid ($)</Label>
              <Input type="number" name="amountPaid" value={formData.amountPaid} onChange={handleChange} min="0" step="0.01" />
            </div>
            <div>
              <Label>Balance</Label>
              <p className={`pt-1.5 text-sm font-semibold ${balance > 0 ? 'text-red-600' : 'text-emerald-700'}`}>${formatMoney(balance)}</p>
            </div>
          </div>

          <div>
            <Label>Payment Status</Label>
            <CustomSelect centered value={formData.paymentStatus} onChange={v => setFormData(p => ({ ...p, paymentStatus: v }))}
              options={[
                { value: 'unpaid', label: 'Unpaid' },
                { value: 'partial', label: 'Partial' },
                { value: 'paid', label: 'Paid' },
              ]} />
          </div>

          <div>
            <Label>Notes</Label>
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
              placeholder="Internal notes…"
              className="w-full border border-[#e5e7eb] rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#374151] resize-none" />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1 border-t border-[#e5e7eb]">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 rounded-md btn-primary text-sm disabled:opacity-50 transition">
              {saving ? 'Creating…' : 'Create Booking'}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-md border border-[#e5e7eb] text-sm text-[#6b7280] hover:bg-[#f3f4f6] transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
    </>
  );
}
