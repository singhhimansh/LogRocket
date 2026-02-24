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