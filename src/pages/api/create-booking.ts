import type { APIRoute } from 'astro';
import { sanityClient } from '../../lib/sanity';
import { generateAccountNumber } from '../../lib/accountNumber';
import { buildBookingDocument, validateBookingInput } from '../../lib/booking';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: 'Send the booking as JSON.' }),
      { status: 400, headers: jsonHeaders },
    );
  }

  const result = validateBookingInput(body);
  if (!result.ok) {
    return new Response(
      JSON.stringify({ success: false, error: 'Please check the highlighted fields.', errors: result.errors }),
      { status: 400, headers: jsonHeaders },
    );
  }

  try {
    const accountNumber = await generateAccountNumber();
    const doc = buildBookingDocument(result.value, accountNumber, new Date().toISOString());
    const booking = await sanityClient.create(doc);

    return new Response(
      JSON.stringify({ success: true, id: booking._id }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    console.error('create-booking failed:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'We could not save your request. Please try again.' }),
      { status: 500, headers: jsonHeaders },
    );
  }
};
