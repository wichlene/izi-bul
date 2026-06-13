import { NextRequest } from 'next/server';
import { createAdminClient } from './admin';
import { createClient } from './server';

export async function getUserFromRequest(req: NextRequest) {
  // Mobile sends Bearer token — try that first
  const auth = req.headers.get('Authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token) {
    const admin = createAdminClient();
    const { data: { user }, error } = await admin.auth.getUser(token);
    if (!error && user) return user;
  }
  // Web uses cookies
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
