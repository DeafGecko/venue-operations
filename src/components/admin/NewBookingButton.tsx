// src/components/admin/NewBookingButton.tsx
// "+ New booking" on the dashboard. Opens the same popup as the Bookings page, without leaving the dashboard.
import { useState } from 'react';
import NewBookingModal from './NewBookingModal';

export default function NewBookingButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium"
      >
        <span aria-hidden="true">+</span> New booking
      </button>
      <NewBookingModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
