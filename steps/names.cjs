// A full name split into first / middle / last, with titles and suffixes set aside and SHOUTED or lower-case names
// put in proper case (keeping particles like "van der", and names like O'Neil, McDonald, Smith-Jones).
// Code by Zapier (JavaScript) Input Data: name
// Output: first, middle, last, prefix, suffix, full

const PREFIXES = new Set(["mr", "mrs", "ms", "miss", "mx", "dr", "prof", "rev", "sir"]);
const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "phd", "md", "esq"]);
const PARTICLES = new Set(["van", "von", "der", "den", "de", "del", "della", "da", "di", "la", "le", "bin", "al"]);

function properCase(word) {
  if (/^(ii|iii|iv)$/i.test(word)) return word.toUpperCase();
  return word.toLowerCase()
    .replace(/(^|[-'])(\p{L})/gu, (_, mark, letter) => mark + letter.toUpperCase())
    .replace(/^Mc(\p{L})/u, (_, letter) => `Mc${letter.toUpperCase()}`);
}

function splitName(raw) {
  let words = String(raw ?? "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const bare = (word) => word.toLowerCase().replace(/\./g, "").replace(/,$/, "");
  let prefix = "";
  let suffix = "";
  if (words.length > 1 && PREFIXES.has(bare(words[0]))) prefix = words.shift().replace(/,$/, "");
  if (words.length > 1 && SUFFIXES.has(bare(words.at(-1)))) suffix = words.pop();
  words = words.map((word) => word.replace(/,$/, ""));
  // (a mixed-case name is kept as typed; only an all-caps or all-lower one is re-cased)
  const typed = words.join(" ");
  const recase = typed === typed.toUpperCase() || typed === typed.toLowerCase();
  const cased = words.map((word) => (PARTICLES.has(word.toLowerCase()) ? word.toLowerCase() : recase ? properCase(word) : word));
  if (cased.length === 0) return { first: "", middle: "", last: "", prefix, suffix, full: "" };
  // (one name after a title is the surname: "Dr. Patel")
  if (cased.length === 1) return prefix ? { first: "", middle: "", last: cased[0], prefix, suffix, full: cased[0] } : { first: cased[0], middle: "", last: "", prefix, suffix, full: cased[0] };
  let lastStart = cased.length - 1;
  while (lastStart > 1 && PARTICLES.has(cased[lastStart - 1].toLowerCase())) lastStart--;
  const first = cased[0];
  const middle = cased.slice(1, lastStart).join(" ");
  const last = cased.slice(lastStart).join(" ");
  return { first, middle, last, prefix, suffix, full: [first, middle, last].filter(Boolean).join(" ") };
}

if (typeof inputData !== "undefined") return splitName(inputData.name);
module.exports = { splitName, properCase };
