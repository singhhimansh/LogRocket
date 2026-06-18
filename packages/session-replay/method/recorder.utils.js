
/**
 * Captures a screenshot of the current page
 * @returns {Object} Screenshot data
 */
export const captureScreenshot = () => {
  return {
    type: 'screenshot',
    timestamp: Date.now(),
    data: {
      html: document.documentElement.outerHTML,
    }
  }
}


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
      timestamp: Date.now(),
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
        timestamp: Date.now(),
        data: {
          mutationType: mutation.type,
          targetNode: mutation.target.outerHTML,
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


