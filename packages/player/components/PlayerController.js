import { SessionPlayer } from "../../session-replay/class/SessionPlayer.js";
import { EventsRepository } from "../../storage/EventsRepository.js";
import { IndexedDB } from "../../storage/IndexedDB.js";

export class PlayerController {
  constructor(els, options = {}) {
    // els are passed IN from SessionReplayViewer after mount
    // nothing is queried here — no DOM access at import time
    this._els = els;
    this.options = {
      dbName: "Logrocket",
      dbVersion: 2,
      limit: 10000,
      ...options,
    };

    this._player = null;
    this._events = [];
    this._duration = 0;
    this._elapsed = 0;
    this._speed = 1;
    this._playing = false;
    this._startReal = 0;
    this._rafId = null;

    this._bindEvents();
    this._loadEvents();
  }

  // ─── Data ──────────────────────────────────────────────────────────────────

  async _loadEvents() {
    this._setStatus("loading");
    try {
      const db = new IndexedDB(this.options.dbName, this.options.dbVersion);
      await db.connect();

      const repo = new EventsRepository(db);
      const page = await repo.getByTime({ limit: this.options.limit });
      this._events = page.items;

      if (!this._events.length) {
        this._setStatus("", "No events found");
        return;
      }

      const start = this._events[0].timestamp;
      const end = this._events.at(-1).timestamp;
      this._duration = end - start;

      const snap = this._events.find((e) => e.type === "screenshot");
      this._els.sessionId.textContent = snap?.sessionId?.slice(0, 12) ?? "—";
      this._els.timeTotal.textContent = this._fmt(this._duration);
      this._els.eventCount.textContent = `${this._events.length} events`;

      this._renderPips(this._events, start, end);

      this._player = new SessionPlayer(this._events, this._els.iframe.id);
      this._setStatus("");
    } catch (err) {
      console.error("PlayerController:", err);
      this._setStatus("", "Failed to load session");
    }
  }

  // ─── Bind ──────────────────────────────────────────────────────────────────

  _bindEvents() {
    this._els.playBtn.addEventListener("click", () => {
      if (this._playing) this.pause();
      else this.play();
    });

    this._els.restartBtn.addEventListener("click", () => this.restart());

    this._els.speedSel.addEventListener("change", () => {
      this._speed = parseFloat(this._els.speedSel.value);
      if (this._playing) {
        this._startReal = Date.now() - this._elapsed / this._speed;
        this._player?.setSpeed(this._speed);
      }
    });

    this._els.timeline.addEventListener("click", (e) => {
      const rect = this._els.timeline.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min((e.clientX - rect.left) / rect.width, 1),
      );
      this._elapsed = pct * this._duration;
      this._setProgress(this._elapsed);
      this._els.overlay.classList.add("hidden");

      if (this._playing) {
        this._startReal = Date.now() - this._elapsed / this._speed;
        this._player?.seekTo(this._elapsed);
      }
    });
  }

  // ─── Public API ────────────────────────────────────────────────────────────

  play() {
    if (!this._player) return;
    this._playing = true;
    this._startReal = Date.now() - this._elapsed / this._speed;
    this._els.overlay.classList.add("hidden");
    this._setPlayIcon(true);
    this._setStatus("playing");
    cancelAnimationFrame(this._rafId);
    this._tick();
    this._player.play(this._speed);
  }

  pause() {
    this._playing = false;
    cancelAnimationFrame(this._rafId);
    this._setPlayIcon(false);
    this._setStatus("paused");
    this._player?.pause();
  }

  restart() {
    this.pause();
    this._elapsed = 0;
    this._setProgress(0);
    this._setStatus("");
    this._els.overlay.classList.remove("hidden");
    this._player = new SessionPlayer(this._events, this._els.iframe.id);
  }

  // ─── Internal ──────────────────────────────────────────────────────────────

  _tick() {
    if (!this._playing) return;
    this._elapsed = (Date.now() - this._startReal) * this._speed;
    this._setProgress(this._elapsed);

    if (this._elapsed >= this._duration) {
      this._setProgress(this._duration);
      this._playing = false;
      this._setPlayIcon(false);
      this._setStatus("ended");
      return;
    }
    this._rafId = requestAnimationFrame(() => this._tick());
  }

  _setProgress(ms) {
    const pct = Math.min((ms / this._duration) * 100, 100);
    this._els.fill.style.width = pct + "%";
    this._els.timeCurrent.textContent = this._fmt(ms);
  }

  _setPlayIcon(isPlaying) {
    this._els.playIcon.className = isPlaying
      ? "ti ti-player-pause"
      : "ti ti-player-play";
  }

  _setStatus(state, label) {
    const labels = {
      playing: "Playing",
      paused: "Paused",
      ended: "Ended",
      loading: "Loading…",
      "": "Ready",
    };
    this._els.statusDot.className = "status-dot " + state;
    this._els.statusText.textContent = label ?? labels[state] ?? "Ready";
  }

  _renderPips(events, start, end) {
    this._els.timeline
      .querySelectorAll(".event-pip")
      .forEach((p) => p.remove());

    const typeClass = {
      click: "pip-click",
      input: "pip-input",
      error: "pip-error",
      promise_rejection: "pip-error",
      navigation: "pip-nav",
    };

    events.forEach((e) => {
      const cls = typeClass[e.type];
      if (!cls) return;
      const pip = document.createElement("div");
      pip.className = "event-pip " + cls;
      pip.style.left = ((e.timestamp - start) / (end - start)) * 100 + "%";
      pip.title = e.type + (e.data?.message ? `: ${e.data.message}` : "");
      this._els.timeline.appendChild(pip);
    });
  }

  _fmt(ms) {
    const s = Math.floor(Math.max(ms, 0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }
}
