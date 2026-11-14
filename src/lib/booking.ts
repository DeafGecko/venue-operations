// src/lib/booking.ts
// Pure booking rules shared by the public form API and its tests.

export const PRICE_PER_GUEST = 15;
export const MAX_GUESTS = 500;
export const EVENT_TYPES = ['wedding', 'corporate', 'birthday', 'conference', 'other'] as const;

export interface BookingInput {
  clientName: string;
  email: string;
  phone: string;
  eventType: (typeof EVENT_TYPES)[number];
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  notes: string;
}

export type ValidationResult =
  | { ok: true; value: BookingInput }
  | { ok: false; errors: Partial<Record<keyof BookingInput, string>> };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

export function estimateTotal(guestCount: number): number {
  return guestCount * PRICE_PER_GUEST;
}

// Reads only the fields the form sends. Anything else in the request body is ignored,
// so a client cannot set _type, _id, accountNumber, or payment fields.
export function validateBookingInput(
  raw: unknown,
  today: string = new Date().toISOString().slice(0, 10),
): ValidationResult {
  const data = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const str = (key: string) => (typeof data[key] === 'string' ? (data[key] as string).trim() : '');
  const errors: Partial<Record<keyof BookingInput, string>> = {};

  const clientName = str('clientName');
  if (!clientName) errors.clientName = 'Enter your full name.';
  else if (clientName.length > 120) errors.clientName = 'Name must be 120 characters or fewer.';

  const email = str('email');
  if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';

  const phone = str('phone');
  if (phone.replace(/\D/g, '').length < 7) errors.phone = 'Enter a phone number with at least 7 digits.';

  const eventTypeRaw = str('eventType') || 'other';
  const eventType = (EVENT_TYPES as readonly string[]).includes(eventTypeRaw)
    ? (eventTypeRaw as BookingInput['eventType'])
    : null;
  if (!eventType) errors.eventType = 'Choose an event type from the list.';

  const eventDate = str('eventDate');
  if (!DATE_PATTERN.test(eventDate)) errors.eventDate = 'Choose an event date.';
  else if (eventDate < today) errors.eventDate = 'Event date cannot be in the past.';

  const startTime = str('startTime');
  const endTime = str('endTime');
  if (!TIME_PATTERN.test(startTime)) errors.startTime = 'Choose a start time.';
  if (!TIME_PATTERN.test(endTime)) errors.endTime = 'Choose an end time.';
  if (!errors.startTime && !errors.endTime && endTime <= startTime) {
    errors.endTime = 'End time must be after start time.';
  }

  const guestCount = Number(data.guestCount);
  if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > MAX_GUESTS) {
    errors.guestCount = `Enter a whole number of guests from 1 to ${MAX_GUESTS}.`;
  }

  const notes = str('notes');
  if (notes.length > 2000) errors.notes = 'Notes must be 2000 characters or fewer.';

  if (Object.keys(errors).length > 0 || !eventType) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: { clientName, email, phone, eventType, eventDate, startTime, endTime, guestCount, notes },
  };
}

// The only document shape the public form may create. Server-owned fields are set here.
export function buildBookingDocument(input: BookingInput, accountNumber: string, createdAt: string) {
  return {
    _type: 'booking' as const,
    accountNumber,
    clientName: input.clientName,
    email: input.email,
    phone: input.phone,
    eventType: input.eventType,
    eventDate: input.eventDate,
    startTime: input.startTime,
    endTime: input.endTime,
    guestCount: input.guestCount,
    notes: input.notes,
    totalPrice: estimateTotal(input.guestCount),
    amountPaid: 0,
    paymentStatus: 'unpaid' as const,
    createdAt,
  };
}
