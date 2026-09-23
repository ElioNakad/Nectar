const SUPABASE_URL = 'https://mzggoyuhieszmnyjtmym.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_nhIHYSKZDifyHbKqtMf_QQ_0V5Di8tK';

let client;

export function getSupabase() {
  if (!window.supabase?.createClient) {
    return Promise.reject(new Error('The Supabase browser library did not load.'));
  }

  if (!client) {
    client = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  return Promise.resolve(client);
}
