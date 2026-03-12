const API_ROOT = "/";
const helpers = globalThis.StampcoinAppHelpers;

function apiPath(path) {
    return `${API_ROOT}${path.replace(/^\//, "")}`;
}

async function requestJson(path, options = {}) {
    const response = await fetch(apiPath(path), options);
    let payload;

    try {
        payload = await response.json();
    } catch {
        payload = { error: "Invalid JSON response" };
    }

    if (!response.ok) {
        throw new Error(payload.error || payload.message || `Request failed with ${response.status}`);
    }

    return payload;
}

function escapeHtml(value) {
    return helpers.escapeHtml(value);
}

function formatNumber(value) {
    return helpers.formatNumber(value);
}

function formatDate(value) {
    if (!value) {
        return "--";
    }
    return new Date(value).toLocaleString();
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function renderFeedback(targetId, content, isError = false) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    target.innerHTML = `
        <div class="feedback ${isError ? "error" : "success"}">
            <strong>${isError ? "Request failed" : "Request completed"}</strong>
            <span>${escapeHtml(content)}</span>
        </div>
    `;
}

function renderJson(targetId, payload, title) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    const heading = title ? `<div class="feedback success"><strong>${escapeHtml(title)}</strong><span>Live response payload</span></div>` : "";
    target.innerHTML = `${heading}<div class="json-panel"><pre>${escapeHtml(JSON.stringify(payload, null, 2))}</pre></div>`;
}

