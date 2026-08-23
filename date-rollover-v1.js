(() => {
  'use strict';

  /*
   * Daily lifecycle guard.
   *
   * The app has two state sources: localStorage and the remote backup. A
   * remote snapshot from yesterday could be merged after the initial local
   * reconciliation, bringing yesterday's checkedToday/lastDate back onto
   * the screen. This guard makes the calendar day authoritative again.
   *
   * New day starts at 00:00. The routine remains the routine for that
   * calendar day; Pacus' morning block is configured to begin at 08:00.
   */
  const CHECK_MS = 15000;
  let lastObservedDate = null;

  function currentISO() {
    if (typeof todayISO === 'function') return todayISO();
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function formatTodayLabel(iso) {
    try {
      const d = new Date(iso + 'T12:00:00');
      return new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric'
      }).format(d);
    } catch (_) {
      return iso;
    }
  }

  function updateDateLabel(iso) {
    const context = document.querySelector('.topbar-context');
    if (!context) return;
    context.textContent = 'Hoje: ' + formatTodayLabel(iso) + ' · uma tarefa de cada vez.';
    context.dataset.calendarDate = iso;
  }

  function resetForNewDay(iso) {
    if (typeof state === 'undefined') return false;
    if (state.lastDate === iso) return false;

    const previousDate = state.lastDate;

    // Preserve yesterday before clearing today's transient checklist.
    if (previousDate && typeof closeOutDay === 'function' && previousDate < iso) {
      try { closeOutDay(state, previousDate); } catch (_) {}
    }

    state.checkedToday = {};
    state.log = [];
    state.lastDate = iso;
    state.gameTimer = {
      date: iso,
      usedSeconds: 0,
      runningSince: null,
      bonusSeconds: 0,
      redemptions: {}
    };

    // Daily-only recovery UI must never leak into the next day.
    delete state.freshStartActiveDate;
    delete state.recoveryMissionDone;
    state.familyGameNightAnnouncementSeen = false;

    if (typeof saveState === 'function') saveState(state);
    if (typeof render === 'function') render();
    return true;
  }

  function checkDay() {
    const iso = currentISO();
    updateDateLabel(iso);

    if (lastObservedDate === null) {
      lastObservedDate = iso;
      resetForNewDay(iso);
      return;
    }

    if (lastObservedDate !== iso) {
      lastObservedDate = iso;
      resetForNewDay(iso);
      return;
    }

    // Also catches a remote Drive merge that restores yesterday's state.
    if (typeof state !== 'undefined' && state.lastDate !== iso) {
      resetForNewDay(iso);
    }
  }

  function start() {
    checkDay();
    setInterval(checkDay, CHECK_MS);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) checkDay();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
