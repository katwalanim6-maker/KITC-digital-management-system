(() => {
  'use strict';

  const URL = 'https://plzktdfumurucbkwdhbu.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_FSfGEy-i8R8LdQ-5OJwYtQ_MI6AUvVN';

  const init = () => {
    if (!window.supabase?.createClient) {
      console.warn('[KITC] Supabase client library is unavailable. USB mode remains active.');
      window.kitcSupabaseStatus = { state: 'unavailable' };
      return;
    }

    try {
      const client = window.supabase.createClient(URL, PUBLISHABLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });
      window.kitcSupabase = client;
      window.kitcSupabaseStatus = { state: 'ready', url: URL };

      window.kitcSupabaseHealth = async () => {
        try {
          const { error } = await client.from('members').select('id').limit(1);
          const status = error ? { state: 'error', message: error.message } : { state: 'connected' };
          window.kitcSupabaseStatus = status;
          return status;
        } catch (error) {
          const status = { state: 'error', message: error.message || 'Supabase request failed' };
          window.kitcSupabaseStatus = status;
          return status;
        }
      };

      window.dispatchEvent(new CustomEvent('kitc:supabase-ready'));
    } catch (error) {
      console.error('[KITC] Supabase initialization failed', error);
      window.kitcSupabaseStatus = { state: 'error', message: error.message };
    }
  };

  if (window.supabase) init();
  else window.addEventListener('load', init, { once: true });
})();
