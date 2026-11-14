// src/pages/api/admin/settings.ts
import type { APIRoute } from 'astro';
import { sanityClient } from '../../../lib/sanity';

const SETTINGS_ID = 'siteSettings';

export const GET: APIRoute = async () => {
  try {
    let settings = await sanityClient.fetch(
      `*[_type == "settings" && _id == $id][0]{
        ...,
        "logo": { "asset": logo.asset->{ _id, url } }
      }`,
      { id: SETTINGS_ID }
    );

    if (!settings) {
      settings = await sanityClient.create({
        _id: SETTINGS_ID,
        _type: 'settings',
        venueName: 'Venue Operations',
        primaryColor: '#333333',
        secondaryColor: '#555555',
        accentColor: '#999999',
        backgroundColor: '#F5F5F5',
        textColor: '#111111',
        sidebarColor: '#222222',
        contactEmail: '',
        contactPhone: '',
        address: '',
        bookingFee: 0,
        taxRate: 0,
        depositPercentage: 25,
        fontFamily: 'Inter, system-ui, sans-serif',
        themePreference: 'light',
      });
    }

    return new Response(JSON.stringify(settings), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Settings API Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const { logo, ...rest } = await request.json();
    const patch = sanityClient.patch(SETTINGS_ID).set(rest);

    // Logo is stored as a real Sanity image reference. null = removed; a missing asset id = leave as is.
    if (logo === null) {
      patch.unset(['logo']);
    } else if (logo?.asset?._id) {
      patch.set({ logo: { _type: 'image', asset: { _type: 'reference', _ref: logo.asset._id } } });
    }

    const updated = await patch.commit();
    return new Response(JSON.stringify(updated), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('❌ Settings PUT Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to update settings' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
