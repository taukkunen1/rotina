(() => {
  'use strict';
  const SUPABASE_URL = 'https://aictkwkcyqjsakugiwra.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_BJUaEs1EMKYDfCkg_6wnYA_7sWmgXWT';
  const ROUTINE_ID = '077cb586-35c1-49a8-b864-8d2d88f1010f';
  const memoryStorage = {
    _data:Object.create(null),
    getItem(k){return this._data[k]??null;},
    setItem(k,v){this._data[k]=v;},
    removeItem(k){delete this._data[k];}
  };

  function client(){
    if(!window.supabase?.createClient) throw new Error('Cliente Supabase não carregado');
    if(!window.PacusSupabase) {
      window.PacusSupabase=window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY,
        {auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:true,storage:memoryStorage}}
      );
    }
    return window.PacusSupabase;
  }

  async function currentUser(){
    const {data,error}=await client().auth.getUser();
    return error?null:data.user||null;
  }

  async function hasAdultAccess(){
    const user=await currentUser();
    if(!user)return false;
    const {data,error}=await client().from('app_users').select('role').eq('id',user.id).eq('role','adult').maybeSingle();
    if(error||!data)return false;
    const {data:member,error:memberError}=await client().from('routine_members').select('routine_id').eq('user_id',user.id).eq('routine_id',ROUTINE_ID).maybeSingle();
    return !memberError&&!!member;
  }

  function safeNext(next){
    try{
      const url=new URL(next||'adultos.html',location.href);
      if(url.origin!==location.origin) return new URL('adultos.html',location.href).href;
      if(url.protocol!=='http:' && url.protocol!=='https:') return new URL('adultos.html',location.href).href;
      return url.href;
    }catch(_){
      return new URL('adultos.html',location.href).href;
    }
  }

  function redirectToLogin(next=location.href){
    const target=new URL('login.html',location.href);
    target.searchParams.set('next',safeNext(next));
    location.replace(target.href);
  }

  async function requireAdult({redirect=true}={}){
    const user=await currentUser();
    if(!user){if(redirect)redirectToLogin(location.href);return null;}
    if(!(await hasAdultAccess())){
      if(redirect){
        alert('Esta conta não possui acesso à Área dos Adultos.');
        await client().auth.signOut();
        redirectToLogin(location.href);
      }
      return null;
    }
    return user;
  }

  async function signIn(email,password){
    const {data,error}=await client().auth.signInWithPassword({email,password});
    if(error)throw error;
    if(!(await hasAdultAccess())){
      await client().auth.signOut();
      throw new Error('Esta conta não possui acesso adulto à rotina.');
    }
    return data.user;
  }

  async function signUp(email,password,name){
    const redirectTo=new URL('login.html',location.href).href;
    const {data,error}=await client().auth.signUp({
      email,
      password,
      options:{data:{full_name:name||'Adulto'},emailRedirectTo:redirectTo}
    });
    if(error)throw error;
    return {user:data.user,confirmed:!!data.session};
  }

  async function signOut(){
    try{await client().auth.signOut();}finally{location.replace('index.html');}
  }

  window.PacusAuth=Object.freeze({
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    ROUTINE_ID,
    client,
    currentUser,
    hasAdultAccess,
    requireAdult,
    signIn,
    signUp,
    signOut,
    redirectToLogin,
    safeNext
  });
})();
