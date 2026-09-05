(() => {
  'use strict';

  const URL = 'https://viwhijpofsgwcsbnkzrv.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_ruGFxvzoWdV9He1Y2zLrGQ_0Apyn02y';

  const init = () => {
    if (!window.supabase?.createClient) {
      console.warn('[KITC] Supabase client library is unavailable.');
      window.kitcSupabaseStatus = { state: 'unavailable' };
      return;
    }
    if (PUBLISHABLE_KEY.startsWith('REPLACE_')) {
      window.kitcSupabaseStatus = { state: 'not_configured' };
      return;
    }
    try {
      const client = window.supabase.createClient(URL, PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      window.kitcSupabase = client;
      window.kitcSupabaseStatus = { state: 'ready', url: URL };
      window.kitcSupabaseHealth = async () => {
        const { error } = await client.from('members').select('id').limit(1);
        const status = error ? { state: 'error', message: error.message } : { state: 'connected' };
        window.kitcSupabaseStatus = status;
        return status;
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
