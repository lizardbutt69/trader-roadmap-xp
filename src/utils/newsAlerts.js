import { getSortedEvents, getMinutesUntil, formatEventTime } from "./calendarUtils.js";

// Module-level set — tracks which alerts already fired this session
const firedAlerts = new Set();

// Plays a descending 3-tone alert (distinct from the ascending NYSE opening bell)
export function playNewsWarningTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const tones = [880, 660, 440]; // descending
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      const start = ctx.currentTime + i * 0.22;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.35);
    });
  } catch (_) {
    // AudioContext not available (e.g., test env) — silently skip
  }
}

// Call this on a 30-second interval from the main app.
// alertMinutes: array of minute thresholds to fire at (e.g. [30, 15])
export function checkNewsAlerts(now, addToast, displayTZ, alertMinutes = [30, 15]) {
  const highImpact = getSortedEvents().filter(
    (e) => e.impact === "high" && e.time !== "allday"
  );
  const alertsEnabled = localStorage.getItem("newsAlertsEnabled") === "true";

  alertMinutes.forEach((mins) => {
    highImpact.forEach((event) => {
      const until = getMinutesUntil(event, now);
      if (until === null) return;

      // Fire when the countdown crosses the threshold (within a ±0.5 min window)
      if (until > mins - 0.5 && until <= mins + 0.5) {
        const key = `${event.date}_${event.name}_${mins}`;
        if (firedAlerts.has(key)) return;
        firedAlerts.add(key);

        const timeDisplay = formatEventTime(event, displayTZ || "America/New_York");

        // In-app toast (always fires regardless of notification permission)
        if (addToast) {
          addToast(`NEWS in ${mins}min: ${event.name} at ${timeDisplay}`, "error");
        }

        // Browser notification (opt-in)
        if (alertsEnabled && typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`TradeSharp: ${event.name} in ${mins}min`, {
            body: `${event.name} releases at ${timeDisplay}. Consider standing aside.`,
            tag: key, // prevents duplicate system notifications
            icon: "/favicon.svg",
          });
        }

        // Audio alert
        playNewsWarningTone();
      }
    });
  });
}

// Request browser notification permission (must be called from a user gesture)
export async function requestNotificationPermission() {
  if (typeof Notification === "undefined") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const result = await Notification.requestPermission();
  return result;
}
