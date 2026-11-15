import { createClient } from '@sanity/client';

export const sanityClient = createClient({
  // The project ID is public, so it is safe as a fallback when the build does not provide it.
  projectId: import.meta.env.SANITY_PROJECT_ID || 'mzqx3hwz',
  dataset: import.meta.env.SANITY_DATASET || 'production',
  apiVersion: '2024-12-30',
  useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN,
});