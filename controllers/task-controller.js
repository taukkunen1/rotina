(function(root, factory){
  const api = factory();
  if(typeof module === 'object' && module.exports) module.exports = api;
  if(root) root.PacusTaskController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(){
  'use strict';

  function createTaskController(deps){
    const options = deps || {};
    const domain = options.domain;
    if(!domain || typeof domain.transition !== 'function') throw new Error('task_domain_required');
    const getState = options.getState || (() => ({}));
    const getTask = options.getTask || (() => null);
    const getLightDay = options.getLightDay || (() => false);
    const persist = options.persist || (async () => undefined);
    const render = options.render || (() => undefined);

    async function setStatus(taskId, clickedStatus){
      const state = getState();
      const task = getTask(taskId);
      if(!task) throw new Error('task_not_found');
      if(!state.checkedToday) state.checkedToday = {};
      const currentStatus = state.checkedToday[taskId] || null;
      const result = domain.transition(currentStatus, clickedStatus, task, { lightDay:getLightDay() });
      if(result.nextStatus) state.checkedToday[taskId] = result.nextStatus;
      else delete state.checkedToday[taskId];
      state.points = Math.max(0, (Number(state.points) || 0) + result.delta);

      const persisted = await persist({ taskId, status:result.nextStatus, action:result.action, delta:result.delta, state });
      // Quando a persistência devolve um snapshot server-authoritative, ele
      // substitui o resultado otimista do cliente. A transição local continua
      // apenas para resposta imediata da interface.
      if(persisted && persisted.state && typeof persisted.state === 'object') {
        Object.assign(state, persisted.state);
        state.points = Number(persisted.state.totalPoints ?? persisted.state.points ?? 0);
      }
      render();
      return result;
    }

    return Object.freeze({ setStatus });
  }

  return Object.freeze({ createTaskController });
});
