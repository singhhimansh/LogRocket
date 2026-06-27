
function inlineLocalStyles() {
  const rules = [];

  Array.from(document.styleSheets).forEach((sheet) => {
    if (sheet.href) {
      // external sheet — try to read its rules
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          rules.push(rule.cssText);
        });
      } catch {
        // cross-origin (CDN) — can't read, will handle via <link> below
      }
    } else {
      // inline <style> tag — always readable
      try {
        Array.from(sheet.cssRules).forEach((rule) => {
          rules.push(rule.cssText);
        });
      } catch {
        // ignore
      }
    }
  });

  if (!rules.length) return "";

  return `<style data-replay="inlined">${rules.join("\n")}</style>`;
}

/**
 * External stylesheets we couldn't inline (cross-origin CDN).
 * sheet.href is always a fully resolved absolute URL so the iframe can fetch it.
 */
function externalStyleLinks() {
  return Array.from(document.styleSheets)
    .filter((sheet) => {
      if (!sheet.href) return false;
      try {
        // if we could read it, we already inlined it — skip the <link>
        Array.from(sheet.cssRules);
        return false;
      } catch {
        // cross-origin — keep the <link>
        return true;
      }
    })
    .map((sheet) => `<link rel="stylesheet" href="${sheet.href}">`)
    .join("\n");
}

/**
 * Rewrites relative asset paths to absolute so they resolve inside the iframe.
 * Skips anything already absolute (http/https), data URIs, and blob URLs.
 */
function makeAssetsAbsolute(html) {
  const base = window.location.origin;

  return html
    .replace(/src="(?!https?:|data:|blob:)([^"]+)"/g, (_, path) => {
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `src="${base}${clean}"`;
    })
    .replace(/href="(?!https?:|#|data:)([^"]+\.(css|woff2?|ttf|eot))"/g, (_, path) => {
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `href="${base}${clean}"`;
    })
    .replace(/url\(['"]?(?!https?:|data:|blob:)([^'")\s]+)['"]?\)/g, (_, path) => {
      const clean = path.startsWith("/") ? path : `/${path}`;
      return `url('${base}${clean}')`;
    });
}

// ─── captureScreenshot ────────────────────────────────────────────────────────

/**
 * Captures a full snapshot of the current page with styles self-contained.
 * @returns {Object} Screenshot event
 */
export const captureScreenshot = () => {
  const inlined  = inlineLocalStyles();
  const external = externalStyleLinks();

  let html = document.documentElement.outerHTML;

  // inject styles just before </head> so they don't conflict with existing tags
  html = html.replace("</head>", `${inlined}\n${external}\n</head>`);

  // fix relative paths for images, fonts, background assets
  html = makeAssetsAbsolute(html);

  return {
    type: "screenshot",
    timestamp: Date.now(),
    data: { html },
  };
};

// /**
//  * Captures a screenshot of the current page
//  * @returns {Object} Screenshot data
//  */
// export const captureScreenshot = () => {
//   return {
//     type: 'screenshot',
//     timestamp: Date.now(),
//     data: {
//       html: document.documentElement.outerHTML,
//     }
//   }
// }


/**
 * Observes mouse movement and records it
 * @returns {Function} Function to stop observing
 */
export const observeMouseMovement = (record) =>{
  let last=0;

  function listener (event) {
    let now = performance.now();
    if(now - last < 50) return;
    last = now;
    record({
      type: 'mouseMove',
      data: {
        x: event.clientX,
        y: event.clientY,
      }
    });
  }

  document.addEventListener('mousemove', listener, true);

  return () => document.removeEventListener('mousemove', listener, true);
}


/**
 * Observes DOM mutations and records them
 * @returns {Function} Function to stop observing
 */
export const observeMutations = (record) =>{
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      record({
        type: 'mutation',
        data: {
          mutationType: mutation.type,
          targetNode: mutation.target.outerHTML,
          id: mutation.target.getAttribute('id'),
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    // attributeOldValue: true,
    // characterData: true,
    // characterDataOldValue: true,
  });
  
  return () => observer.disconnect();
}


