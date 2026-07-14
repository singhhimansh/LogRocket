const isUnique = (selector) => {
  try {
    return document.querySelectorAll(selector).length === 1;
  } catch {
    return false;
  }
};

const escapeSelector = (str) => CSS.escape(String(str));

// attribute escape on \ and "
const escapeAttrValue = (str) =>
  String(str).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

// attribute dataset key => fooBar -> data-foo-bar
const camelToKebab = (str) =>
  str.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const getNthElementIndex = (element) => {
  if (!element || !element.parentElement) return null;
  const siblings = Array.from(element.parentElement.children);
  const index = siblings.indexOf(element);
  return index >= 0 ? index + 1 : null;
};

/**
 * 
 * @param {Element} target element node
 * @returns {string | null}
 */
const getUniqueSelector = (target) => {
  if (!target || target.nodeType !== Node.ELEMENT_NODE) {
    return null;
  }

  const tagName = target?.tagName?.toLowerCase() || "";
  let str = tagName;

  if (target.id) {
    let idSelector = `${str}#${escapeSelector(target.id)}`;
    if (isUnique(idSelector)) {
      return idSelector;
    }
    str = idSelector;
  }

  if (target.dataset && Object.keys(target.dataset).length > 0) {
    const dataAttributes = Object.entries(target.dataset)
      .map(
        ([key, value]) =>
          `[data-${camelToKebab(key)}="${escapeAttrValue(value)}"]`,
      )
      .join("");
    str += dataAttributes;
    if (isUnique(str)) return str;
  }

  if (target?.name) {
    str += `[name="${escapeAttrValue(target.name)}"]`;
    if (isUnique(str)) return str;
  }

  if (target.classList.length > 0) {
    const classSelectors = Array.from(target.classList);
    for (const className of classSelectors) {
      const classSelector = `.${escapeSelector(className)}`;
      str += classSelector;
      if (isUnique(str)) return str;
    }
  }

  const nthIndex = getNthElementIndex(target);
  if (nthIndex !== null) {
    str += `:nth-child(${nthIndex})`;
    if (isUnique(str)) return str;
  }

  const parentElement = target.parentElement;

  const uniqueSelector = getUniqueSelector(parentElement);

  if (uniqueSelector) {
    str = `${uniqueSelector} > ${str}`;
    if (isUnique(str)) return str;
  }

  // fallback for reaching top html
  return str;
};


export default getUniqueSelector;
