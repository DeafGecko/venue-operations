import { describe, expect, it } from 'vitest';
import { buildBookingDocument, estimateTotal, validateBookingInput } from './booking';

const TODAY = '2026-11-14';

const valid = {
  clientName: '  Ada Lovelace ',
  email: 'ada@example.com',
  phone: '(555) 010-2030',
  eventType: 'wedding',
  eventDate: '2026-12-05',
  startTime: '18:00',
  endTime: '23:00',
  guestCount: 120,
  notes: 'Outdoor setup if possible',
};

describe('validateBookingInput', () => {
  it('accepts a complete request and trims the name', () => {
    const result = validateBookingInput(valid, TODAY);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.clientName).toBe('Ada Lovelace');
  });

  it('requires a name and a valid email before the step-one form can be sent', () => {
    const result = validateBookingInput({ ...valid, clientName: '   ', email: 'not-an-email' }, TODAY);
    expect(result).toMatchObject({
      ok: false,
      errors: { clientName: expect.any(String), email: expect.any(String) },
    });
  });

  it('rejects an end time that is not after the start time', () => {
    const result = validateBookingInput({ ...valid, startTime: '18:00', endTime: '18:00' }, TODAY);
    expect(result).toMatchObject({ ok: false, errors: { endTime: 'End time must be after start time.' } });
  });

  it('rejects past dates', () => {
    const result = validateBookingInput({ ...valid, eventDate: '2026-11-13' }, TODAY);
    expect(result).toMatchObject({ ok: false, errors: { eventDate: 'Event date cannot be in the past.' } });
  });

  it.each([0, 501, 2.5, Number.NaN])('rejects guest count %s', (guestCount) => {
    const result = validateBookingInput({ ...valid, guestCount }, TODAY);
    expect(result).toMatchObject({ ok: false, errors: { guestCount: expect.any(String) } });
  });

  it('rejects unknown event types instead of storing them', () => {
    const result = validateBookingInput({ ...valid, eventType: 'rave' }, TODAY);
    expect(result).toMatchObject({ ok: false, errors: { eventType: expect.any(String) } });
  });

  it('requires a phone number with at least 7 digits', () => {
    expect(validateBookingInput({ ...valid, phone: '' }, TODAY)).toMatchObject({
      ok: false,
      errors: { phone: 'Enter a phone number with at least 7 digits.' },
    });
    expect(validateBookingInput({ ...valid, phone: '555-12' }, TODAY).ok).toBe(false);
    expect(validateBookingInput({ ...valid, phone: '(615) 555-1000' }, TODAY).ok).toBe(true);
  });

  it('treats a non-object body as an empty request', () => {
    const result = validateBookingInput('nope', TODAY);
    expect(result.ok).toBe(false);
  });
});

describe('buildBookingDocument', () => {
  it('ignores client-supplied Sanity and payment fields', () => {
    const result = validateBookingInput(
      {
        ...valid,
        _type: 'adminUser',
        _id: 'attacker-chosen',
        accountNumber: '269999',
        role: 'admin',
        passwordHash: 'x',
        paymentStatus: 'paid',
        amountPaid: 99999,
        totalPrice: 1,
      },
      TODAY,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const doc = buildBookingDocument(result.value, '260001', '2026-11-14T12:00:00.000Z');

    expect(doc._type).toBe('booking');
    expect(doc).not.toHaveProperty('_id');
    expect(doc).not.toHaveProperty('role');
    expect(doc).not.toHaveProperty('passwordHash');
    expect(doc).toMatchObject({
      accountNumber: '260001',
      paymentStatus: 'unpaid',
      amountPaid: 0,
      totalPrice: 120 * 15,
    });
  });
});

describe('estimateTotal', () => {
  it('prices at $15 per guest', () => {
    expect(estimateTotal(50)).toBe(750);
  });
});
