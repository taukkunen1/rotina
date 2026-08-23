(() => {
  'use strict';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';
  const LOGIN_FILE = 'login.html';

  function client() {
    if (!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    if (!window.PacusSupabase) {
      window.PacusSupabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
    }
    return window.PacusSupabase;
  }

  async function session() {
    const { data, error } = await client().auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function currentUser() {
    return (await session())?.user || null;
  }

  async function hasAdultAccess() {
    const user = await currentUser();
    if (!user) return false;
    const { data: adult, error: adultError } = await client().from('app_users').select('role').eq('id', user.id).eq('role', 'adult').maybeSingle();
    if (adultError) throw adultError;
    if (!adult) return false;
    const { data: member, error: memberError } = await client().from('routine_members').select('routine_id').eq('user_id', user.id).eq('routine_id', ROUTINE_ID).maybeSingle();
    if (memberError) throw memberError;
    return !!member;
  }

  function safeNext(next) {
    const fallback = new URL('adultos.html', location.href).href;
    if (!next) return fallback;
    try {
      const target = new URL(next, location.href);
      if (target.origin !== location.origin) return fallback;
      if (target.pathname.endsWith('/' + LOGIN_FILE) || target.pathname.endsWith(LOGIN_FILE)) return fallback;
      return target.href;
    } catch (_) { return fallback; }
  }

  function redirectToLogin(next) {
    const target = new URL(LOGIN_FILE, location.href);
    target.searchParams.set('next', safeNext(next));
    location.replace(target.href);
  }

  async function requireAdult({ redirect = true } = {}) {
    try {
      const user = await currentUser();
      if (!user) { if (redirect) redirectToLogin(location.href); return null; }
      if (!(await hasAdultAccess())) {
        if (redirect) {
          alert('Esta conta não possui acesso à Área dos Adultos.');
          await client().auth.signOut();
          redirectToLogin(location.href);
        }
        return null;
      }
      return user;
    } catch (error) {
      console.error('[PACUS Auth] erro ao validar acesso adulto:', error);
      if (redirect) {
        alert('Não foi possível validar o acesso agora. Tente novamente.');
        redirectToLogin(location.href);
      }
      return null;
    }
  }

  async function signIn(email, password) {
    const { data, error } = await client().auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    if (!data?.session || !data?.user) throw new Error('Login realizado, mas a sessão não foi criada.');
    if (!(await hasAdultAccess())) {
      await client().auth.signOut();
      throw new Error('Esta conta não possui acesso adulto à rotina.');
    }
    return data.user;
  }

  async function signUp(email, password, name) {
    const emailRedirectTo = new URL(LOGIN_FILE, location.href).href;
    const { data, error } = await client().auth.signUp({
      email: email.trim(), password,
      options: { data: { full_name: name || 'Adulto' }, emailRedirectTo }
    });
    if (error) throw error;
    if (data.session && !(await hasAdultAccess())) {
      await client().auth.signOut();
      throw new Error('Não foi possível criar o acesso adulto.');
    }
    return { user: data.user, confirmed: !!data.session };
  }

  async function signOut() { try { await client().auth.signOut(); } finally { location.replace('index.html'); } }

  window.PacusAuth = Object.freeze({ SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, ROUTINE_ID, client, session, currentUser, hasAdultAccess, requireAdult, signIn, signUp, signOut, redirectToLogin, safeNext });
})();
