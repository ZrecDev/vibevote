export const environmentRules = {
  publicPrefix: 'NEXT_PUBLIC_',
  serverOnly: ['SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_PLACES_API_KEY', 'STRIPE_SECRET_KEY'],
} as const;
