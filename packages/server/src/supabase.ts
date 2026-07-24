import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const serverEnvironmentSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export function validateServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
) {
  return serverEnvironmentSchema.safeParse(environment);
}

export function createServiceRoleClient(
  environment: Record<string, string | undefined> = process.env,
) {
  const parsed = validateServerEnvironment(environment);
  if (!parsed.success) throw new Error('Server database configuration is unavailable');
  const { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key } = parsed.data;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
