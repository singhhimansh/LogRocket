import { PlayerController } from "./PlayerController.js";
const STYLES_URL = new URL("./player.css", import.meta.url)?.href;
const TABLER_ICON_CDN = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css";

const playerHtml = `
<div class="player-wrapper">
  <div class="toolbar">
    <div class="session-meta">
      <span class="label" id="session-title">Session</span>
      <span class="value" id="session-id">—</span>
    </div>

    <select class="speed-select" id="speed">
      <option value="0.5">0.5×</option>
      <option value="1" selected>1×</option>
      <option value="2">2×</option>
      <option value="4">4×</option>
    </select>

    <button class="ctrl-btn" id="restart-btn" aria-label="Restart">
      <i class="ti ti-rotate-clockwise" style="font-size:16px"></i>
    </button>
    <button class="ctrl-btn primary" id="play-btn" aria-label="Play">
      <i class="ti ti-player-play" style="font-size:18px"></i>
    </button>
  </div>

  <div class="timeline-row">
    <span class="time-label" id="time-current">0:00</span>
    <div class="timeline-track" id="timeline">
      <div class="timeline-fill" id="timeline-fill"></div>
    </div>
    <span class="time-label" id="time-total" style="text-align:right">0:00</span>
  </div>

  <div class="iframe-wrapper">
    <iframe id="player" title="Session replay"></iframe>
    <div class="overlay" id="overlay">
      <div class="overlay-icon">
        <i class="ti ti-player-play"></i>
      </div>
      <span class="overlay-text">Press play to start the session replay</span>
    </div>
    <div class="overlay-shadow" id="overlay-shadow">
  </div>

  <div class="status-bar">
    <div class="status-dot" id="status-dot"></div>
    <span class="status-text" id="status-text">Ready</span>
    <span class="event-count" id="event-count"></span>
  </div>
  </div>
  `;





export class SessionReplayViewer {
  constructor(container, options = {}) {
    if (!container) throw new Error("SessionReplayViewer: container is required");

    this.container = container;
    this.options = options;

    this._injectStyles('sp-styles', STYLES_URL);
    this._injectStyles('sp-icons', TABLER_ICON_CDN);
    this._mount();
    this._collectRefs();
    this._controller = new PlayerController(this._els, options);
  }

  _injectStyles(id, url) {
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  }

  _mount() {
    this.container.innerHTML = playerHtml;
  }

  // query all refs AFTER mount — same names your original player.js used
  _collectRefs() {
    const q = (id) => this.container.querySelector(id);

    const playBtn = q("#play-btn");

    this._els = {
      playBtn,
      restartBtn: q("#restart-btn"),
      speedSel: q("#speed"),
      fill: q("#timeline-fill"),
      timeline: q("#timeline"),
      timeCurrent: q("#time-current"),
      timeTotal: q("#time-total"),
      statusDot: q("#status-dot"),
      statusText: q("#status-text"),
      eventCount: q("#event-count"),
      sessionId: q("#session-id"),
      sessionTitle: q("#session-title"),
      overlay: q("#overlay"),
      iframe: q("#player"),
      playIcon: playBtn.querySelector("i"),
    };

    // unique iframe id so multiple instances don't clash
    this._els.iframe.id = `sp-iframe-${Math.random().toString(36).slice(2, 7)}`;
  }

  play() { this._controller.play(); }
  pause() { this._controller.pause(); }
  restart() { this._controller.restart(); }

  destroy() {
    this._controller.pause();
    this.container.innerHTML = "";
    document.getElementById("sp-styles")?.remove();
    document.getElementById("sp-icons")?.remove();
  }
}