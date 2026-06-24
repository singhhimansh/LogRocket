import { CursorImages, CursorTypes, getCursorNode } from "../cursors.js";

export class SessionPlayer {
  constructor(events, frameId = "sdk_player") {
    this.events = [...events].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    this.frame = document.getElementById(frameId);
    this.cursor = null;
    this.timers = [];
  }

  get doc() {
    return this.frame?.contentDocument;
  }

  async play() {
    const snapshot = this.events.find((e) => e.type === "screenshot");

    // first load snapshot
    if (snapshot) {
      this.renderSnapshot(snapshot.data.html);
      // Wait for iframe to finish parsing
      await new Promise((r) => setTimeout(r, 100));
    }

    // Create cursor after snapshot
    this.createCursor();

    const replayEvents = this.events.filter((e) => e.type !== "screenshot");
    if (!replayEvents.length) return;

    const start = replayEvents[0].timestamp;

    this.timers = replayEvents.map((event) =>
      setTimeout(
        () => this.applyEvent(event),
        event.timestamp - start
      )
    );
  }

  stop() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  renderSnapshot(html) {
    const doc = this.frame.contentDocument;
    doc.open();
    doc.write(html);
    doc.close();
  }

 


  createCursor(type = CursorTypes.Classic) {
    if (!this.doc?.body) return;

    let cursor = getCursorNode.call(this, type);
    this.doc.body.appendChild(cursor);
    this.cursor = cursor;
  }

  getElementById(id) {
    if (!id || !this.doc) return null;
    return this.doc.getElementById(id);
  }

  applyEvent(event) {
    switch (event.type) {
      case "click": return this.applyClick(event);
      case "input": return this.applyInput(event);
      case "mutation": return this.applyMutation(event);
      case "mouseMove": return this.applyMouse(event);
      case "scroll": return this.applyScroll(event);
    }
  }

  applyMutation(event) {
    const { id, targetNode, mutationType } = event.data;

    // No id = full body replacement (shouldn't happen post-snapshot, but guard)
    if (!id) return;

    const el = this.getElementById(id);
    if (!el) return;

    if (mutationType === "childList" && targetNode) {
      // Parse the targetNode HTML and replace the element's innerHTML
      // Using outerHTML replacement can lose the reference, so use a template
      const tpl = this.doc.createElement("template");
      tpl.innerHTML = targetNode;
      const newEl = tpl.content.firstElementChild;
      if (newEl) {
        el.replaceWith(newEl);
      }
    }

    if (mutationType === "attributes" && event.data.attribute) {
      el.setAttribute(event.data.attribute.name, event.data.attribute.value);
    }

    if (mutationType === "characterData") {
      el.textContent = targetNode;
    }
  }

  applyInput(event) {
    const el = this.getElementById(event.data.id);
    if (!el) return;

    // Masked fields: don't replay value
    if (el.classList.contains("mask-field")) {
      el.value = "••••••••";
      return;
    }

    if (event.data.value !== undefined) {
      el.value = event.data.value;
    }
  }

  applyClick(event) {
    const { x, y, } = event.data;

    // show ripple to indicate click
    this._showClickRipple(x, y);
  }

  applyScroll(event) {
    this.frame.contentWindow?.scrollTo(event.data.x, event.data.y);
  }

  applyMouse(event) {
    if (!this.cursor) return;
    this.cursor.style.left = `${event.data.x}px`;
    this.cursor.style.top = `${event.data.y}px`;
  }

  _showClickRipple(x, y) {
    if (!this.doc?.body) return;

    // Inject keyframe style once
    if (!this.doc.getElementById("__replay_styles__")) {
      const style = this.doc.createElement("style");
      style.id = "__replay_styles__";
      style.textContent = `
        @keyframes __replay_ripple {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
      `;
      this.doc.head.appendChild(style);
    }

    const dot = this.doc.createElement("div");
    Object.assign(dot.style, {
      position: "fixed",
      left: `${x - 10}px`,
      top: `${y - 10}px`,
      width: "20px",
      height: "20px",
      borderRadius: "50%",
      background: "rgba(255, 50, 50, 0.6)",
      pointerEvents: "none",
      zIndex: "999998",
      animation: "__replay_ripple 0.5s ease-out forwards",
    });
    this.doc.body.appendChild(dot);
    setTimeout(() => dot.remove(), 600);
  }
}