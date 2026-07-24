import { z } from 'zod';
const serverEnvSchema = z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional() });
export function validateServerEnvironment(
  environment: Record<string, string | undefined> = process.env,
) {
  return serverEnvSchema.safeParse(environment);
}
