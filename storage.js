(() => {
  'use strict';

  const CONFIG_KEY = 'hector_rotina_config_v3';
  const STATE_KEY = 'hector_rotina_state_v3';
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz0RETrtzuA3pwdXu3qB2PN611q3PRY0Tw8CUyF7AyashsCKTm3yZ93s7iGtDe8m35p/exec';
  const DATA_ENDPOINT = APPS_SCRIPT_URL + '?data=1';

  function readJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn('Storage read failed:', key, error);
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('Storage write failed:', key, error);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Storage remove failed:', key, error);
      return false;
    }
  }

  function loadCompactTimer(){
    if(document.querySelector('link[data-compact-timer]')||document.getElementById('compactTimerScript')) return;
    const css=document.createElement('link');
    css.rel='stylesheet';css.href='compact-timer.css?v=20260821-1';css.dataset.compactTimer='1';document.head.appendChild(css);
    const script=document.createElement('script');
    script.src='compact-timer.js?v=20260821-1';script.id='compactTimerScript';script.defer=true;document.head.appendChild(script);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',loadCompactTimer,{once:true}); else loadCompactTimer();
  window.RotinaStorage = Object.freeze({CONFIG_KEY,STATE_KEY,APPS_SCRIPT_URL,DATA_ENDPOINT,readJSON,writeJSON,remove});
})();
