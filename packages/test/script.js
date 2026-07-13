import AnalyticsInit from "../packages/core-analytics/index.js";
import { SessionPlayer } from "../packages/session-replay/class/SessionPlayer.js";

const analytics = new AnalyticsInit({
  disableScrollTracking: true,
  sessionReplay: true,
});
const instance = await analytics.init();


let evtCount = 0,
  fieldsFilled = new Set(),
  startTime = Date.now();
function elapsed() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  return s < 60 ? s + "s" : Math.floor(s / 60) + "m " + (s % 60) + "s";
}
function fmtTime() {
  const s = Math.floor((Date.now() - startTime) / 1000);
  return Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);
}
setInterval(() => {
  document.getElementById("time-elapsed").textContent = elapsed();
}, 1000);

function addEvent(icon, text) {
  evtCount++;
  document.getElementById("evt-count").textContent = evtCount;
  const log = document.getElementById("event-log");
  const d = document.createElement("div");
  d.className = "sr-event";
  d.innerHTML = `<i class="ti ti-${icon}" aria-hidden="true"></i><span>${text}</span><span class="sr-event-time">${fmtTime()}</span>`;
  log.appendChild(d);
  requestAnimationFrame(() => d.classList.add("visible"));
  log.scrollTop = log.scrollHeight;
}

// function addEvent(event) {
//   // console.log(event);
// }

function markField(id) {
  if (!fieldsFilled.has(id)) {
    fieldsFilled.add(id);
    document.getElementById("field-count").textContent = fieldsFilled.size;
  }
}

const fields = [
  { id: "sr-name", icon: "user", label: "Name filled" },
  { id: "sr-email", icon: "mail", label: "Email filled" },
  { id: "sr-password", icon: "lock", label: "Password entered" },
  { id: "sr-country", icon: "map-pin", label: "Country selected" },
  { id: "sr-about", icon: "writing", label: "Bio written" },
];

fields.forEach(({ id, icon, label }) => {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("focus", () =>
    addEvent("cursor-text", "Focus → " + label.split(" ")[0].toLowerCase()),
  );
  el.addEventListener("blur", () => {
    if (el.value.trim()) {
      markField(id);
      addEvent(icon, label);
      el.classList.add("filled");
    }
  });
  el.addEventListener("input", () => {
    if (el.value.trim()) el.classList.add("filled");
    else el.classList.remove("filled");
  });
});

document.querySelectorAll('input[name="gender"]').forEach((r) => {
  r.addEventListener("change", () => {
    markField("gender");
    addEvent("gender-bigender", "Gender → " + r.value);
  });
});
document.querySelectorAll('input[name="hobbies"]').forEach((c) => {
  c.addEventListener("change", () =>
    addEvent(
      c.checked ? "square-check" : "square",
      "Hobby " + (c.checked ? "checked" : "unchecked") + ": " + c.value,
    ),
  );
});

document.getElementById("sr-submit-btn").addEventListener("click", () => {
  addEvent("send", "Form submitted");
  const btn = document.getElementById("sr-submit-btn");
  btn.textContent = "Submitting…";
  btn.classList.add("submitting");
  setTimeout(() => {
    btn.textContent = "Account created ✓";
    const t = document.getElementById("toast");
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2800);
  }, 1000);
});
