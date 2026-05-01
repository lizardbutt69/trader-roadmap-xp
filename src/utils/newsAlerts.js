import { getSortedEvents, getMinutesUntil, formatEventTime } from "./calendarUtils.js";

// Module-level set — tracks which alerts already fired this session
const firedAlerts = new Set();

// Call this on a 30-second interval from the main app.
// alertMinutes: array of minute thresholds to fire at (e.g. [30, 15])
export function checkNewsAlerts(now, addToast, displayTZ, alertMinutes = [30, 15]) {
  const highImpact = getSortedEvents().filter(
    (e) => e.impact === "high" && e.time !== "allday"
  );
  let alertsEnabled = false;
  try { alertsEnabled = localStorage.getItem("newsAlertsEnabled") === "true"; } catch {}

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
