const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildListingQuery,
  buildMintPayload,
  filterAndSortListings,
  getTokenStripValues,
  normalizeStatusFilterValue,
  renderListingCard
} = require("../public/app-helpers.js");

test("maps active filter to available for API compatibility", () => {
  assert.equal(normalizeStatusFilterValue("active"), "available");
  assert.equal(normalizeStatusFilterValue("sold"), "sold");
});

test("builds listing query with search, normalized status, and sort", () => {
  const params = new URLSearchParams(buildListingQuery({
    search: "gamma",
    status: "active",
    type: "collectible",
    sort: "newest"
  }));

  assert.equal(params.get("search"), "gamma");
  assert.equal(params.get("status"), "available");
  assert.equal(params.get("type"), "collectible");
  assert.equal(params.get("sort"), "newest");
});

test("filters and sorts listings by real listedAt timestamps", () => {
  const listings = [
    { id: "1", name: "Alpha", price: 25, type: "stamp", status: "available", listedAt: "2026-03-12T14:38:49.410Z" },
    { id: "2", name: "Beta", price: 0, type: "stamp", status: "sold", listedAt: "2026-03-12T14:41:41.513Z" },
    { id: "3", name: "Gamma", price: 99, type: "limited", status: "available", listedAt: "2026-03-12T14:41:42.917Z" },
    { id: "4", name: "Delta", price: 10, type: "collectible", status: "available", listedAt: "2026-03-12T14:41:44.213Z" }
  ];

  const available = filterAndSortListings(listings, { status: "active" });
  assert.deepEqual(available.map(item => item.id), ["1", "3", "4"]);

  const newest = filterAndSortListings(listings, { sort: "newest" });
  assert.deepEqual(newest.map(item => item.id), ["4", "3", "2", "1"]);

  const search = filterAndSortListings(listings, { search: "gamma" });
  assert.deepEqual(search.map(item => item.id), ["3"]);

  const priceAsc = filterAndSortListings(listings, { sort: "price-asc" });
  assert.deepEqual(priceAsc.map(item => item.id), ["2", "4", "1", "3"]);
});

test("renders sold listings with explicit sold treatment", () => {
  const html = renderListingCard({
    id: "2",
    name: "Sold Listing",
    price: 0,
    type: "stamp",
    sellerId: "seller-1",
    status: "sold"
  });

  assert.match(html, /listing-sold/);
  assert.match(html, /Sold/);
  assert.match(html, /seller-1/);
});

test("falls back correctly when token strip fields are partially missing", () => {
  const values = getTokenStripValues({
    name: "StampCoin",
    symbol: "STP",
    totalSupply: 421000000,
    network: "EVM-compatible",
    decimals: 18
  });

  assert.equal(values.name, "StampCoin");
  assert.equal(values.symbol, "STP");
  assert.equal(values.chain, "EVM-compatible");
  assert.equal(values.decimals, "18");
  assert.equal(values.circulating, "421M");
  assert.equal(values.max, "421M");
});

test("builds mint payload with backend-compatible field names", () => {
  const payload = buildMintPayload("0xabc", 1000);
  assert.deepEqual(payload, { toAddress: "0xabc", amount: 1000 });
});