/* Pure task state transitions. No DOM, storage or network access. */
(function(root){
  'use strict';
  const VALID = new Set(['done','helped','not_done','pending']);

  function normalize(value){ return VALID.has(value) ? value : 'pending'; }

  function transition(completions, taskId, nextStatus){
    if(!taskId) throw new Error('taskId is required');
    const next = { ...(completions || {}) };
    const status = normalize(nextStatus);
    if(status === 'pending') delete next[taskId];
    else next[taskId] = status;
    return next;
  }

  function isTerminal(status){
    status = normalize(status);
    return status === 'done' || status === 'helped' || status === 'not_done';
  }

  function countByStatus(completions){
    return Object.values(completions || {}).reduce((acc, raw) => {
      const status = normalize(raw);
      acc[status] += 1;
      return acc;
    }, { done:0, helped:0, not_done:0, pending:0 });
  }

  root.TaskState = Object.freeze({ normalize, transition, isTerminal, countByStatus });
})(window);
