/*
 * Domínio da aplicação.
 *
 * A UI continua usando CONFIG/state durante a migração, mas os dados já têm
 * fronteiras explícitas. Quando o backend SQL entrar, cada domínio poderá
 * virar tabelas sem alterar os componentes visuais.
 */
(() => {
  'use strict';

  const DOMAINS = Object.freeze({
    ROUTINE: 'routineConfig',
    DAILY: 'dailyState',
    POINTS: 'pointEvents',
    HISTORY: 'history'
  });

  function clone(value) {
    try { return JSON.parse(JSON.stringify(value)); } catch (_) { return value; }
  }

  function create(config = {}, state = {}) {
    const daily = clone(state) || {};
    const history = daily.history || {};
    const pointEvents = Array.isArray(daily.pointEvents) ? daily.pointEvents : [];
    delete daily.history;
    delete daily.pointEvents;
    return {
      schemaVersion: 2,
      routineConfig: clone(config) || {},
      dailyState: daily,
      pointEvents: clone(pointEvents),
      history: clone(history)
    };
  }

  function toLegacy(model) {
    const state = clone(model.dailyState || {});
    state.history = clone(model.history || {});
    state.pointEvents = clone(model.pointEvents || []);
    return { config: clone(model.routineConfig || {}), state };
  }

  function validate(model) {
    if (!model || Number(model.schemaVersion) < 2) return false;
    if (!model.routineConfig || typeof model.routineConfig !== 'object') return false;
    if (!model.dailyState || typeof model.dailyState !== 'object') return false;
    if (!Array.isArray(model.pointEvents)) return false;
    if (!model.history || typeof model.history !== 'object') return false;
    return true;
  }

  window.RotinaDataModel = Object.freeze({ DOMAINS, create, toLegacy, validate });
})();
