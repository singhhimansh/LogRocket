import { APP_KEYS } from "./text.utils.js";

export const throttled = (fn, limit = 500) => {
  let timer;
  let lastTime = 0;

  function throttledFunc(...args) {
    let timeleft = limit - (Date.now() - lastTime);

    if (timeleft <= 0) {
      fn.call(this, ...args);
      lastTime = Date.now();
    }
  }

  return throttledFunc;
};

export const debounced = (fn, delay = 500) => {
  let timer;

  function debouncedfunc(...args) {

    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      fn.call(this, ...args);
    }, delay);

  }

  return debouncedfunc;
}

export function generateUniqueId(prefix = "") {
  return prefix + crypto.randomUUID();
}

export function getDeviceId() {
  let id = localStorage.getItem(APP_KEYS.SDK_DEVICE_ID);

  if (!id) {
    id = generateUniqueId(APP_KEYS.PREFIX.DEVICE);
    localStorage.setItem(APP_KEYS.SDK_DEVICE_ID, id);
  }

  return id;
}

export function getSessionId() {
  let sessionId = sessionStorage.getItem(APP_KEYS.SDK_SESSION_ID);

  if (!sessionId) {
    sessionId = generateUniqueId(APP_KEYS.PREFIX.SESSION);

    sessionStorage.setItem(
      APP_KEYS.SDK_SESSION_ID,
      JSON.stringify({
        id: sessionId,
        startedAt: Date.now(),
        lastSeen: Date.now(),
      })
    );
  }

  return JSON.parse(
    sessionStorage.getItem(APP_KEYS.SDK_SESSION_ID)
  ).id;
}



