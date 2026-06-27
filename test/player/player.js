import { SessionPlayer } from "../../packages/session-replay/class/SessionPlayer.js";
import { EventsRepository } from "../../packages/storage/EventsRepository.js";
import { IndexedDB } from "../../packages/storage/IndexedDB.js";

// const playBtn = document.getElementById("play");

// if (playBtn) {

//   playBtn.addEventListener("click", async () => {
//     console.log("play clicked")

//     const db = new IndexedDB("Logrocket", 2);
//     await db.connect();
//     const eventsRepository = new EventsRepository(db);
//     const page = await eventsRepository.getByTime({ limit: 10000 });
//     const player = new SessionPlayer(page.items, "player");
//     await player.play();
//   });

// }


// ─── DOM refs ────────────────────────────────────────────────────────────────
const playBtn     = document.getElementById("play-btn");
const restartBtn  = document.getElementById("restart-btn");
const speedSel    = document.getElementById("speed");
const fill        = document.getElementById("timeline-fill");
const timeline    = document.getElementById("timeline");
const timeCurrent = document.getElementById("time-current");
const timeTotal   = document.getElementById("time-total");
const statusDot   = document.getElementById("status-dot");
const statusText  = document.getElementById("status-text");
const eventCount  = document.getElementById("event-count");
const sessionId   = document.getElementById("session-id");
const overlay     = document.getElementById("overlay");
const playIcon    = playBtn.querySelector("i");

// ─── State ───────────────────────────────────────────────────────────────────
let player       = null;
let events       = [];
let duration     = 0;
let startReal    = 0;
let elapsed      = 0;
let playing      = false;
let speed        = 1;
let rafId        = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(ms) {
  const s = Math.floor(Math.max(ms, 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function setStatus(state) {
  statusDot.className = "status-dot " + state;
  const labels = { playing: "Playing", paused: "Paused", ended: "Ended", loading: "Loading…", "": "Ready" };
  statusText.textContent = labels[state] ?? "Ready";
}

function setPlayIcon(isPlaying) {
  playIcon.className = isPlaying
    ? "ti ti-player-pause"
    : "ti ti-player-play";
}

function setProgress(ms) {
  const pct = Math.min((ms / duration) * 100, 100);
  fill.style.width = pct + "%";
  timeCurrent.textContent = fmt(ms);
}

// ─── Timeline pip markers ─────────────────────────────────────────────────────
function renderPips(items, start, end) {
  const track = document.getElementById("timeline");
  // remove old pips
  track.querySelectorAll(".event-pip").forEach(p => p.remove());

  const typeClass = {
    click:            "pip-click",
    input:            "pip-input",
    error:            "pip-error",
    promise_rejection:"pip-error",
    navigation:       "pip-nav",
  };

  items.forEach(e => {
    const cls = typeClass[e.type];
    if (!cls) return;

    const pip = document.createElement("div");
    pip.className = "event-pip " + cls;
    pip.style.left = (((e.timestamp - start) / (end - start)) * 100) + "%";
    pip.title = e.type + (e.data?.message ? `: ${e.data.message}` : "");
    track.appendChild(pip);
  });
}

// ─── RAF loop ─────────────────────────────────────────────────────────────────
function tick() {
  if (!playing) return;

  elapsed = (Date.now() - startReal) * speed;
  setProgress(elapsed);

  if (elapsed >= duration) {
    setProgress(duration);
    playing = false;
    setPlayIcon(false);
    setStatus("ended");
    return;
  }

  rafId = requestAnimationFrame(tick);
}

// ─── Controls ─────────────────────────────────────────────────────────────────
function startPlayback() {
  if (!player) return;
  overlay.classList.add("hidden");
  playing  = true;
  startReal = Date.now() - elapsed / speed;
  setPlayIcon(true);
  setStatus("playing");
  cancelAnimationFrame(rafId);
  tick();
  player.play(speed);
}

function pausePlayback() {
  playing = false;
  cancelAnimationFrame(rafId);
  setPlayIcon(false);
  setStatus("paused");
  player?.pause();
}

function restartPlayback() {
  pausePlayback();
  elapsed = 0;
  setProgress(0);
  setStatus("");
  overlay.classList.remove("hidden");
  // re-create player so events reschedule from the start
  player = new SessionPlayer(events);
}

// ─── Event listeners ──────────────────────────────────────────────────────────
playBtn.addEventListener("click", () => {
  if (playing) pausePlayback();
  else         startPlayback();
});

restartBtn.addEventListener("click", restartPlayback);

speedSel.addEventListener("change", () => {
  speed = parseFloat(speedSel.value);
  if (playing) {
    // rebase startReal so position doesn't jump
    startReal = Date.now() - elapsed / speed;
    player?.setSpeed(speed);
  }
});

timeline.addEventListener("click", (e) => {
  const rect = timeline.getBoundingClientRect();
  const pct  = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1));
  elapsed    = pct * duration;
  setProgress(elapsed);

  if (playing) {
    startReal = Date.now() - elapsed / speed;
    player?.seekTo(elapsed);
  }

  overlay.classList.add("hidden");
});

// ─── Boot — load events from IndexedDB ───────────────────────────────────────
async function init() {
  setStatus("loading");

  try {
    // const repo  = await openRepository();
    const db = new IndexedDB("Logrocket", 2);
    await db.connect();
    const eventsRepository = new EventsRepository(db);
    const page = await eventsRepository.getByTime({ limit: 10000 });
   
    // const page  = await repo.getByTime({ limit: 10000 });
    events   = page.items;

    if (!events.length) {
      statusText.textContent = "No events found";
      return;
    }

    const start = events[0].timestamp;
    const end   = events.at(-1).timestamp;
    duration    = end - start;

    // UI metadata
    const snap = events.find(e => e.type === "screenshot");
    sessionId.textContent = snap?.sessionId?.slice(0, 12) ?? "—";
    timeTotal.textContent = fmt(duration);
    eventCount.textContent = `${events.length} events`;

    // Draw pips on timeline
    renderPips(events, start, end);

    // Create player (doesn't play yet)
    player = new SessionPlayer(page.items, "player");

    setStatus("");

  } catch (err) {
    console.error("Failed to load session:", err);
    statusText.textContent = "Failed to load session";
    statusDot.className = "status-dot";
  }
}

init();