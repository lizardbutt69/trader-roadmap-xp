import { ECONOMIC_EVENTS } from "../data/economicCalendar2026.js";

// ─── Timezone helpers ────────────────────────────────────────────────────────

// Returns the ET UTC offset string for a given date ("-04:00" EDT or "-05:00" EST)
function getETOffset(dateStr) {
  const testDate = new Date(`${dateStr}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "short",
  }).formatToParts(testDate);
  const tzName = parts.find((p) => p.type === "timeZoneName")?.value || "EST";
  return tzName === "EDT" ? "-04:00" : "-05:00";
}

// Parses an event into a real Date object (in ET)
export function eventToDate(event) {
  if (event.time === "allday") {
    // All-day: treat as midnight ET on that date
    const offset = getETOffset(event.date);
    return new Date(`${event.date}T00:00:00${offset}`);
  }
  const offset = getETOffset(event.date);
  return new Date(`${event.date}T${event.time}:00${offset}`);
}

// Format event time for display in a given timezone
// Returns e.g. "8:30 AM ET" or "9:30 PM BKK"
export function formatEventTime(event, displayTZ) {
  if (event.time === "allday") return "All Day";
  const d = eventToDate(event);
  const tz = displayTZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const timeStr = d.toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  // Short timezone label
  const tzLabel = d.toLocaleTimeString("en-US", {
    timeZone: tz,
    timeZoneName: "short",
  }).split(" ").pop();
  return `${timeStr} ${tzLabel}`;
}

// Format event date for display in a given timezone
// Returns e.g. "Apr 10" adjusted for the display timezone
export function formatEventDate(event, displayTZ) {
  const d = eventToDate(event);
  const tz = displayTZ || Intl.DateTimeFormat().resolvedOptions().timeZone;
  return d.toLocaleDateString("en-US", {
    timeZone: tz,
    month: "short",
    day: "numeric",
  });
}

// ─── Event queries ────────────────────────────────────────────────────────────

// Returns events sorted by date+time ascending
export function getSortedEvents() {
  return [...ECONOMIC_EVENTS].sort((a, b) => eventToDate(a) - eventToDate(b));
}

// Returns the ET date string "YYYY-MM-DD" for a given Date (now)
function toETDateStr(now) {
  return now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).split("/").reverse().join("-").replace(/(\d{4})-(\d{2})-(\d{2})/, "$1-$2-$3");
}

// Correctly formats "MM/DD/YYYY" → "YYYY-MM-DD"
function usDateToISO(usDate) {
  const [m, d, y] = usDate.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

export function getTodayET(now = new Date()) {
  const usDate = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return usDateToISO(usDate);
}

// Returns events for today (ET date)
export function getEventsForToday(now = new Date()) {
  const today = getTodayET(now);
  return ECONOMIC_EVENTS.filter((e) => e.date === today);
}

// Returns Mon–Fri events for the week containing `now` (in ET)
export function getEventsForWeek(now = new Date()) {
  // Get current ET day of week (0=Sun, 1=Mon, … 6=Sat)
  const etDow = parseInt(
    now.toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    }).replace("Sun", "0").replace("Mon", "1").replace("Tue", "2")
      .replace("Wed", "3").replace("Thu", "4").replace("Fri", "5").replace("Sat", "6"),
    10
  );

  // Simpler: get Monday of this week
  const etDateStr = getTodayET(now);
  const etDate = new Date(`${etDateStr}T12:00:00`); // noon local to avoid DST edge cases
  const dayOfWeek = etDate.getDay(); // 0=Sun
  const daysToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(etDate);
  monday.setDate(etDate.getDate() + daysToMon);

  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(d.toISOString().slice(0, 10));
  }

  return weekDates.map((dateStr) => ({
    dateStr,
    events: ECONOMIC_EVENTS.filter((e) => e.date === dateStr),
  }));
}

// Returns all events from now through end of current month
export function getUpcomingEvents(now = new Date()) {
  const sorted = getSortedEvents();
  return sorted.filter((e) => {
    if (e.time === "allday") return e.date >= getTodayET(now);
    return eventToDate(e) >= now;
  });
}

// Returns the next upcoming high or medium event from now
export function getNextEvent(now = new Date(), impactFilter = ["high", "medium"]) {
  const sorted = getSortedEvents();
  return sorted.find((e) => {
    if (!impactFilter.includes(e.impact)) return false;
    if (e.time === "allday") return false; // all-day events don't have a specific trigger time
    return eventToDate(e) > now;
  }) || null;
}

// Returns the next HIGH-impact event specifically
export function getNextHighImpactEvent(now = new Date()) {
  return getNextEvent(now, ["high"]);
}

// Minutes until event from now (negative = event already passed)
export function getMinutesUntil(event, now = new Date()) {
  if (event.time === "allday") return null;
  return Math.round((eventToDate(event) - now) / 60000);
}

// Is there a high-impact news event within ±N minutes of now?
export function isNewsRisk(now = new Date(), windowMinutes = 30) {
  const sorted = getSortedEvents().filter((e) => e.impact === "high" && e.time !== "allday");
  return sorted.find((e) => {
    const mins = getMinutesUntil(e, now);
    return mins !== null && mins >= -10 && mins <= windowMinutes;
  }) || null;
}
