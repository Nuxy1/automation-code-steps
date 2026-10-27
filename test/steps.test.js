import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const { normalizePhone } = require("../steps/phone.cjs");
const { splitName } = require("../steps/names.cjs");
const { toUtcIso } = require("../steps/dates.cjs");
const { parseMoney } = require("../steps/money.cjs");
const { flattenItems } = require("../steps/line-items.cjs");

// Each file run as Code by Zapier runs it: the body of an async function given `inputData`, its return the output.
function asZapier(file, inputData) {
  const body = readFileSync(new URL(`../steps/${file}`, import.meta.url), "utf8");
  return new Function("inputData", "module", body)(inputData, undefined);
}

test("phone", () => {
  assert.equal(normalizePhone("(555) 010-4477"), "+15550104477");
  assert.equal(normalizePhone("+44 20 7946 0958"), "+442079460958");
  assert.equal(normalizePhone("020 7946 0958", "44"), "+442079460958");
  assert.equal(normalizePhone("0049 30 123456"), "+4930123456");
  assert.equal(normalizePhone("12345"), "");
  assert.deepEqual(asZapier("phone.cjs", { phone: "555.010.4477" }), { phone: "+15550104477", valid: "true" });
  assert.deepEqual(asZapier("phone.cjs", { phone: "n/a" }), { phone: "", valid: "false" });
});

test("names", () => {
  assert.deepEqual(splitName("JAN VAN DER BERG"), { first: "Jan", middle: "", last: "van der Berg", prefix: "", suffix: "", full: "Jan van der Berg" });
  assert.deepEqual(splitName("dr. mary o'neil-smith jr."), { first: "Mary", middle: "", last: "O'Neil-Smith", prefix: "dr.", suffix: "jr.", full: "Mary O'Neil-Smith" });
  assert.equal(splitName("SEAN MCDONALD").last, "McDonald");
  assert.deepEqual(splitName("Jane Q. Public"), { first: "Jane", middle: "Q.", last: "Public", prefix: "", suffix: "", full: "Jane Q. Public" });
  assert.equal(splitName("Dr. Patel").last, "Patel");
  assert.equal(splitName("  cher ").first, "Cher");
  assert.equal(splitName("").full, "");
  assert.equal(asZapier("names.cjs", { name: "LUCAS DE LA CRUZ III" }).last, "de la Cruz");
});

test("dates", () => {
  assert.equal(toUtcIso("10/27/2026 3:15 PM", "America/Chicago").iso, "2026-10-27T20:15:00.000Z"); // (CDT, -5)
  assert.equal(toUtcIso("12/01/2026 3:15 PM", "America/Chicago").iso, "2026-12-01T21:15:00.000Z"); // (CST, -6)
  assert.equal(toUtcIso("27.10.2026 15:15", "Europe/Berlin").iso, "2026-10-27T14:15:00.000Z"); // (CET after the change)
  assert.equal(toUtcIso("05/03/2026", "UTC", "DMY").date_only, "2026-03-05");
  assert.equal(toUtcIso("Oct 27, 2026 3:15 pm", "America/New_York").iso, "2026-10-27T19:15:00.000Z");
  assert.equal(toUtcIso("27 October 2026", "Asia/Tokyo").iso, "2026-10-26T15:00:00.000Z");
  assert.equal(toUtcIso("2026-10-27T09:15:00-05:00", "America/Chicago").iso, "2026-10-27T14:15:00.000Z");
  assert.equal(toUtcIso("2026-03-08 02:30", "America/Chicago").iso, "2026-03-08T08:30:00.000Z"); // (a time skipped by DST: read as standard)
  assert.match(toUtcIso("02/30/2026").error, /not a real date/);
  assert.match(toUtcIso("soon").error, /could not read/);
  assert.equal(asZapier("dates.cjs", { date: "2026-10-27", time_zone: "Europe/London" }).iso, "2026-10-27T00:00:00.000Z");
});

test("money", () => {
  assert.deepEqual(parseMoney("$1,234.56"), { value: "1234.56", currency: "USD", error: "" });
  assert.deepEqual(parseMoney("1.234,56 €"), { value: "1234.56", currency: "EUR", error: "" });
  assert.equal(parseMoney("1,234").value, "1234.00");
  assert.equal(parseMoney("1,23").value, "1.23");
  assert.equal(parseMoney("1.234.567").value, "1234567.00");
  assert.equal(parseMoney("(45.00)").value, "-45.00");
  assert.equal(parseMoney("-12.5 GBP").currency, "GBP");
  assert.equal(parseMoney("£3k").value, "3000.00");
  assert.equal(parseMoney("A$20").currency, "AUD");
  assert.equal(parseMoney("99", "CAD").currency, "CAD");
  assert.match(parseMoney("free").error, /could not read/);
  assert.deepEqual(asZapier("money.cjs", { amount: "USD 99" }), { value: "99.00", currency: "USD", error: "" });
});

test("line items", () => {
  const shopify = JSON.stringify([{ title: "Mug, ash", sku: "MUG", quantity: 2, price: "18.00" }, { title: "Kit", sku: "KIT", quantity: 1, price: "42.00" }]);
  assert.deepEqual(flattenItems(shopify), {
    titles: "Mug  ash,Kit", skus: "MUG,KIT", quantities: "2,1", prices: "18.00,42.00",
    summary: "2 x Mug  ash; 1 x Kit", item_count: "3", subtotal: "78.00", error: "",
  });
  const stripe = { data: [{ description: "Pro plan", quantity: 1, price: { unit_amount: 4900, product: "prod_1" } }] };
  assert.equal(flattenItems(stripe).subtotal, "49.00");
  assert.equal(flattenItems(stripe).skus, "prod_1");
  assert.match(flattenItems("{oops").error, /not JSON/);
  assert.equal(asZapier("line-items.cjs", { items: shopify }).item_count, "3");
});
