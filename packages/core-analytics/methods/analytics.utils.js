// import { generateUniqueId } from "@logrocket/utils/common.utils";

import { debounced, generateUniqueId, getDeviceId, getSessionId } from "../../utils/common.utils.js";

const ALLOWED_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'A', 'SELECT', 'OPTION', 'CHECKBOX', 'RADIO']);

export function instrumentClick(report) {
  function listener(event) {
    const target = event.target;
    if (target.classList.contains('logrocket-ignore')
      || !ALLOWED_TAGS.has(target.tagName?.toUpperCase())) {
      return;
    }

    report({
      type: "click",
      data: {
        tag: target.tagName,
        id: target.id || null,
        class: target.className || null,
        text: target.innerText?.slice(0, 100),
        x: event.clientX,
        y: event.clientY,
      }
    });
  }
  document.addEventListener(
    "click", listener
    ,
    true // capture phase (critical)
  );

  return () => document.removeEventListener("click", listener, true);
}

/**
 * Why capture phase matters:
 * - React uses bubbling
 * - stopPropagation() cannot block capture-phase listeners
 */



export function instrumentInput(report) {
  const listener = debounced((event) => {
    const target = event.target;
    const isMasked = target.classList.contains('mask-field');

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (target.classList.contains('logrocket-ignore')) {
      return;
    }

    const data = {
      tag: target.tagName,
      inputType: target.type,
      name: target.name || null,
      id: target.id || null,
      class: target.className || null,
      x: event.clientX,
      y: event.clientY,
    };
    if (!isMasked) {
      data.value = target.value;
    }


    report({
      type: "input",
      data
    });
  })
  document.addEventListener(
    "input",
    listener,
    true
  );

  return () => document.removeEventListener("input", listener, true);
}


export function instrumentScroll(report) {
  let lastY = 0;


  const listener = debounced(() => {
    const y = window.scrollY;
    if (Math.abs(y - lastY) < 100) return;

    lastY = y;

    report({
      type: "scroll",
      data: {
        x: window.scrollX,
        y: window.scrollY,
      }
    });
  })

  window.addEventListener(
    "scroll", listener,
    { passive: true }
  );

  return () => window.removeEventListener("scroll", listener, { passive: true });
}


export function instrumentNavigation(report) {
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function (...args) {
    report({ type: "navigation", data: { url: location.href } });
    return pushState.apply(this, args);
  };

  history.replaceState = function (...args) {
    report({ type: "navigation", data: { url: location.href } });
    return replaceState.apply(this, args);
  };

  window.addEventListener("popstate", () => {
    report({ type: "navigation", data: { url: location.href } });
  });

  return () => {
    window.removeEventListener("popstate", () => {
      report({ type: "navigation", data: { url: location.href } });
    });
    history.pushState = pushState;
    history.replaceState = replaceState;
  };
}


export function instrumentErrors(report) {
  function errorListener(event) {
    report({
      type: "error",
      data: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    });
  }

  function rejectionListener(event) {
    report({
      type: "promise_rejection",
      data: {
        reason: String(event.reason),
      }
    });
  }
  window.addEventListener("error", errorListener);

  window.addEventListener("unhandledrejection", rejectionListener);

  return () => {
    window.removeEventListener("error", errorListener);
    window.removeEventListener("unhandledrejection", rejectionListener);
  };
}


export function enrichEvent(event) {
  return {
    ...event,
    sessionId: getSessionId(),
    deviceId: getDeviceId(),
    timestamp: Date.now(),
    url: location.href,
    userAgent: navigator.userAgent,
  };
}
