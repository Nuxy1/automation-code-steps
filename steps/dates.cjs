// A date as people and old systems write it, read in a named time zone and given back as UTC ISO 8601: what
// Google Sheets, Airtable and every API expect. Daylight-saving changes are handled with the platform's own zone data.
// Code by Zapier (JavaScript) Input Data: date, time_zone (IANA, e.g. America/Chicago; default UTC), order ("MDY" or "DMY")
// Output: iso (UTC), date_only (YYYY-MM-DD in the zone), error ("" when read)

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, sept: 9, oct: 10, nov: 11, dec: 12 };

// How far `timeZone` is ahead of UTC at the instant `ms`, in ms.
function zoneOffset(ms, timeZone) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(new Date(ms)).map((part) => [part.type, Number(part.value)]));
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - Math.floor(ms / 1000) * 1000;
}

function clock(text) {
  const match = /(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?/i.exec(text);
  if (!match) return [0, 0, 0];
  let hour = Number(match[1]);
  const half = match[4]?.toLowerCase()[0];
  if (half === "p" && hour < 12) hour += 12;
  if (half === "a" && hour === 12) hour = 0;
  return [hour, Number(match[2]), Number(match[3] ?? 0)];
}

// The wall-clock fields written in `text`, or null.
function readFields(text, order = "MDY") {
  let match;
  if ((match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(text))) return [Number(match[1]), Number(match[2]), Number(match[3]), ...clock(text.slice(10))];
  if ((match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(text))) {
    let [, a, b, year] = match.map(Number);
    if (year < 100) year += 2000;
    const dayFirst = order === "DMY" || text[match[1].length] === "." || a > 12;
    return [year, dayFirst ? b : a, dayFirst ? a : b, ...clock(text.slice(match[0].length))];
  }
  const words = text.toLowerCase().replace(/,/g, " ");
  const month = /\b(jan|feb|mar|apr|may|jun|jul|aug|sept?|oct|nov|dec)[a-z]*\.?/.exec(words);
  const year = /\b(\d{4})\b/.exec(words);
  if (month && year) {
    const day = /\b(\d{1,2})(?:st|nd|rd|th)?\b(?!:)/.exec(words.replace(year[0], " "));
    if (day) return [Number(year[1]), MONTHS[month[1]], Number(day[1]), ...clock(words)];
  }
  return null;
}

function toUtcIso(raw, timeZone = "UTC", order = "MDY") {
  const text = String(raw ?? "").trim();
  if (!text) return { iso: "", date_only: "", error: "empty" };
  // (already carries its own offset or Z: nothing to guess)
  if (/^\d{4}-\d{2}-\d{2}T[\d:.]+(Z|[+-]\d{2}:?\d{2})$/i.test(text)) {
    const iso = new Date(text).toISOString();
    return { iso, date_only: localDate(Date.parse(iso), timeZone), error: "" };
  }
  const fields = readFields(text, order);
  if (!fields) return { iso: "", date_only: "", error: `could not read "${text}"` };
  const [year, month, day, hour, minute, second] = fields;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return { iso: "", date_only: "", error: `not a real date: "${text}"` };
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  if (new Date(wall).getUTCDate() !== day) return { iso: "", date_only: "", error: `not a real date: "${text}"` };
  const guess = wall - zoneOffset(wall, timeZone);
  const settled = wall - zoneOffset(guess, timeZone); // (again from the guess: right across a daylight-saving change)
  // (a wall time the clocks skipped, 2:30 on the spring-forward night, reads as the hour after, as most tools do)
  const utc = settled + zoneOffset(settled, timeZone) === wall ? settled : guess;
  return { iso: new Date(utc).toISOString(), date_only: localDate(utc, timeZone), error: "" };
}

function localDate(ms, timeZone) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(ms));
}

if (typeof inputData !== "undefined") return toUtcIso(inputData.date, inputData.time_zone || "UTC", (inputData.order || "MDY").toUpperCase());
module.exports = { toUtcIso, zoneOffset };
