export const environmentRules = {
  publicPrefix: 'NEXT_PUBLIC_',
  serverOnly: [
    'SUPABASE_SERVICE_ROLE_KEY',
    'VIBEVOTE_RATE_LIMIT_KEY_SECRET',
    'GOOGLE_PLACES_API_KEY',
    'STRIPE_SECRET_KEY',
  ],
} as const;
