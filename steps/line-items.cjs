// An order's line items (the JSON array Shopify, WooCommerce and Stripe send) turned into what no-code tools can use:
// parallel comma lists (Zapier's line-item format, so "Create Spreadsheet Rows" makes one row per item), a one-cell
// summary, and totals.
// Code by Zapier (JavaScript) Input Data: items (the JSON text of the array)
// Output: titles, skus, quantities, prices (comma lists), summary, item_count, subtotal, error

function flattenItems(raw) {
  let items;
  try {
    items = typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (error) {
    return { titles: "", skus: "", quantities: "", prices: "", summary: "", item_count: "0", subtotal: "0.00", error: `not JSON: ${error.message}` };
  }
  if (!Array.isArray(items)) items = items?.line_items ?? items?.data ?? [];
  const rows = items.map((item) => ({
    title: String(item.title ?? item.name ?? item.description ?? "").replace(/,/g, " "),
    sku: String(item.sku ?? item.price?.product ?? ""),
    quantity: Number(item.quantity ?? 1),
    // (Shopify and WooCommerce give a unit price as text; Stripe gives unit_amount in cents)
    price: item.price?.unit_amount !== undefined ? item.price.unit_amount / 100 : Number(item.price ?? item.unit_price ?? 0),
  }));
  const subtotal = rows.reduce((sum, row) => sum + row.quantity * row.price, 0);
  return {
    titles: rows.map((row) => row.title).join(","),
    skus: rows.map((row) => row.sku).join(","),
    quantities: rows.map((row) => row.quantity).join(","),
    prices: rows.map((row) => row.price.toFixed(2)).join(","),
    summary: rows.map((row) => `${row.quantity} x ${row.title}`).join("; "),
    item_count: String(rows.reduce((sum, row) => sum + row.quantity, 0)),
    subtotal: subtotal.toFixed(2),
    error: "",
  };
}

if (typeof inputData !== "undefined") return flattenItems(inputData.items);
module.exports = { flattenItems };
