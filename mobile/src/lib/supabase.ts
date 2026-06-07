import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Public (publishable) keys — safe to embed in a mobile client.
const SUPABASE_URL = 'https://wjsdmyctvnrwarqxmpfk.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_fFkqAwiV1JlKrYVOirT-kQ_mnN9ajCv';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
