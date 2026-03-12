(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }

  root.StampcoinAppHelpers = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatNumber(value) {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return "--";
    }

    return new Intl.NumberFormat("en-US", {
      notation: numeric > 999999 ? "compact" : "standard"
    }).format(numeric);
  }

  function normalizeFilterValue(value) {
    return String(value ?? "").trim().toLowerCase();
  }

  function normalizeStatusFilterValue(value) {
    const normalized = normalizeFilterValue(value);
    if (normalized === "active") {
      return "available";
    }

    return normalized;
  }

  function buildListingQuery(filters = {}) {
    const params = new URLSearchParams();
    const search = String(filters.search ?? "").trim();
    const type = normalizeFilterValue(filters.type);
    const status = normalizeStatusFilterValue(filters.status);
    const sort = normalizeFilterValue(filters.sort);

    if (search) params.set("search", search);
    if (type) params.set("type", type);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);

    return params.toString();
  }

  function getListingTimestamp(item) {
    return new Date(item?.listedAt || item?.timestamp || 0).getTime();
  }

  function filterAndSortListings(items, filters = {}) {
    const search = String(filters.search ?? "").trim().toLowerCase();
    const type = normalizeFilterValue(filters.type);
    const status = normalizeStatusFilterValue(filters.status);
    const sort = normalizeFilterValue(filters.sort);

    let next = Array.isArray(items) ? [...items] : [];

    if (type) {
      next = next.filter(item => normalizeFilterValue(item?.type) === type);
    }

    if (status) {
      next = next.filter(item => normalizeFilterValue(item?.status) === status);
    }

    if (search) {
      next = next.filter(item => {
        return [item?.id, item?.name, item?.description, item?.sellerId, item?.type]
          .filter(Boolean)
          .some(value => String(value).toLowerCase().includes(search));
      });
    }

    if (sort === "price-asc") {
      next.sort((left, right) => Number(left?.price || 0) - Number(right?.price || 0));
    }

    if (sort === "price-desc") {
      next.sort((left, right) => Number(right?.price || 0) - Number(left?.price || 0));
    }

    if (sort === "newest") {
      next.sort((left, right) => getListingTimestamp(right) - getListingTimestamp(left));
    }

    if (sort === "oldest") {
      next.sort((left, right) => getListingTimestamp(left) - getListingTimestamp(right));
    }

    return next;
  }

  const TYPE_GRADIENT = {
    stamp: "linear-gradient(135deg,#10325d 0%,#2d67c8 100%)",
    collectible: "linear-gradient(135deg,#7c4a0c 0%,#c98b2a 100%)",
    limited: "linear-gradient(135deg,#6b1212 0%,#c25454 100%)"
  };

  const TYPE_ICON = {
    stamp: "fa-stamp",
    collectible: "fa-gem",
    limited: "fa-fire"
  };

  const TYPE_BADGE = {
    stamp: "background:rgba(16,50,93,0.12);color:var(--navy)",
    collectible: "background:rgba(201,139,42,0.14);color:var(--gold)",
    limited: "background:rgba(194,84,84,0.12);color:var(--red)"
  };

  function renderListingCard(item) {
    const type = normalizeFilterValue(item?.type) || "collectible";
    const gradient = TYPE_GRADIENT[type] || "linear-gradient(135deg,#2a3848 0%,#44546f 100%)";
    const icon = TYPE_ICON[type] || "fa-tag";
    const badge = TYPE_BADGE[type] || "background:rgba(17,35,63,0.07);color:var(--ink-soft)";
    const sold = normalizeFilterValue(item?.status) === "sold";

    return `
      <article class="listing-card${sold ? " listing-sold" : ""}">
        <div class="listing-img" style="background:${gradient}">
          <i class="fa-solid ${icon}"></i>
          ${sold ? '<span class="sold-overlay">Sold</span>' : ""}
        </div>
        <div class="listing-body">
          <span class="listing-type" style="${badge}">${escapeHtml(item?.type || "collectible")}</span>
          <h4>${escapeHtml(item?.name || "Untitled Item")}</h4>
          <p>${escapeHtml(item?.description || "No description provided for this listing.")}</p>
          <div class="listing-meta">
            <div>
              <div class="listing-price">${formatNumber(item?.price || 0)} STP</div>
              <small>Seller: ${escapeHtml(item?.sellerId || "unknown")}</small>
            </div>
            <span class="json-chip">${escapeHtml(item?.status || "available")}</span>
          </div>
        </div>
      </article>
    `;
  }

  function getTokenStripValues(token = {}) {
    const totalSupply = token.totalSupply ?? token.circulatingSupply ?? token.maxSupply;

    return {
      name: token.name || "--",
      symbol: token.symbol || "--",
      circulating: formatNumber(token.circulatingSupply ?? totalSupply),
      max: formatNumber(token.maxSupply ?? totalSupply),
      chain: token.blockchain || token.network || "STP Chain",
      decimals: String(token.decimals ?? "18")
    };
  }

  function buildMintPayload(toAddress, amount) {
    return {
      toAddress: String(toAddress ?? "").trim(),
      amount: Number(amount)
    };
  }

  return {
    buildListingQuery,
    buildMintPayload,
    escapeHtml,
    filterAndSortListings,
    formatNumber,
    getTokenStripValues,
    normalizeStatusFilterValue,
    renderListingCard
  };
});