function renderTable(targetId, columns, rows) {
    const target = document.getElementById(targetId);
    if (!target) {
        return;
    }

    if (!rows || rows.length === 0) {
        target.innerHTML = '<div class="empty-state">No records returned.</div>';
        return;
    }

    const head = columns.map(column => `<th>${escapeHtml(column.label)}</th>`).join("");
    const body = rows.map(row => {
        const cells = columns.map(column => `<td>${escapeHtml(column.render(row))}</td>`).join("");
        return `<tr>${cells}</tr>`;
    }).join("");

    target.innerHTML = `<div class="table-panel"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

async function refreshHeroMetrics() {
    try {
        const [items, transactions, token, health] = await Promise.all([
            requestJson("api/market/items"),
            requestJson("api/market/transactions"),
            requestJson("api/token"),
            requestJson("health")
        ]);

        setText("metricListings", formatNumber(Array.isArray(items) ? items.length : 0));
        setText("metricTransactions", formatNumber(Array.isArray(transactions) ? transactions.length : 0));
        setText("metricSupply", formatNumber(token.totalSupply));
        setText("metricVersion", health.version || token.version || "2.0.0");

        const pill = document.getElementById("heroHealthPill");
        if (pill) {
            pill.textContent = health.status === "ok" ? "Live" : health.status || "Unknown";
            pill.classList.remove("status-warn");
            pill.classList.add(health.status === "ok" ? "status-ok" : "status-warn");
        }
    } catch (error) {
        setText("metricListings", "--");
        setText("metricTransactions", "--");
        setText("metricSupply", "--");
        setText("metricVersion", "--");
        const pill = document.getElementById("heroHealthPill");
        if (pill) {
            pill.textContent = "Degraded";
            pill.classList.remove("status-ok");
            pill.classList.add("status-warn");
        }
        console.error(error);
    }
}

async function loadListings() {
    const target = document.getElementById("featuredListings");
    const label = document.getElementById("listingCountLabel");

    if (!target) return;

    target.innerHTML = '<div class="empty-state">Loading featured listings...</div>';

    try {
        const searchVal = (document.getElementById("filterSearch")?.value || "").trim();
        const typeVal = document.getElementById("filterType")?.value || "";
        const statusVal = document.getElementById("filterStatus")?.value || "";
        const sortVal = document.getElementById("filterSort")?.value || "";

        const qs = helpers.buildListingQuery({
            search: searchVal,
            type: typeVal,
            status: statusVal,
            sort: sortVal
        });

        const items = await requestJson(`api/market/items${qs ? `?${qs}` : ""}`);
        const listings = helpers.filterAndSortListings(Array.isArray(items) ? items : [], {
            search: searchVal,
            type: typeVal,
            status: statusVal,
            sort: sortVal
        });

        if (label) label.textContent = `${listings.length} item${listings.length === 1 ? "" : "s"}`;

        if (!listings.length) {
            target.innerHTML = '<div class="listing-empty">No listings match your filters. Try adjusting them or publish a new item below.</div>';
            return;
        }

        target.innerHTML = listings.map(item => helpers.renderListingCard(item)).join("");
    } catch (error) {
        if (label) label.textContent = "Unable to load";
        target.innerHTML = `<div class="listing-empty">${escapeHtml(error.message)}</div>`;
    }
}

async function loadMarketTransactions() {
    try {
        const data = await requestJson("api/market/transactions");
        renderTable(
            "marketTxResult",
            [
                { label: "Buyer", render: row => row.buyerId || "--" },
                { label: "Seller", render: row => row.sellerId || "--" },
                { label: "Price", render: row => formatNumber(row.price || 0) },
                { label: "Date", render: row => formatDate(row.timestamp) }
            ],
            Array.isArray(data) ? data : []
        );
    } catch (error) {
        renderFeedback("marketTxResult", error.message, true);
    }
}

async function loadHealth() {
    try {
        const health = await requestJson("health");
        renderTable(
            "healthResult",
            [
                { label: "Metric", render: row => row.label },
                { label: "Value", render: row => row.value }
            ],
            [
                { label: "Status", value: health.status },
                { label: "Service", value: health.service },
                { label: "Version", value: health.version },
                { label: "Timestamp", value: formatDate(health.timestamp) }
            ]
        );
    } catch (error) {
        renderFeedback("healthResult", error.message, true);
    }
}

function registerSubmit(formId, handler) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener("submit", handler);
    }
}

    // ── Admin token helpers ───────────────────────────────────────────────────────
    function getAdminToken() {
        return sessionStorage.getItem("stp_admin_token") || "";
    }

    function setAdminToken(token) {
        sessionStorage.setItem("stp_admin_token", token);
    }

    function clearAdminToken() {
        sessionStorage.removeItem("stp_admin_token");
    }

    async function adminRequest(path, options = {}) {
        const token = getAdminToken();
        if (!token) {
            throw new Error("Admin session not active. Enter your sync token first.");
        }
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
            ...(options.headers || {})
        };
        return requestJson(path, { ...options, headers });
    }

    function updateAdminUI(unlocked) {
        const gate = document.getElementById("adminGate");
        const console_ = document.getElementById("adminConsole");
        const pill = document.getElementById("adminStatusPill");
        if (gate) gate.hidden = unlocked;
        if (console_) console_.hidden = !unlocked;
        if (pill) {
            pill.innerHTML = unlocked
                ? '<i class="fa-solid fa-unlock"></i> Unlocked'
                : '<i class="fa-solid fa-lock"></i> Locked';
            pill.style.background = unlocked ? "rgba(15,143,111,0.14)" : "";
            pill.style.color = unlocked ? "var(--green)" : "";
        }
    }

    // ── Token distribution strip ──────────────────────────────────────────────────
    async function loadTokenDist() {
        try {
            const token = await requestJson("api/token");
            const summary = helpers.getTokenStripValues(token);
            setText("distName", summary.name);
            setText("distSymbol", summary.symbol);
            setText("distCirculating", summary.circulating);
            setText("distMax", summary.max);
            setText("distChain", summary.chain);
            setText("distDecimals", summary.decimals);
        } catch {
            // non-critical — strip stays at defaults
        }
    }

document.addEventListener("DOMContentLoaded", () => {
    registerSubmit("createWalletForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("userId").value.trim();
        const userName = document.getElementById("userName").value.trim();

        try {
            const payload = await requestJson("api/wallet/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, userName })
            });
            renderJson("createWalletResult", payload, "Wallet created successfully");
            event.target.reset();
            refreshHeroMetrics();
        } catch (error) {
            renderFeedback("createWalletResult", error.message, true);
        }
    });

    registerSubmit("viewWalletForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("viewUserId").value.trim();

        try {
            const payload = await requestJson(`api/wallet/${encodeURIComponent(userId)}`);
            renderJson("viewWalletResult", payload, "Wallet details");
        } catch (error) {
            renderFeedback("viewWalletResult", error.message, true);
        }
    });

    registerSubmit("transferForm", async event => {
        event.preventDefault();
        const fromUserId = document.getElementById("fromUserId").value.trim();
        const toUserId = document.getElementById("toUserId").value.trim();
        const amount = Number(document.getElementById("transferAmount").value);

        try {
            const payload = await requestJson("api/wallet/transfer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromUserId, toUserId, amount })
            });
            renderJson("transferResult", payload, "Transfer completed");
            event.target.reset();
            refreshHeroMetrics();
        } catch (error) {
            renderFeedback("transferResult", error.message, true);
        }
    });

    registerSubmit("transactionsForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("txUserId").value.trim();

        try {
            const payload = await requestJson(`api/wallet/${encodeURIComponent(userId)}/transactions`);
            renderTable(
                "transactionsResult",
                [
                    { label: "From", render: row => row.from || "--" },
                    { label: "To", render: row => row.to || "--" },
                    { label: "Amount", render: row => formatNumber(row.amount || 0) },
                    { label: "Status", render: row => row.status || "--" },
                    { label: "Date", render: row => formatDate(row.timestamp) }
                ],
                Array.isArray(payload) ? payload : []
            );
        } catch (error) {
            renderFeedback("transactionsResult", error.message, true);
        }
    });

    registerSubmit("listItemForm", async event => {
        event.preventDefault();
        const sellerId = document.getElementById("sellerId").value.trim();
        const name = document.getElementById("itemName").value.trim();
        const price = Number(document.getElementById("itemPrice").value);
        const type = document.getElementById("itemType").value.trim();
        const description = document.getElementById("itemDesc").value.trim();

        try {
            const payload = await requestJson("api/market/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sellerId, name, price, type, description })
            });
            renderJson("listItemResult", payload, "Listing published");
            event.target.reset();
            await loadListings();
            refreshHeroMetrics();
        } catch (error) {
            renderFeedback("listItemResult", error.message, true);
        }
    });

    registerSubmit("buyItemForm", async event => {
        event.preventDefault();
        const itemId = document.getElementById("buyItemId").value.trim();
        const buyerId = document.getElementById("buyerId").value.trim();

        try {
            const payload = await requestJson(`api/market/items/${encodeURIComponent(itemId)}/buy`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ buyerId })
            });
            renderJson("buyItemResult", payload, "Purchase completed");
            event.target.reset();
            await Promise.all([loadListings(), loadMarketTransactions(), refreshHeroMetrics()]);
        } catch (error) {
            renderFeedback("buyItemResult", error.message, true);
        }
    });

    registerSubmit("balanceForm", async event => {
        event.preventDefault();
        const address = document.getElementById("balanceAddress").value.trim();

        try {
            const payload = await requestJson(`api/blockchain/balance/${encodeURIComponent(address)}`);
            renderJson("balanceResult", payload, "Address balance");
        } catch (error) {
            renderFeedback("balanceResult", error.message, true);
        }
    });

    document.getElementById("refreshListingsBtn")?.addEventListener("click", loadListings);
    document.getElementById("marketTxBtn")?.addEventListener("click", loadMarketTransactions);
    document.getElementById("healthBtn")?.addEventListener("click", loadHealth);

    document.getElementById("getTokenBtn")?.addEventListener("click", async () => {
        try {
            renderJson("tokenResult", await requestJson("api/token"), "Token profile");
        } catch (error) {
            renderFeedback("tokenResult", error.message, true);
        }
    });

    document.getElementById("getBlockchainBtn")?.addEventListener("click", async () => {
        try {
            renderJson("blockchainResult", await requestJson("api/blockchain/info"), "Blockchain information");
        } catch (error) {
            renderFeedback("blockchainResult", error.message, true);
        }
    });

    document.getElementById("getSupplyBtn")?.addEventListener("click", async () => {
        try {
            renderJson("supplyResult", await requestJson("api/blockchain/supply"), "Supply information");
        } catch (error) {
            renderFeedback("supplyResult", error.message, true);
        }
    });

    // ── Filter bar live updates ───────────────────────────────────────────────
    ["filterType", "filterStatus", "filterSort"].forEach(id => {
        document.getElementById(id)?.addEventListener("change", loadListings);
    });
    document.getElementById("filterSearch")?.addEventListener("input", () => {
        clearTimeout(window._filterDebounce);
        window._filterDebounce = setTimeout(loadListings, 260);
    });

    // ── Admin unlock / lock ──────────────────────────────────────────────────
    registerSubmit("adminUnlockForm", async event => {
        event.preventDefault();
        const token = document.getElementById("adminTokenInput").value.trim();
        if (!token) {
            renderFeedback("adminUnlockResult", "Token cannot be empty.", true);
            return;
        }
        try {
            const res = await fetch(apiPath("api/wallets"), {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!res.ok) {
                throw new Error("Token rejected");
            }
            setAdminToken(token);
            updateAdminUI(true);
            event.target.reset();
        } catch {
            renderFeedback("adminUnlockResult", "Token rejected — check your SYNC_TOKEN value.", true);
        }
    });

    document.getElementById("adminLockBtn")?.addEventListener("click", () => {
        clearAdminToken();
        updateAdminUI(false);
    });

    if (getAdminToken()) {
        updateAdminUI(true);
    }

    // ── Admin: all wallets ────────────────────────────────────────────────────
    document.getElementById("adminAllWalletsBtn")?.addEventListener("click", async () => {
        try {
            const data = await adminRequest("api/wallets");
            renderTable(
                "adminWalletsResult",
                [
                    { label: "User ID", render: r => r.userId || "--" },
                    { label: "Name", render: r => r.userName || "--" },
                    { label: "Balance", render: r => formatNumber(r.balance || 0) },
                    { label: "Stamps", render: r => Array.isArray(r.stamps) ? String(r.stamps.length) : "0" }
                ],
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            renderFeedback("adminWalletsResult", error.message, true);
        }
    });

    // ── Admin: top-up ─────────────────────────────────────────────────────────
    registerSubmit("adminTopupForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("adminTopupUserId").value.trim();
        const amount = Number(document.getElementById("adminTopupAmount").value);
        try {
            const payload = await adminRequest(`api/wallet/${encodeURIComponent(userId)}/topup`, {
                method: "POST",
                body: JSON.stringify({ amount })
            });
            renderJson("adminTopupResult", payload, "Top-up applied");
            event.target.reset();
        } catch (error) {
            renderFeedback("adminTopupResult", error.message, true);
        }
    });

    // ── Admin: mint tokens ────────────────────────────────────────────────────
    registerSubmit("adminMintForm", async event => {
        event.preventDefault();
        const to = document.getElementById("adminMintTo").value.trim();
        const amount = Number(document.getElementById("adminMintAmount").value);
        try {
            const payload = await adminRequest("api/blockchain/mint", {
                method: "POST",
                body: JSON.stringify(helpers.buildMintPayload(to, amount))
            });
            renderJson("adminMintResult", payload, "Mint completed");
            event.target.reset();
            refreshHeroMetrics();
        } catch (error) {
            renderFeedback("adminMintResult", error.message, true);
        }
    });

    // ── Admin: mint events ────────────────────────────────────────────────────
    document.getElementById("adminMintEventsBtn")?.addEventListener("click", async () => {
        try {
            const data = await adminRequest("api/blockchain/mint/events");
            renderTable(
                "adminMintEventsResult",
                [
                    { label: "To", render: r => r.to || "--" },
                    { label: "Amount", render: r => formatNumber(r.amount || 0) },
                    { label: "Date", render: r => formatDate(r.timestamp) }
                ],
                Array.isArray(data) ? data : []
            );
        } catch (error) {
            renderFeedback("adminMintEventsResult", error.message, true);
        }
    });

    // ── Admin: add stamp ──────────────────────────────────────────────────────
    registerSubmit("adminAddStampForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("adminStampUserId").value.trim();
        const stampId = document.getElementById("adminStampId").value.trim();
        const name = document.getElementById("adminStampName").value.trim();
        try {
            const payload = await adminRequest(`api/wallet/${encodeURIComponent(userId)}/stamps`, {
                method: "POST",
                body: JSON.stringify({ stampId, name })
            });
            renderJson("adminAddStampResult", payload, "Stamp added to wallet");
            event.target.reset();
            refreshHeroMetrics();
        } catch (error) {
            renderFeedback("adminAddStampResult", error.message, true);
        }
    });

    refreshHeroMetrics();
    loadListings();
    loadHealth();
    loadTokenDist();
});
