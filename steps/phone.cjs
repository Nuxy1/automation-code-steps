// Phone number to E.164 (+15550104477), the format CRMs, Twilio and WhatsApp want.
// Code by Zapier (JavaScript) Input Data: phone, country_code (optional, default 1)
// Output: phone (E.164, or "" if there are too few digits), valid ("true"/"false")

function normalizePhone(raw, countryCode = "1") {
  const text = String(raw ?? "").trim();
  const digits = text.replace(/\D/g, "");
  if (digits.length < 7) return "";
  let e164;
  if (text.startsWith("+")) e164 = `+${digits}`;
  else if (digits.startsWith("00")) e164 = `+${digits.slice(2)}`;
  else if (digits.startsWith("0")) e164 = `+${countryCode}${digits.slice(1)}`; // (a national number's trunk 0)
  else if (digits.length <= 10) e164 = `+${countryCode}${digits}`;
  else e164 = `+${digits}`;
  return e164.length <= 16 ? e164 : ""; // (E.164 allows 15 digits)
}

if (typeof inputData !== "undefined") {
  const phone = normalizePhone(inputData.phone, (inputData.country_code || "1").replace(/\D/g, ""));
  return { phone, valid: String(phone !== "") };
}
module.exports = { normalizePhone };
