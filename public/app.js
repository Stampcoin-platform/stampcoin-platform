const API_ROOT = "/";
const helpers = globalThis.StampbookAppHelpers || globalThis.StampcoinAppHelpers;

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
    const communityPosts = [];
    let storyItems = [
        { name: "Lina", tag: "New Ottoman Set" },
        { name: "Mazin", tag: "Auction Tonight" },
        { name: "Rama", tag: "NFT Drop" },
        { name: "Yousef", tag: "Rare Cover" }
    ];
    let peopleSuggestions = [
        { name: "Nora Al Collector", role: "Classic Stamps" },
        { name: "Kareem Chain", role: "NFT Curator" },
        { name: "Sahar Philately", role: "Postal Historian" }
    ];
    let trendingTopics = ["#Stampbook", "#RareStamp", "#NFTPhilately", "#P2PEscrow", "#STP"];
    let notificationFilter = "all";
    let notificationCache = { unread: 0, total: 0, notifications: [] };
    let notificationOffset = 0;
    const NOTIFICATION_PAGE_SIZE = 10;

    const NOTIFICATION_ICONS = {
      new_follower: "fa-user-plus",
      post_reaction: "fa-heart",
      post_comment: "fa-comment",
      post_share: "fa-share-nodes",
      group_post: "fa-layer-group",
      group_member_joined: "fa-users",
      friend_request: "fa-handshake",
      friend_request_response: "fa-handshake-simple",
    };
        const THEME_ORDER = ["classic", "pro", "collector"];
        const THEME_LABELS = {
                classic: "Classic",
                pro: "Pro Exchange",
                collector: "Collector"
        };
        const LEFT_RAIL_STORAGE_KEY = "stampbook-left-rail-collapsed";
    const web3State = {
        provider: null,
        signer: null,
        address: null,
        config: null,
        stc: null,
        nft: null,
        stcDecimals: 18
    };

    function renderStories() {
        const rail = document.getElementById("storyRail");
        if (!rail) return;
        const gradients = [
            "linear-gradient(145deg, #245f97, #0d8b9d)",
            "linear-gradient(145deg, #2f4ca5, #1d7cc8)",
            "linear-gradient(145deg, #9b5d1f, #d48f37)",
            "linear-gradient(145deg, #136f5d, #2e9d7f)",
            "linear-gradient(145deg, #6b3d9a, #8f5bc6)"
        ];

        rail.innerHTML = storyItems.map((story, index) => {
            const name = String(story.name || "Collector");
            const initials = name.slice(0, 2).toUpperCase();
            const tag = String(story.tag || "Stampbook update");
            const cover = gradients[index % gradients.length];
            return `
            <article class="story-item" style="background:${cover}">
                <div class="story-overlay"></div>
                <span class="story-avatar">${escapeHtml(initials)}</span>
                <div class="story-copy">
                    <strong>${escapeHtml(name)}</strong>
                    <p>${escapeHtml(tag)}</p>
                </div>
            </article>
        `;
        }).join("");
    }

    function setLeftRailCollapsed(collapsed) {
        const isCollapsed = Boolean(collapsed);
        document.body.classList.toggle("left-rail-collapsed", isCollapsed);
        localStorage.setItem(LEFT_RAIL_STORAGE_KEY, isCollapsed ? "1" : "0");
        const toggle = document.getElementById("leftRailToggleBtn");
        if (toggle) {
            toggle.textContent = isCollapsed ? "Show Left Rail" : "Hide Left Rail";
        }
    }

    function renderPeopleSuggestions() {
        const list = document.getElementById("peopleYouMayKnow");
        if (!list) return;
        list.innerHTML = peopleSuggestions.map(person => `
            <div class="person-row">
                <div>
                    <strong>${escapeHtml(person.name)}</strong>
                    <p>${escapeHtml(person.role)}</p>
                </div>
                <button type="button" data-follow-target="${escapeHtml(person.id || person.name)}">Follow</button>
            </div>
        `).join("");
    }

    function renderTrendingTopics() {
        const ticker = document.getElementById("trendingTicker");
        if (!ticker) return;
        ticker.innerHTML = trendingTopics.map(topic => `<span class="trending-pill">${escapeHtml(topic)}</span>`).join("");
    }

    function renderCommunityFeed() {
        const feed = document.getElementById("communityFeed");
        if (!feed) return;

        if (!communityPosts.length) {
            feed.innerHTML = '<div class="empty-state">No posts yet. Be the first to publish your stamp story.</div>';
            return;
        }

        feed.innerHTML = communityPosts.map(post => {
            const likeCount = Number(post.reactions?.like || 0);
            const loveCount = Number(post.reactions?.love || 0);
            const wowCount = Number(post.reactions?.wow || 0);
            const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;
            const shareCount = Number(post.shares || 0);
            const totalReactions = likeCount + loveCount + wowCount;
            const postId = escapeHtml(post.id || post.createdAt || post.title);
            const author = escapeHtml(post.authorId || "stampbook-user");
            const initials = escapeHtml((post.authorId || "SB").slice(0, 2).toUpperCase());
            return `
            <article class="feed-post" data-post-id="${postId}">
                <div class="feed-head">
                    <div class="feed-author">
                        <span class="feed-avatar">${initials}</span>
                        <span class="feed-author-meta">
                            <strong>${author}</strong>
                            <small>${escapeHtml(formatDate(post.createdAt || Date.now()))} · STP Feed</small>
                        </span>
                    </div>
                    <button class="feed-more" type="button" aria-label="Post options"><i class="fa-solid fa-ellipsis"></i></button>
                </div>
                <h4>${escapeHtml(post.title || "New stamp update")}</h4>
                <p>${escapeHtml(post.body || "")}</p>
                ${post.imageUrl ? `<img src="${escapeHtml(post.imageUrl)}" alt="Stamp preview for ${escapeHtml(post.title || "post")}">` : ""}
                <div class="feed-stats">
                    <span><i class="fa-solid fa-heart"></i> ${totalReactions} reactions</span>
                    <span>${commentCount} comments · ${shareCount} shares</span>
                </div>
                <div class="feed-actions">
                    <button type="button" data-action="like"><i class="fa-regular fa-thumbs-up"></i> Like (${likeCount})</button>
                    <button type="button" data-action="love"><i class="fa-regular fa-heart"></i> Love (${loveCount})</button>
                    <button type="button" data-action="wow"><i class="fa-regular fa-face-surprise"></i> Wow (${wowCount})</button>
                    <button type="button" data-action="share"><i class="fa-solid fa-share"></i> Share (${shareCount})</button>
                </div>
                <form class="feed-comment-form" data-action="comment">
                    <span class="feed-comment-avatar">${initials}</span>
                    <input name="comment" placeholder="Write a public comment..." required>
                    <button type="submit">Post</button>
                </form>
                <div class="feed-comments">
                    ${(post.comments || []).slice(-3).map(comment => `<div class="comment-item"><strong>${escapeHtml(comment.authorId || "user")}</strong><span>${escapeHtml(comment.text || "")}</span></div>`).join("")}
                </div>
            </article>
        `;
        }).join("");
    }

    function setTheme(themeName) {
        const normalized = THEME_ORDER.includes(themeName) ? themeName : "classic";
        document.body.setAttribute("data-theme", normalized);
        localStorage.setItem("stampbook-theme", normalized);
        const label = document.getElementById("themeToggleLabel");
        if (label) {
            label.textContent = THEME_LABELS[normalized] || "Classic";
        }
    }

    function nextTheme(currentTheme) {
        const currentIndex = THEME_ORDER.indexOf(currentTheme);
        if (currentIndex < 0) {
            return THEME_ORDER[0];
        }
        return THEME_ORDER[(currentIndex + 1) % THEME_ORDER.length];
    }

    function getPostByElementTarget(target) {
        const postEl = target.closest(".feed-post");
        if (!postEl) return null;
        const postId = postEl.getAttribute("data-post-id");
        return communityPosts.find(post => String(post.id || post.createdAt || post.title) === String(postId));
    }

    async function loadCommunityPosts() {
        try {
            const rows = await requestJson("api/community/posts");
            communityPosts.length = 0;
            if (Array.isArray(rows)) {
                communityPosts.push(...rows);
            }
            renderCommunityFeed();
        } catch {
            renderCommunityFeed();
        }
    }

    async function loadSocialBootstrap() {
        try {
            const payload = await requestJson("api/social/bootstrap");
            storyItems = Array.isArray(payload.stories) ? payload.stories : storyItems;
            peopleSuggestions = Array.isArray(payload.people) ? payload.people : peopleSuggestions;
            trendingTopics = Array.isArray(payload.trending) ? payload.trending : trendingTopics;
        } catch {
            // Keep defaults if bootstrap is unavailable
        }
        renderStories();
        renderPeopleSuggestions();
        renderTrendingTopics();
    }

    function getActiveUserId() {
        return document.getElementById("profileUserName")?.textContent || "stampbook-user";
    }

    function parseSocialRoute() {
        const hash = (window.location.hash || "").replace(/^#/, "").trim();
        if (hash.startsWith("profile/")) {
            return { view: "profile", value: decodeURIComponent(hash.slice("profile/".length)) };
        }
        if (hash.startsWith("group/")) {
            return { view: "group", value: decodeURIComponent(hash.slice("group/".length)) };
        }
        if (hash === "group") {
            const selected = document.getElementById("groupPostGroupId")?.value || "";
            return { view: "group", value: selected };
        }
        return { view: "feed", value: "" };
    }

    function setSocialView(viewName) {
        const feed = document.getElementById("stampbook-social");
        const profile = document.getElementById("socialProfileView");
        const group = document.getElementById("socialGroupView");
        if (!feed || !profile || !group) return;

        feed.hidden = viewName !== "feed";
        profile.hidden = viewName !== "profile";
        group.hidden = viewName !== "group";
    }

    function renderProfileTimeline(profile) {
        const title = document.getElementById("profileViewTitle");
        const stats = document.getElementById("profileTimelineStats");
        const posts = document.getElementById("profileTimelinePosts");
        if (title) {
            title.textContent = `Profile: ${profile.userId}`;
        }
        if (stats) {
            stats.innerHTML = `
                <div class="json-panel">
                    <pre>${escapeHtml(JSON.stringify(profile.stats || {}, null, 2))}</pre>
                </div>
            `;
        }
        if (!posts) return;
        const rows = Array.isArray(profile.latestPosts) ? profile.latestPosts : [];
        posts.innerHTML = rows.length
            ? rows.map(post => `
                <article class="feed-post">
                    <h4>${escapeHtml(post.title || "Post")}</h4>
                    <p>${escapeHtml(post.body || "")}</p>
                    <div class="mini-row"><span>${escapeHtml(formatDate(post.createdAt))}</span></div>
                </article>
            `).join("")
            : '<div class="empty-state">No profile posts yet.</div>';
    }

    function renderGroupTimeline(group) {
        const title = document.getElementById("groupViewTitle");
        const meta = document.getElementById("groupTimelineMeta");
        const posts = document.getElementById("groupTimelinePosts");
        if (title) {
            title.textContent = `Group: ${group.name || group.id}`;
        }
        if (meta) {
            meta.innerHTML = `
                <div class="feedback success">
                    <strong>${escapeHtml(group.name || "Group")}</strong>
                    <span>${escapeHtml(group.about || "")}</span>
                </div>
                <div class="mini-row"><span>Members</span><strong>${Number((group.members || []).length)}</strong></div>
            `;
        }
        if (!posts) return;
        const rows = Array.isArray(group.posts) ? group.posts : [];
        posts.innerHTML = rows.length
            ? rows.map(post => `
                <article class="feed-post">
                    <h4>${escapeHtml(post.authorId || "member")}</h4>
                    <p>${escapeHtml(post.body || "")}</p>
                    <div class="mini-row"><span>${escapeHtml(formatDate(post.createdAt))}</span></div>
                </article>
            `).join("")
            : '<div class="empty-state">No group posts yet.</div>';
    }

    async function loadProfileTimeline(userId) {
        if (!userId) {
            setSocialView("feed");
            return;
        }
        try {
            const profile = await requestJson(`api/social/profile/${encodeURIComponent(userId)}`);
            renderProfileTimeline(profile);
            setSocialView("profile");
        } catch {
            setSocialView("feed");
        }
    }

    async function loadGroupTimeline(groupId) {
        if (!groupId) {
            setSocialView("feed");
            return;
        }
        try {
            const group = await requestJson(`api/social/groups/${encodeURIComponent(groupId)}`);
            renderGroupTimeline(group);
            setSocialView("group");
        } catch {
            setSocialView("feed");
        }
    }

    async function handleSocialRoute() {
        const route = parseSocialRoute();
        if (route.view === "profile") {
            await loadProfileTimeline(route.value);
            return;
        }
        if (route.view === "group") {
            await loadGroupTimeline(route.value);
            return;
        }
        setSocialView("feed");
    }

    function syncTopNav() {
        const hash = window.location.hash || "#hero";
        const normalizedHash = (hash.startsWith("#profile/") || hash.startsWith("#group/"))
            ? "#stampbook-social"
            : hash;
        const tabs = document.querySelectorAll(".topnav .nav-tab");
        tabs.forEach(tab => {
            const target = tab.getAttribute("data-nav-target") || tab.getAttribute("href") || "";
            const active = target && normalizedHash.startsWith(target);
            tab.classList.toggle("active", active);
        });
    }

    function renderFriendsBoard(payload) {
        const board = document.getElementById("friendsBoard");
        if (!board) return;
        const incoming = Array.isArray(payload?.incoming) ? payload.incoming : [];
        const outgoing = Array.isArray(payload?.outgoing) ? payload.outgoing : [];
        const friends = Array.isArray(payload?.friends) ? payload.friends : [];

        board.innerHTML = `
            <div class="mini-row"><strong>Friends</strong><span>${friends.length}</span></div>
            ${friends.slice(0, 5).map(id => `<div class="mini-row"><span>${escapeHtml(id)}</span></div>`).join("")}
            ${incoming.length ? incoming.map(req => `
                <div class="mini-row" data-request-id="${escapeHtml(req.id)}">
                    <span>${escapeHtml(req.fromUserId)} wants to connect</span>
                    <span class="mini-actions">
                        <button type="button" data-request-action="accept">Accept</button>
                        <button type="button" data-request-action="reject">Reject</button>
                    </span>
                </div>
            `).join("") : ""}
            ${outgoing.length ? `<div class="mini-row"><span>Pending sent: ${outgoing.length}</span></div>` : ""}
        `;
    }

    function renderGroupsList(groups) {
        const list = document.getElementById("groupsList");
        const select = document.getElementById("groupPostGroupId");
        const openGroup = document.getElementById("openGroupViewBtn");
        if (!list || !select) return;

        const rows = Array.isArray(groups) ? groups : [];
        list.innerHTML = rows.length
            ? rows.slice(0, 8).map(group => `
                <div class="mini-row">
                    <span><strong>${escapeHtml(group.name)}</strong> (${Number((group.members || []).length)})</span>
                    <span class="mini-actions">
                        <a class="mini-link" href="#group/${escapeHtml(group.id)}">Open</a>
                        <button type="button" data-group-join="${escapeHtml(group.id)}">Join</button>
                    </span>
                </div>
            `).join("")
            : '<div class="mini-row"><span>No groups yet</span></div>';

        select.innerHTML = rows.length
            ? rows.map(group => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("")
            : '<option value="">No groups</option>';

        if (openGroup && rows.length) {
            openGroup.setAttribute("href", `#group/${encodeURIComponent(rows[0].id)}`);
        }
    }

    function renderNotificationBoard(payload) {
        const board = document.getElementById("notificationBoard");
        const badge = document.getElementById("notificationCountBadge");
        const filterButtons = document.querySelectorAll("#notificationFilters [data-notification-filter]");
        if (!board || !badge) return;

        const notifications = Array.isArray(payload?.notifications) ? payload.notifications : [];
        const unread = Number(payload?.unread || 0);
        const total = Number(payload?.total || notifications.length);
        badge.textContent = String(unread);
        badge.hidden = unread <= 0;

        filterButtons.forEach(button => {
            const selected = button.getAttribute("data-notification-filter") === notificationFilter;
            button.classList.toggle("active", selected);
        });

        const filtered = notifications.filter(row => {
            if (notificationFilter === "unread") {
                return !row.isRead;
            }
            if (notificationFilter === "requests") {
                return String(row.type || "").includes("friend_request");
            }
            return true;
        });

        const rows = filtered.map(row => {
            const meta = row.meta || {};
            const routeHref = meta.groupId
                ? `#group/${encodeURIComponent(meta.groupId)}`
                : meta.followerId || meta.fromUserId
                    ? `#profile/${encodeURIComponent(meta.followerId || meta.fromUserId)}`
                    : "#stampbook-social";
            const iconClass = NOTIFICATION_ICONS[row.type] || "fa-bell";
            const readToggle = row.isRead
                ? `<button type="button" class="btn-icon-sm" data-mark-unread="${escapeHtml(row.id || "")}"><i class="fa-solid fa-envelope" title="Mark as unread"></i></button>`
                : `<button type="button" class="btn-icon-sm" data-mark-read="${escapeHtml(row.id || "")}"><i class="fa-solid fa-envelope-open" title="Mark as read"></i></button>`;
            return `
                <div class="mini-row ${row.isRead ? "" : "unread-notification"}" data-notification-id="${escapeHtml(row.id || "")}">
                    <span class="notification-icon"><i class="fa-solid ${iconClass}"></i></span>
                    <span class="notification-content">
                        <span>${escapeHtml(row.message || row.type || "Notification")}</span>
                        <small>${escapeHtml(formatDate(row.createdAt))}</small>
                    </span>
                    <span class="mini-actions">
                        <a class="mini-link" href="${routeHref}">Open</a>
                        ${readToggle}
                    </span>
                </div>
            `;
        });

        const hasMore = total > notificationOffset + NOTIFICATION_PAGE_SIZE && notificationFilter === "all";
        const loadMoreHtml = hasMore
            ? `<div class="mini-row notification-load-more"><button type="button" id="notifLoadMoreBtn">Load more</button></div>`
            : "";

        board.innerHTML = rows.length
            ? rows.join("") + loadMoreHtml
            : '<div class="mini-row"><span>No notifications yet</span></div>';
    }

    async function loadNotifications(append = false) {
        const userId = getActiveUserId();
        if (!append) {
            notificationOffset = 0;
        }
        try {
            const payload = await requestJson(
                `api/social/notifications/${encodeURIComponent(userId)}?limit=${NOTIFICATION_PAGE_SIZE}&offset=${notificationOffset}`
            );
            if (append) {
                // Merge new rows into existing cache (append at end, dedup by id)
                const existingIds = new Set(notificationCache.notifications.map(r => r.id));
                const newRows = (payload.notifications || []).filter(r => !existingIds.has(r.id));
                notificationCache = {
                    ...payload,
                    notifications: [...notificationCache.notifications, ...newRows]
                };
            } else {
                notificationCache = payload;
            }
            renderNotificationBoard(notificationCache);
        } catch {
            notificationCache = { unread: 0, total: 0, notifications: [] };
            renderNotificationBoard(notificationCache);
        }
    }

    async function loadGroups() {
        try {
            const groups = await requestJson("api/social/groups");
            renderGroupsList(groups);
        } catch {
            renderGroupsList([]);
        }
    }

    async function loadFriendsBoard() {
        const userId = getActiveUserId();
        try {
            const payload = await requestJson(`api/social/friends/${encodeURIComponent(userId)}`);
            renderFriendsBoard(payload);
        } catch {
            renderFriendsBoard({ incoming: [], outgoing: [], friends: [] });
        }
    }

    function appendAiMessage(text, role) {
        const log = document.getElementById("aiLog");
        if (!log) return;
        const item = document.createElement("div");
        item.className = `ai-msg ${role}`;
        item.textContent = text;
        log.appendChild(item);
        log.scrollTop = log.scrollHeight;
    }

    function aiReplyFor(text) {
        const input = text.toLowerCase();
        if (input.includes("wallet") || input.includes("محفظ")) {
            return "For wallet issues: verify user ID, check transfer history in Wallet Lab, and confirm balance before purchase.";
        }
        if (input.includes("nft") || input.includes("mint") || input.includes("سك")) {
            return "NFT mint flow: upload JPG, choose fee currency, review user/platform split, then confirm metadata and ownership.";
        }
        if (input.includes("payment") || input.includes("دفع") || input.includes("fiat")) {
            return "Payment options support STC and selected crypto rails. Fiat gateway can be integrated through a licensed PSP.";
        }
        if (input.includes("problem") || input.includes("issue") || input.includes("مشك")) {
            return "Please provide transaction ID, user ID, and timestamp. I can guide recovery and escalation steps.";
        }
        return "I can help with wallet operations, NFT minting, purchases, trading flow, and p2p escrow safety checks.";
    }

    async function loadAbi(contractName) {
        const response = await fetch(apiPath(`abi/${contractName}.abi.json`));
        if (!response.ok) {
            throw new Error(`ABI not found for ${contractName}`);
        }
        return response.json();
    }

    function ensureWeb3Contracts() {
        if (!web3State.signer || !web3State.stc || !web3State.nft) {
            throw new Error("Connect Web3 wallet first.");
        }
    }

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

    registerSubmit("culturePostForm", async event => {
        event.preventDefault();
        const title = document.getElementById("cultureTitle")?.value.trim();
        const imageUrl = document.getElementById("cultureImage")?.value.trim();
        const body = document.getElementById("cultureBody")?.value.trim();

        try {
            await requestJson("api/community/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    body,
                    imageUrl,
                    authorId: document.getElementById("profileUserName")?.textContent || "collector-pro"
                })
            });
            await loadCommunityPosts();
            renderFeedback("culturePostResult", "Post published to community feed.", false);
            event.target.reset();
        } catch (error) {
            renderFeedback("culturePostResult", error.message, true);
        }
    });

    registerSubmit("stampbookComposerForm", async event => {
        event.preventDefault();
        const body = document.getElementById("sbPostText")?.value.trim();
        const imageUrl = document.getElementById("sbPostImage")?.value.trim();
        const authorId = document.getElementById("profileUserName")?.textContent || "stampbook-user";

        try {
            await requestJson("api/community/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "Stampbook post",
                    body,
                    imageUrl,
                    authorId
                })
            });
            await loadCommunityPosts();
            renderFeedback("stampbookComposerResult", "Published to Stampbook feed.", false);
            event.target.reset();
        } catch (error) {
            renderFeedback("stampbookComposerResult", error.message, true);
        }
    });

    document.getElementById("communityFeed")?.addEventListener("click", async event => {
        const actionBtn = event.target.closest("button[data-action]");
        if (!actionBtn) return;
        const action = actionBtn.getAttribute("data-action");
        const post = getPostByElementTarget(actionBtn);
        if (!post) return;

        try {
            if (action === "like" || action === "love" || action === "wow") {
                await requestJson(`api/community/posts/${encodeURIComponent(post.id)}/react`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reactionType: action })
                });
            } else if (action === "share") {
                await requestJson(`api/community/posts/${encodeURIComponent(post.id)}/share`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({})
                });
                renderFeedback("stampbookComposerResult", "Post shared successfully in Stampbook timeline.", false);
            }
            await loadCommunityPosts();
        } catch (error) {
            renderFeedback("stampbookComposerResult", error.message, true);
        }
    });

    document.getElementById("communityFeed")?.addEventListener("submit", async event => {
        const form = event.target.closest("form[data-action='comment']");
        if (!form) return;
        event.preventDefault();
        const input = form.querySelector("input[name='comment']");
        const value = input?.value.trim();
        if (!value) return;
        const post = getPostByElementTarget(form);
        if (!post) return;

        try {
            await requestJson(`api/community/posts/${encodeURIComponent(post.id)}/comment`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: value,
                    authorId: document.getElementById("profileUserName")?.textContent || "you"
                })
            });
            await loadCommunityPosts();
        } catch (error) {
            renderFeedback("stampbookComposerResult", error.message, true);
        }
    });

    document.getElementById("peopleYouMayKnow")?.addEventListener("click", async event => {
        const followBtn = event.target.closest("button[data-follow-target]");
        if (!followBtn) return;
        const targetId = followBtn.getAttribute("data-follow-target");
        const followerId = getActiveUserId();
        try {
            await requestJson("api/social/follow", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ followerId, targetId })
            });
            followBtn.textContent = "Following";
            followBtn.setAttribute("disabled", "disabled");
            renderFeedback("stampbookComposerResult", `You are now following ${targetId}.`, false);
        } catch (error) {
            renderFeedback("stampbookComposerResult", error.message, true);
        }
    });

    document.getElementById("friendsBoard")?.addEventListener("click", async event => {
        const actionBtn = event.target.closest("button[data-request-action]");
        if (!actionBtn) return;
        const row = actionBtn.closest("[data-request-id]");
        const requestId = row?.getAttribute("data-request-id");
        const actorUserId = document.getElementById("profileUserName")?.textContent || "stampbook-user";
        if (!requestId) return;

        try {
            await requestJson("api/social/friends/respond", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, actorUserId, action: actionBtn.getAttribute("data-request-action") })
            });
            await loadFriendsBoard();
        } catch (error) {
            renderFeedback("friendRequestResult", error.message, true);
        }
    });

    document.getElementById("groupsList")?.addEventListener("click", async event => {
        const joinBtn = event.target.closest("button[data-group-join]");
        if (!joinBtn) return;
        const groupId = joinBtn.getAttribute("data-group-join");
        const userId = document.getElementById("profileUserName")?.textContent || "stampbook-user";
        try {
            await requestJson(`api/social/groups/${encodeURIComponent(groupId)}/join`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId })
            });
            await loadGroups();
            renderFeedback("groupCreateResult", "Joined group successfully.", false);
        } catch (error) {
            renderFeedback("groupCreateResult", error.message, true);
        }
    });

    registerSubmit("profileLookupForm", async event => {
        event.preventDefault();
        const userId = document.getElementById("profileLookupUserId")?.value.trim();
        try {
            const profile = await requestJson(`api/social/profile/${encodeURIComponent(userId)}`);
            renderJson("profileLookupResult", profile, "Profile snapshot");
            window.location.hash = `#profile/${encodeURIComponent(userId)}`;
        } catch (error) {
            renderFeedback("profileLookupResult", error.message, true);
        }
    });

    registerSubmit("friendRequestForm", async event => {
        event.preventDefault();
        const fromUserId = getActiveUserId();
        const toUserId = document.getElementById("friendTargetUserId")?.value.trim();
        try {
            await requestJson("api/social/friends/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fromUserId, toUserId })
            });
            renderFeedback("friendRequestResult", "Friend request sent.", false);
            event.target.reset();
            await loadFriendsBoard();
        } catch (error) {
            renderFeedback("friendRequestResult", error.message, true);
        }
    });

    registerSubmit("groupCreateForm", async event => {
        event.preventDefault();
        const name = document.getElementById("groupNameInput")?.value.trim();
        const about = document.getElementById("groupAboutInput")?.value.trim();
        const creatorId = getActiveUserId();
        try {
            await requestJson("api/social/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, about, creatorId })
            });
            renderFeedback("groupCreateResult", "Group created successfully.", false);
            event.target.reset();
            await loadGroups();
        } catch (error) {
            renderFeedback("groupCreateResult", error.message, true);
        }
    });

    registerSubmit("groupPostForm", async event => {
        event.preventDefault();
        const groupId = document.getElementById("groupPostGroupId")?.value;
        const body = document.getElementById("groupPostBody")?.value.trim();
        const authorId = getActiveUserId();
        try {
            await requestJson(`api/social/groups/${encodeURIComponent(groupId)}/posts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ authorId, body })
            });
            renderFeedback("groupPostResult", "Posted to group.", false);
            event.target.reset();
            if (groupId) {
                window.location.hash = `#group/${encodeURIComponent(groupId)}`;
            }
            await loadNotifications();
        } catch (error) {
            renderFeedback("groupPostResult", error.message, true);
        }
    });

    document.getElementById("markNotificationsReadBtn")?.addEventListener("click", async () => {
        try {
            await requestJson("api/social/notifications/read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: getActiveUserId() })
            });
            await loadNotifications();
        } catch (error) {
            renderFeedback("stampbookComposerResult", error.message, true);
        }
    });

    document.getElementById("notificationFilters")?.addEventListener("click", event => {
        const button = event.target.closest("[data-notification-filter]");
        if (!button) return;
        notificationFilter = button.getAttribute("data-notification-filter") || "all";
        renderNotificationBoard(notificationCache);
    });

    document.getElementById("notificationBoard")?.addEventListener("click", async event => {
        // Load more
        if (event.target.closest("#notifLoadMoreBtn")) {
            notificationOffset += NOTIFICATION_PAGE_SIZE;
            await loadNotifications(true);
            return;
        }

        // Mark as read
        const markReadBtn = event.target.closest("button[data-mark-read]");
        if (markReadBtn) {
            const notificationId = markReadBtn.getAttribute("data-mark-read");
            if (!notificationId) return;
            try {
                await requestJson("api/social/notifications/read", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: getActiveUserId(), notificationIds: [notificationId] })
                });
                await loadNotifications();
            } catch (error) {
                renderFeedback("stampbookComposerResult", error.message, true);
            }
            return;
        }

        // Mark as unread
        const markUnreadBtn = event.target.closest("button[data-mark-unread]");
        if (markUnreadBtn) {
            const notificationId = markUnreadBtn.getAttribute("data-mark-unread");
            if (!notificationId) return;
            try {
                await requestJson("api/social/notifications/unread", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId: getActiveUserId(), notificationIds: [notificationId] })
                });
                await loadNotifications();
            } catch (error) {
                renderFeedback("stampbookComposerResult", error.message, true);
            }
        }
    });

    document.getElementById("openProfileViewBtn")?.addEventListener("click", event => {
        const current = document.getElementById("profileLookupUserId")?.value.trim() || getActiveUserId();
        event.currentTarget.setAttribute("href", `#profile/${encodeURIComponent(current)}`);
    });

    window.addEventListener("hashchange", () => {
        handleSocialRoute();
        syncTopNav();
    });

    registerSubmit("mintJpgForm", async event => {
        event.preventDefault();
        const ownerId = document.getElementById("mintOwnerId")?.value.trim();
        const stampTitle = document.getElementById("mintStampTitle")?.value.trim();
        const feeCurrency = document.getElementById("mintFeeCurrency")?.value;
        const feeAmount = Number(document.getElementById("mintFeeAmount")?.value || 0);
        const fileInput = document.getElementById("mintJpgFile");
        const file = fileInput?.files?.[0];

        if (!file) {
            renderFeedback("mintJpgResult", "Please select a JPG file.", true);
            return;
        }

        try {
            const formData = new FormData();
            formData.append("ownerId", ownerId || "unknown");
            formData.append("stampTitle", stampTitle || "Untitled stamp");
            formData.append("feeCurrency", feeCurrency || "STC");
            formData.append("feeAmount", String(feeAmount || 0));
            formData.append("stampImage", file);

            const response = await fetch(apiPath("api/nft/mint-drafts"), {
                method: "POST",
                body: formData
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || "Failed to create NFT draft");
            }

            renderJson("mintJpgResult", payload, "NFT draft generated");

            const preview = document.getElementById("mintNftPreview");
            if (preview) {
                preview.innerHTML = `
                    <article class="nft-preview-card">
                        <img src="${escapeHtml(payload.imagePath)}" alt="Preview ${escapeHtml(payload.stampTitle)}">
                        <h4>${escapeHtml(payload.stampTitle)}</h4>
                        <p>Owner: ${escapeHtml(payload.ownerId)}</p>
                        <p>Mint fee: ${escapeHtml(String(payload.feeAmount))} ${escapeHtml(payload.feeCurrency)}</p>
                        <p>User share: ${escapeHtml(String(payload.split.userPercent))}% | Platform fee: ${escapeHtml(String(payload.split.platformPercent))}%</p>
                    </article>
                `;
            }

            setText("splitUserShare", `${payload.split.userPercent}%`);
            setText("splitPlatformShare", `${payload.split.platformPercent}%`);
        } catch (error) {
            renderFeedback("mintJpgResult", error.message, true);
        }
    });

    registerSubmit("p2pSaleForm", async event => {
        event.preventDefault();
        const seller = document.getElementById("p2pSeller")?.value.trim();
        const stamp = document.getElementById("p2pStamp")?.value.trim();
        const price = Number(document.getElementById("p2pPrice")?.value || 0);
        try {
            const payload = await requestJson("api/p2p/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sellerId: seller, stampDetails: stamp, askPriceUsd: price })
            });
            renderJson("p2pSaleResult", payload, "Escrow listing draft");
            renderFeedback("p2pEscrowResult", "Escrow policy applied: funds lock, shipment proof, confirmation release.", false);
            event.target.reset();
        } catch (error) {
            renderFeedback("p2pSaleResult", error.message, true);
        }
    });

    document.getElementById("openExchangeBtn")?.addEventListener("click", () => {
        renderFeedback("exchangeResult", "Exchange panel blueprint loaded: orderbook, limit/market orders, custody checks.", false);
    });

    document.getElementById("openDexBtn")?.addEventListener("click", () => {
        renderFeedback("dexResult", "DEX blueprint loaded: wallet connect, token approval, swap route, slippage control.", false);
    });

    document.getElementById("openFiatBtn")?.addEventListener("click", () => {
        renderFeedback("fiatResult", "Fiat deposit blueprint loaded: KYC, payment gateway, treasury confirmation.", false);
    });

    document.getElementById("connectWeb3Btn")?.addEventListener("click", async () => {
        try {
            if (!window.ethereum || !window.ethers) {
                throw new Error("MetaMask or ethers.js is not available in this browser.");
            }

            const config = await requestJson("api/web3/config");
            const provider = new window.ethers.providers.Web3Provider(window.ethereum, "any");
            await provider.send("eth_requestAccounts", []);
            const signer = provider.getSigner();
            const address = await signer.getAddress();
            const network = await provider.getNetwork();

            if (!window.ethers.utils.isAddress(config.stcContractAddress) || !window.ethers.utils.isAddress(config.nftContractAddress)) {
                throw new Error("Invalid STC/NFT contract addresses in backend config.");
            }

            const [stcAbi, nftAbi] = await Promise.all([
                loadAbi("StampCoinToken"),
                loadAbi("StampNFT")
            ]);

            const [stcCode, nftCode] = await Promise.all([
                provider.getCode(config.stcContractAddress),
                provider.getCode(config.nftContractAddress)
            ]);
            if (stcCode === "0x" || nftCode === "0x") {
                throw new Error("Configured contract addresses are not deployed on the connected network yet.");
            }

            const stc = new window.ethers.Contract(config.stcContractAddress, stcAbi, signer);
            const nft = new window.ethers.Contract(config.nftContractAddress, nftAbi, signer);

            let stcDecimals = 18;
            try {
                stcDecimals = Number(await stc.decimals());
            } catch {
                stcDecimals = 18;
            }

            web3State.provider = provider;
            web3State.signer = signer;
            web3State.address = address;
            web3State.config = config;
            web3State.stc = stc;
            web3State.nft = nft;
            web3State.stcDecimals = stcDecimals;

            renderJson("web3Result", {
                walletAddress: address,
                connectedChainId: `0x${network.chainId.toString(16)}`,
                networkName: network.name,
                expectedChainId: config.chainId,
                stcContractAddress: config.stcContractAddress,
                nftContractAddress: config.nftContractAddress,
                stcDecimals,
                explorer: config.explorerBase
            }, "Web3 wallet connected");

            setText("profileWallet", `${address.slice(0, 6)}...${address.slice(-4)}`);
            setText("profileVerification", "Wallet Connected");
        } catch (error) {
            renderFeedback("web3Result", error.message, true);
        }
    });

    registerSubmit("stcBalanceForm", async event => {
        event.preventDefault();
        try {
            ensureWeb3Contracts();
            const inputAddress = document.getElementById("web3BalanceAddress")?.value.trim();
            const targetAddress = inputAddress || web3State.address;
            if (!window.ethers.utils.isAddress(targetAddress)) {
                throw new Error("Invalid wallet address.");
            }

            const raw = await web3State.stc.balanceOf(targetAddress);
            const formatted = window.ethers.utils.formatUnits(raw, web3State.stcDecimals);
            renderJson("web3BalanceResult", {
                address: targetAddress,
                balanceRaw: raw.toString(),
                balanceFormatted: formatted,
                symbol: "STC"
            }, "STC balance");
        } catch (error) {
            renderFeedback("web3BalanceResult", error.message, true);
        }
    });

    registerSubmit("approveStcForm", async event => {
        event.preventDefault();
        try {
            ensureWeb3Contracts();
            const spender = document.getElementById("approveSpender")?.value.trim();
            const amount = document.getElementById("approveAmount")?.value.trim();
            if (!window.ethers.utils.isAddress(spender)) {
                throw new Error("Invalid spender address.");
            }
            if (!amount) {
                throw new Error("Amount is required.");
            }
            const parsedAmount = window.ethers.utils.parseUnits(amount, web3State.stcDecimals);
            const tx = await web3State.stc.approve(spender, parsedAmount);
            const receipt = await tx.wait();

            renderJson("approveResult", {
                spender,
                amount,
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                explorer: `${web3State.config.explorerBase}/tx/${tx.hash}`
            }, "STC approval submitted");
            event.target.reset();
        } catch (error) {
            renderFeedback("approveResult", error.message, true);
        }
    });

    registerSubmit("mintOnchainForm", async event => {
        event.preventDefault();
        try {
            ensureWeb3Contracts();
            const to = document.getElementById("mintToAddress")?.value.trim();
            const metadataUri = document.getElementById("mintMetadataUri")?.value.trim();
            const feeEth = document.getElementById("mintFeeEth")?.value.trim();

            if (!window.ethers.utils.isAddress(to)) {
                throw new Error("Invalid recipient address.");
            }
            if (!metadataUri) {
                throw new Error("Metadata URI is required.");
            }

            let valueWei;
            if (feeEth) {
                valueWei = window.ethers.utils.parseEther(feeEth);
            } else {
                valueWei = await web3State.nft.mintFee();
            }

            const tx = await web3State.nft.mintStamp(to, metadataUri, { value: valueWei });
            const receipt = await tx.wait();

            renderJson("mintOnchainResult", {
                to,
                metadataUri,
                feeWei: valueWei.toString(),
                txHash: tx.hash,
                blockNumber: receipt.blockNumber,
                explorer: `${web3State.config.explorerBase}/tx/${tx.hash}`
            }, "NFT mint transaction confirmed");
            event.target.reset();
        } catch (error) {
            renderFeedback("mintOnchainResult", error.message, true);
        }
    });

    document.getElementById("aiToggleBtn")?.addEventListener("click", () => {
        const panel = document.getElementById("aiPanel");
        if (!panel) return;
        panel.hidden = !panel.hidden;
    });

    document.getElementById("themeToggleBtn")?.addEventListener("click", () => {
        const activeTheme = document.body.getAttribute("data-theme") || "classic";
        setTheme(nextTheme(activeTheme));
    });

    document.getElementById("leftRailToggleBtn")?.addEventListener("click", () => {
        const collapsed = document.body.classList.contains("left-rail-collapsed");
        setLeftRailCollapsed(!collapsed);
    });

    document.getElementById("stampbookComposerForm")?.addEventListener("click", event => {
        const actionButton = event.target.closest("button[data-compose-action]");
        if (!actionButton) return;
        const action = actionButton.getAttribute("data-compose-action");
        const input = document.getElementById("sbPostText");
        if (!input) return;

        const suffix = action === "photo"
            ? " [photo update]"
            : action === "tag"
                ? " @collector"
                : " feeling excited about new stamps";

        const current = input.value.trim();
        input.value = current ? `${current}${suffix}` : suffix.trim();
        input.focus();
    });

    document.getElementById("aiCloseBtn")?.addEventListener("click", () => {
        const panel = document.getElementById("aiPanel");
        if (panel) panel.hidden = true;
    });

    registerSubmit("aiForm", async event => {
        event.preventDefault();
        const input = document.getElementById("aiInput");
        const text = input?.value.trim();
        if (!text) return;

        appendAiMessage(text, "user");
        const reply = aiReplyFor(text);
        setTimeout(() => appendAiMessage(reply, "bot"), 180);
        event.target.reset();
    });

    loadSocialBootstrap();
    loadCommunityPosts();
    loadGroups();
    loadFriendsBoard();
    loadNotifications();
    handleSocialRoute();
    syncTopNav();
    setTheme(localStorage.getItem("stampbook-theme") || "classic");
    setLeftRailCollapsed(localStorage.getItem(LEFT_RAIL_STORAGE_KEY) === "1");

    refreshHeroMetrics();
    loadListings();
    loadHealth();
    loadTokenDist();

    window.setInterval(() => {
        loadNotifications();
    }, 30000);
});
