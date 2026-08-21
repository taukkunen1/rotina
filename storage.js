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

  window.RotinaStorage = Object.freeze({
    CONFIG_KEY,
    STATE_KEY,
    APPS_SCRIPT_URL,
    DATA_ENDPOINT,
    readJSON,
    writeJSON,
    remove
  });

  // The legacy index is still being split into modules. Load the transition
  // UI layer explicitly so phase-1 cleanup is actually applied on the main page.
  if(location.pathname.endsWith('/index.html') || location.pathname.endsWith('/rotina/') || location.pathname.endsWith('/rotina')){
    if(!document.querySelector('script[data-rotina-ui]')){
      const script=document.createElement('script');
      script.src='app-ui.js';
      script.defer=true;
      script.dataset.rotinaUi='1';
      document.head.appendChild(script);
    }
  }
})();
