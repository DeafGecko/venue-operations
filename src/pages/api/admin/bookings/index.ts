// GET /api/admin/bookings – list all bookings for dropdowns
// POST /api/admin/bookings – create a booking from the admin New Booking form (admin and manager only, see middleware)
import type { APIRoute } from 'astro';
import { sanityClient } from '../../../../lib/sanity';
import { generateAccountNumber } from '../../../../lib/accountNumber';
import { buildBookingDocument, validateBookingInput, EVENT_TYPES } from '../../../../lib/booking';

export const GET: APIRoute = async () => {
  const bookings = await sanityClient.fetch(
    `*[_type == "booking"] | order(eventDate desc) { _id, clientName, accountNumber, eventDate, eventType, guestCount }`
  );
  return new Response(JSON.stringify(bookings), {
    headers: { 'Content-Type': 'application/json' },
  });
};

const jsonHeaders = { 'Content-Type': 'application/json' };

// "HH:MM" plus hours, capped at 23:59 so the window never wraps past midnight.
function addHours(time: string, hours: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.min(h * 60 + m + hours * 60, 23 * 60 + 59);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, any>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'Send the booking as JSON.' }), { status: 400, headers: jsonHeaders });
  }

  // The form sends a date-and-time value; the booking stores the date and a start and end time.
  const [datePart = '', timePart = ''] = String(body.eventDate ?? '').split('T');
  const startTime = String(body.startTime || timePart.slice(0, 5));
  const endTime = String(body.endTime || (startTime ? addHours(startTime, 4) : ''));
  const eventType = (EVENT_TYPES as readonly string[]).includes(body.eventType) ? body.eventType : 'other';

  const checked = validateBookingInput({ ...body, eventDate: datePart, startTime, endTime, eventType });
  if (!checked.ok) {
    const first = Object.values(checked.errors)[0];
    return new Response(JSON.stringify({ success: false, error: first || 'Please check the highlighted fields.', errors: checked.errors }), { status: 400, headers: jsonHeaders });
  }

  try {
    const accountNumber = await generateAccountNumber();
    const doc = buildBookingDocument(checked.value, accountNumber, new Date().toISOString());
    const created = await sanityClient.create({
      ...doc,
      // Admin-only fields the public form does not send
      totalPrice: Number(body.totalPrice) || doc.totalPrice,
      amountPaid: Number(body.amountPaid) || 0,
      paymentStatus: body.paymentStatus || 'unpaid',
      bookingType: body.bookingType || 'party',
      assignedSpace: body.assignedSpace || '',
      spaceType: body.spaceType || '',
    });
    return new Response(JSON.stringify({ success: true, id: created._id }), { status: 200, headers: jsonHeaders });
  } catch (error) {
    console.error('admin create booking failed:', error);
    return new Response(JSON.stringify({ success: false, error: 'We could not save this booking. Please try again.' }), { status: 500, headers: jsonHeaders });
  }
};
