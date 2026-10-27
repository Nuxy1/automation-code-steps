// A money amount as it was typed ("$1,234.56", "1.234,56 €", "USD 99", "(45.00)", "£3k") to a plain number and an
// ISO currency code, so sums and comparisons in the next step work.
// Code by Zapier (JavaScript) Input Data: amount, default_currency (optional, e.g. USD)
// Output: value (a number with two decimals, as text), currency, error

const SYMBOLS = { "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR", "₩": "KRW", "A$": "AUD", "C$": "CAD", "R$": "BRL" };

function parseMoney(raw, defaultCurrency = "") {
  const text = String(raw ?? "").trim();
  if (!text) return { value: "", currency: "", error: "empty" };
  const code = /\b([A-Z]{3})\b/.exec(text)?.[1];
  const symbol = Object.keys(SYMBOLS).sort((a, b) => b.length - a.length).find((each) => text.includes(each));
  const currency = code || (symbol ? SYMBOLS[symbol] : defaultCurrency);
  const negative = /^\(.*\)$/.test(text) || /^-|\s-|-\s*\d/.test(text);
  const thousands = /(\d)\s*k\b/i.test(text) ? 1000 : 1;
  let number = text.replace(/[^\d.,]/g, "");
  const lastDot = number.lastIndexOf(".");
  const lastComma = number.lastIndexOf(",");
  // The separator that comes last is the decimal one, unless it is followed by exactly three digits and is the only
  // kind there is ("1,234" is a thousand; "1,23" is one and a bit).
  const decimal = lastDot > lastComma ? "." : lastComma > lastDot ? "," : "";
  if (decimal) {
    const after = number.length - number.lastIndexOf(decimal) - 1;
    const other = decimal === "." ? "," : ".";
    const onlyKind = !number.includes(other);
    const repeated = number.split(decimal).length > 2;
    if (repeated || (onlyKind && after === 3)) number = number.split(decimal).join("");
    else number = number.split(other).join("").replace(decimal, ".");
  }
  const value = Number(number) * thousands * (negative ? -1 : 1);
  if (!Number.isFinite(value) || number === "") return { value: "", currency, error: `could not read "${text}"` };
  return { value: value.toFixed(2), currency, error: "" };
}

if (typeof inputData !== "undefined") return parseMoney(inputData.amount, inputData.default_currency || "");
module.exports = { parseMoney };
