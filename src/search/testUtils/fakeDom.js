// Minimal DOM double used only by tests in this project, since no jsdom/browser
// environment is installed here. Supports just enough of the DOM API surface
// (createElement, classList, attributes, appendChild, textContent, click events,
// querySelector/querySelectorAll with tag/.class/[attr] descendant selectors) for
// searchResultsView.js to run and be inspected under Node's built-in test runner.

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.attrs = new Map();
    this.children = [];
    this.parentNode = null;
    this.listeners = {};
    this._text = '';
  }

  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }

  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }

  removeAttribute(name) {
    this.attrs.delete(name);
  }

  get classList() {
    const self = this;
    const read = () => (self.attrs.get('class') || '').split(/\s+/).filter(Boolean);
    const write = (list) => self.attrs.set('class', list.join(' '));
    return {
      add(...names) {
        const set = new Set(read());
        names.forEach((n) => set.add(n));
        write(Array.from(set));
      },
      remove(...names) {
        const set = new Set(read());
        names.forEach((n) => set.delete(n));
        write(Array.from(set));
      },
      contains(name) {
        return read().includes(name);
      },
    };
  }

  appendChild(child) {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) this.children.splice(index, 1);
    child.parentNode = null;
    return child;
  }

  set textContent(value) {
    this.children = [];
    this._text = value;
  }

  get textContent() {
    if (this.children.length === 0) return this._text || '';
    return this.children.map((child) => child.textContent).join('');
  }

  addEventListener(type, handler) {
    (this.listeners[type] = this.listeners[type] || []).push(handler);
  }

  removeEventListener(type, handler) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((h) => h !== handler);
  }

  dispatchEvent(event) {
    event.target = event.target || this;
    (this.listeners[event.type] || []).forEach((handler) => handler(event));
    return true;
  }

  click() {
    this.dispatchEvent({ type: 'click', target: this });
  }

  querySelectorAll(selector) {
    return queryAll(this, selector);
  }

  querySelector(selector) {
    return queryAll(this, selector)[0] || null;
  }
}

function parseCompound(token) {
  const compound = { tag: null, classes: [], attrs: [] };
  let rest = token;
  const tagMatch = rest.match(/^[a-zA-Z][\w-]*/);
  if (tagMatch) {
    compound.tag = tagMatch[0].toLowerCase();
    rest = rest.slice(tagMatch[0].length);
  }
  const partRe = /\.[\w-]+|\[[^\]]+\]/g;
  let match;
  while ((match = partRe.exec(rest))) {
    if (match[0].startsWith('.')) {
      compound.classes.push(match[0].slice(1));
    } else {
      const inner = match[0].slice(1, -1);
      const eq = inner.indexOf('=');
      if (eq === -1) {
        compound.attrs.push([inner, null]);
      } else {
        const value = inner.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
        compound.attrs.push([inner.slice(0, eq), value]);
      }
    }
  }
  return compound;
}

function elementMatches(el, compound) {
  if (compound.tag && el.tagName.toLowerCase() !== compound.tag) return false;
  for (const cls of compound.classes) {
    if (!el.classList.contains(cls)) return false;
  }
  for (const [name, value] of compound.attrs) {
    const actual = el.getAttribute(name);
    if (actual === null) return false;
    if (value !== null && actual !== value) return false;
  }
  return true;
}

function collectDescendants(el, out) {
  for (const child of el.children) {
    out.push(child);
    collectDescendants(child, out);
  }
}

function hasMatchingAncestorChain(el, tokens, idx) {
  if (idx < 0) return true;
  let node = el.parentNode;
  while (node) {
    if (elementMatches(node, tokens[idx]) && hasMatchingAncestorChain(node, tokens, idx - 1)) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

function queryAll(root, selector) {
  const tokens = selector.trim().split(/\s+/).map(parseCompound);
  const last = tokens[tokens.length - 1];
  const descendants = [];
  collectDescendants(root, descendants);
  return descendants.filter(
    (el) => elementMatches(el, last) && hasMatchingAncestorChain(el, tokens, tokens.length - 2)
  );
}

function createFakeDocument() {
  return {
    createElement: (tagName) => new FakeElement(tagName),
  };
}

module.exports = { createFakeDocument };
