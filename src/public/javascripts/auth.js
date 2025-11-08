// Config: tune these values to match your backend timing
const REFRESH_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes -> refresh before 14min cookie / 15min JWT
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // consider user inactive after 10 min of no interaction

let _refreshTimer = null;
let _inactivityTimer = null;
let _running = false;

/**
 * small util: read cookie by name
 */
function getCookie(name) {
  const v = document.cookie.match("(?:^|; )" + name + "=([^;]*)");
  return v ? decodeURIComponent(v[1]) : null;
}

/**
 * Call the refresh endpoint. Returns true if refresh succeeded, false otherwise.
 */
async function doRefresh() {
  try {
    const res = await fetch("/auth/refreshToken", {
      method: "POST",
      credentials: "include", // important: send httpOnly cookies
      headers: {
        Accept: "application/json",
      },
    });

    return res.status === 200;
  } catch (_) {
    // network error -> treat as transient
    return false;
  }
}

/**
 * Called when refresh timer fires.
 */
async function _onRefreshTick() {
  if (document.hidden) {
    scheduleNextRefresh(REFRESH_INTERVAL_MS);
    return;
  }

  const loggedIn = !!getCookie("userID"); // rely on non-httpOnly cookie
  if (!loggedIn) {
    // no user -> nothing to do
    stopAuthRefresh();
    return;
  }

  const ok = await doRefresh();
  if (ok) {
    // success -> schedule next normal refresh
    scheduleNextRefresh(REFRESH_INTERVAL_MS);
  }
}

/**
 * Schedule next refresh after ms milliseconds.
 * Cancels previous timer if any.
 */
function scheduleNextRefresh(ms) {
  if (_refreshTimer) clearTimeout(_refreshTimer);
  _refreshTimer = setTimeout(_onRefreshTick, ms);
}

/**
 * Reset inactivity timer - when user is idle for INACTIVITY_TIMEOUT_MS
 * we stop refreshing until activity resumes.
 */
function resetInactivityTimer() {
  if (_inactivityTimer) clearTimeout(_inactivityTimer);
  // if we were stopped due to inactivity, resume refreshing immediately
  if (!_running) return;

  _inactivityTimer = setTimeout(() => {
    // User considered inactive -> pause automatic refresh
    // We'll stop refreshing and rely on user to become active to resume (or a page navigation)
    stopAuthRefresh({ pauseOnly: true });
    // Note: you can also choose to continue refreshing in the background — depends on UX choice
  }, INACTIVITY_TIMEOUT_MS);
}

/**
 * Public: start the refresh loop if logged in.
 */
function startAuthRefresh() {
  if (_running) return;
  const loggedIn = !!getCookie("userID");
  if (!loggedIn) {
    return;
  }

  _running = true;
  resetInactivityTimer();

  // schedule first refresh after REFRESH_INTERVAL_MS
  scheduleNextRefresh(REFRESH_INTERVAL_MS);

  // user activity listeners to keep the session alive only when user is active
  const activityEvents = [
    "click",
    "keydown",
    "mousemove",
    "scroll",
    "touchstart",
  ];
  activityEvents.forEach((ev) =>
    window.addEventListener(ev, _activityHandler, { passive: true }),
  );

  // visibility change: if tab becomes visible, attempt an immediate refresh
  document.addEventListener("visibilitychange", _visibilityHandler);
}

/**
 * Stop the refresh loop. If pauseOnly=true, we stop timers but keep handlers so we can resume.
 */
function stopAuthRefresh({ pauseOnly = false } = {}) {
  if (!pauseOnly) {
    // remove activity listeners and visibility handler
    const activityEvents = [
      "click",
      "keydown",
      "mousemove",
      "scroll",
      "touchstart",
    ];
    activityEvents.forEach((ev) =>
      window.removeEventListener(ev, _activityHandler),
    );
    document.removeEventListener("visibilitychange", _visibilityHandler);
  }

  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
  if (_inactivityTimer) {
    clearTimeout(_inactivityTimer);
    _inactivityTimer = null;
  }
  _running = false;
}

/**
 * Activity handler: reset inactivity timer and optionally trigger an immediate refresh
 */
function _activityHandler() {
  resetInactivityTimer();
}

/**
 * On visibility change: if tab becomes visible and user loggedIn, try to refresh immediately.
 */
function _visibilityHandler() {
  if (!document.hidden) {
    // page visible again
    if (getCookie("userID")) {
      // trigger immediate refresh tick (but don't overlap timers)
      if (_refreshTimer) clearTimeout(_refreshTimer);
      _onRefreshTick();
      resetInactivityTimer();
    }
  }
}

/**
 * On document load, start the refresh process if user appears logged in.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (getCookie("userID")) {
    startAuthRefresh();
  }
});

// Export control functions if needed by other modules
window.authRefresh = {
  start: startAuthRefresh,
  stop: stopAuthRefresh,
};
