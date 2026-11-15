import { createClient } from '@sanity/client';
import { runtimeEnv } from './runtime-env';

export const sanityClient = createClient({
  // The project ID is public, so it is safe as a fallback when the build does not provide it.
  projectId: runtimeEnv('SANITY_PROJECT_ID') || '0z6dzjmj',
  dataset: runtimeEnv('SANITY_DATASET') || 'production',
  apiVersion: '2024-12-30',
  useCdn: false,
  token: runtimeEnv('SANITY_API_TOKEN'),
});