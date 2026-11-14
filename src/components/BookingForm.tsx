import { useEffect, useRef, useState } from 'react';
import { EVENT_TYPES, estimateTotal, MAX_GUESTS } from '../lib/booking';

interface FormData {
  clientName: string;
  email: string;
  phone: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number | '';
  eventType: string;
  notes: string;
}

type FieldErrors = Partial<Record<keyof FormData, string>>;

const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  wedding: 'Wedding',
  corporate: 'Corporate',
  birthday: 'Birthday',
  conference: 'Conference',
  other: 'Other',
};

const inputClass =
  'mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent';

export default function BookingForm() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    email: '',
    phone: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    guestCount: 50,
    eventType: 'other',
    notes: '',
  });
  const [timeError, setTimeError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // Move focus to the new step's heading so keyboard and screen reader users land on it.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const guestTotal = formData.guestCount === '' ? 0 : estimateTotal(Number(formData.guestCount));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updated = { ...formData, [name]: name === 'guestCount' ? (value === '' ? '' : Number(value)) : value };
    setFormData(updated);
    setFormError('');
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));

    if (name === 'endTime' || name === 'startTime') {
      const start = name === 'startTime' ? value : formData.startTime;
      const end = name === 'endTime' ? value : formData.endTime;
      if (start && end && end <= start) {
        setTimeError('End time must be after start time.');
      } else {
        setTimeError('');
      }
    }
  };

  const goToDetails = () => {
    // Native checks on the visible step (name, email) before moving on.
    if (formRef.current && !formRef.current.reportValidity()) return;
    setStep(2);
  };

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (timeError) return;
    setLoading(true);
    setFormError('');
    setFieldErrors({});

    try {
      const response = await fetch('/api/create-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json().catch(() => ({ success: false }));
      if (!response.ok || !result.success) {
        if (result.errors) {
          setFieldErrors(result.errors);
          setStep(result.errors.clientName || result.errors.email || result.errors.phone ? 1 : 2);
        }
        setFormError(result.error || 'We could not save your request. Please try again.');
        return;
      }

      window.location.href = `/client/dashboard?id=${result.id}`;
    } catch {
      setFormError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const errorText = (name: keyof FormData) =>
    fieldErrors[name] ? (
      <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
        {fieldErrors[name]}
      </p>
    ) : null;

  const describedBy = (name: keyof FormData) => (fieldErrors[name] ? `${name}-error` : undefined);

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      aria-labelledby="booking-title"
      className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg space-y-6"
    >
      <div className="text-center">
        <h2 id="booking-title" ref={headingRef} tabIndex={-1} className="text-2xl font-bold focus:outline-none">
          Request a Booking
        </h2>
        <p className="text-sm text-gray-500 mt-1">Step {step} of 2</p>
      </div>

      {formError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700">Full name *</label>
            <input
              id="clientName"
              type="text"
              name="clientName"
              autoComplete="name"
              value={formData.clientName}
              onChange={handleChange}
              required
              aria-required="true"
              aria-describedby={describedBy('clientName')}
              className={inputClass}
            />
            {errorText('clientName')}
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              aria-required="true"
              aria-describedby={describedBy('email')}
              className={inputClass}
            />
            {errorText('email')}
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone *</label>
            <input
              id="phone"
              type="tel"
              name="phone"
              autoComplete="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              aria-required="true"
              aria-describedby={describedBy('phone')}
              className={inputClass}
            />
            {errorText('phone')}
          </div>
          <div>
            <label htmlFor="eventType" className="block text-sm font-medium text-gray-700">Event type</label>
            <select
              id="eventType"
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className={inputClass}
            >
              {EVENT_TYPES.map((type) => (
                <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={goToDetails}
            className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Next: event details →
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700">Event date *</label>
            <input
              id="eventDate"
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              required
              aria-required="true"
              aria-describedby={describedBy('eventDate')}
              className={inputClass}
            />
            {errorText('eventDate')}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">Start time *</label>
              <input
                id="startTime"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                required
                aria-required="true"
                aria-describedby={describedBy('startTime')}
                className={inputClass}
              />
              {errorText('startTime')}
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">End time *</label>
              <input
                id="endTime"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                required
                aria-required="true"
                aria-invalid={!!timeError}
                aria-describedby={timeError ? 'time-error' : describedBy('endTime')}
                className={inputClass}
              />
              {errorText('endTime')}
            </div>
          </div>
          {timeError && (
            <p id="time-error" className="text-red-600 text-sm">{timeError}</p>
          )}
          <div>
            <label htmlFor="guestCount" className="block text-sm font-medium text-gray-700">Number of guests *</label>
            <input
              id="guestCount"
              type="number"
              name="guestCount"
              inputMode="numeric"
              value={formData.guestCount}
              onChange={handleChange}
              min="1"
              max={MAX_GUESTS}
              required
              aria-required="true"
              aria-describedby={describedBy('guestCount') ?? 'guest-estimate'}
              className={inputClass}
            />
            {errorText('guestCount')}
            <p id="guest-estimate" className="text-sm text-gray-500 mt-1">Estimated total: ${guestTotal}</p>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Additional notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              aria-describedby={describedBy('notes')}
              className={inputClass}
            />
            {errorText('notes')}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="sm:w-1/2 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={loading || !!timeError}
              className="sm:w-1/2 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {loading ? 'Submitting…' : 'Submit booking'}
            </button>
          </div>
          <p role="status" aria-live="polite" className="sr-only">
            {loading ? 'Submitting your booking request.' : ''}
          </p>
        </div>
      )}
    </form>
  );
}
