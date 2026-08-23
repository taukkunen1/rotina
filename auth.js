(() => {
  'use strict';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';

  // Auth intentionally uses memory only. PACUS application data must never be persisted in Web Storage.
  const memoryStorage = {
    _data: Object.create(null),
    getItem(key) { return this._data[key] ?? null; },
    setItem(key, value) { this._data[key] = value; },
    removeItem(key) { delete this._data[key]; },
  };

  function client() {
    if (!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    if (!window.PacusSupabase) {
      window.PacusSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: memoryStorage,
        }
      });
    }
    return window.PacusSupabase;
  }

  async function currentUser() {
    const { data, error } = await client().auth.getUser();
    if (error) return null;
    return data.user || null;
  }

  async function claimAdultAccess() {
    const { data, error } = await client().rpc('claim_first_adult_access', { p_routine_id: ROUTINE_ID });
    if (error) throw error;
    return data === true;
  }

  function redirectToLogin(next = location.href) {
    const target = new URL('login.html', location.href);
    target.searchParams.set('next', next);
    location.replace(target.href);
  }

  async function requireAdult({ redirect = true } = {}) {
    const user = await currentUser();
    if (!user) {
      if (redirect) redirectToLogin(location.href);
      return null;
    }
    let access = false;
    try { access = await claimAdultAccess(); } catch (_) { access = false; }
    if (!access) {
      if (redirect) {
        alert('Esta conta não possui acesso à Área dos Adultos.');
        await client().auth.signOut();
        redirectToLogin(location.href);
      }
      return null;
    }
    return user;
  }

  async function signIn(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email, password });
    if (error) throw error;
    const access = await claimAdultAccess();
    if (!access) {
      await client().auth.signOut();
      throw new Error('Esta conta não possui acesso adulto à rotina.');
    }
    return data.user;
  }

  async function signUp(email, password, name) {
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: { data: { full_name: name || 'Adulto' } }
    });
    if (error) throw error;
    if (data.session) {
      const access = await claimAdultAccess();
      if (!access) throw new Error('Não foi possível criar o acesso adulto.');
      return { user: data.user, confirmed: true };
    }
    return { user: data.user, confirmed: false };
  }

  async function signOut() {
    try { await client().auth.signOut(); } finally { location.replace('index.html'); }
  }

  window.PacusAuth = Object.freeze({ SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ROUTINE_ID, client, currentUser, requireAdult, signIn, signUp, signOut, redirectToLogin });
})();
