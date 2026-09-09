class EventTarget {
  constructor() {
    this._listeners = new Map();
  }

  addEventListener(type, handler) {
    if (!this._listeners.has(type)) this._listeners.set(type, []);
    this._listeners.get(type).push(handler);
  }

  removeEventListener(type, handler) {
    const list = this._listeners.get(type);
    if (!list) return;
    const index = list.indexOf(handler);
    if (index !== -1) list.splice(index, 1);
  }

  dispatchEvent(eventLike) {
    const event = typeof eventLike === "string" ? { type: eventLike } : { ...eventLike };
    if (typeof event.preventDefault !== "function") {
      event.preventDefault = () => {
        event.defaultPrevented = true;
      };
    }
    event.target = this;
    const list = this._listeners.get(event.type) || [];
    for (const handler of list.slice()) handler(event);
    return !event.defaultPrevented;
  }
}

class ClassList {
  constructor() {
    this._set = new Set();
  }

  add(...names) {
    names.forEach((name) => this._set.add(name));
  }

  remove(...names) {
    names.forEach((name) => this._set.delete(name));
  }

  contains(name) {
    return this._set.has(name);
  }

  toString() {
    return [...this._set].join(" ");
  }
}

class Element extends EventTarget {
  constructor(tagName) {
    super();
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentNode = null;
    this.attributes = new Map();
    this.classList = new ClassList();
    this._text = "";
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    return child;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }

  hasAttribute(name) {
    return this.attributes.has(name);
  }

  set textContent(value) {
    this._text = String(value);
    this.children = [];
  }

  get textContent() {
    if (this.children.length === 0) return this._text;
    return this.children.map((child) => child.textContent).join("");
  }

  click() {
    this.dispatchEvent({ type: "click" });
  }

  contains(node) {
    let current = node;
    while (current) {
      if (current === this) return true;
      current = current.parentNode;
    }
    return false;
  }

  querySelectorAll(selector) {
    const results = [];
    const visit = (element) => {
      for (const child of element.children) {
        if (matchesSelector(child, selector)) results.push(child);
        visit(child);
      }
    };
    visit(this);
    return results;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }
}

function matchesSelector(element, selector) {
  let remaining = selector;

  const tagMatch = remaining.match(/^[a-zA-Z][\w-]*/);
  if (tagMatch) {
    if (element.tagName.toLowerCase() !== tagMatch[0].toLowerCase()) return false;
    remaining = remaining.slice(tagMatch[0].length);
  }

  const classMatches = [...remaining.matchAll(/\.([\w-]+)/g)].map((match) => match[1]);
  for (const className of classMatches) {
    if (!element.classList.contains(className)) return false;
  }

  const attrMatches = [...remaining.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];
  for (const [, name, value] of attrMatches) {
    if (!element.hasAttribute(name)) return false;
    if (value !== undefined && element.getAttribute(name) !== value) return false;
  }

  return true;
}

export const document = {
  createElement(tagName) {
    return new Element(tagName);
  },
};

export { Element };
