(function () {
    const NOTIFICATION_ICONS = {
        new_follower: "fa-user-plus",
        post_reaction: "fa-heart",
        post_comment: "fa-comment",
        post_share: "fa-share-nodes",
        group_post: "fa-layer-group",
        group_member_joined: "fa-users",
        friend_request: "fa-handshake",
        friend_request_response: "fa-handshake-simple"
    };

    function filterNotifications(notifications, filter) {
        if (filter === "unread") {
            return notifications.filter(function (row) { return !row.isRead; });
        }
        if (filter === "requests") {
            return notifications.filter(function (row) { return String(row.type || "").includes("friend_request"); });
        }
        return notifications;
    }

    function buildRouteHref(meta) {
        if (meta.groupId) {
            return `#group/${encodeURIComponent(meta.groupId)}`;
        }
        if (meta.followerId || meta.fromUserId) {
            return `#profile/${encodeURIComponent(meta.followerId || meta.fromUserId)}`;
        }
        return "#stampbook-social";
    }

    function renderNotificationBoardHtml(payload, options) {
        const escapeHtml = options.escapeHtml;
        const formatDate = options.formatDate;
        const notificationFilter = options.notificationFilter;
        const notificationOffset = options.notificationOffset;
        const notificationPageSize = options.notificationPageSize;

        const notifications = Array.isArray(payload && payload.notifications) ? payload.notifications : [];
        const unread = Number((payload && payload.unread) || 0);
        const total = Number((payload && payload.total) || notifications.length);

        const filtered = filterNotifications(notifications, notificationFilter);
        const rows = filtered.map(function (row) {
            const meta = row.meta || {};
            const routeHref = buildRouteHref(meta);
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

        const hasMore = total > notificationOffset + notificationPageSize && notificationFilter === "all";
        const loadMoreHtml = hasMore
            ? `<div class="mini-row notification-load-more"><button type="button" id="notifLoadMoreBtn">Load more</button></div>`
            : "";

        const html = rows.length
            ? rows.join("") + loadMoreHtml
            : `
                <div class="social-empty">
                    <i class="fa-solid fa-bell-slash"></i>
                    <strong>No notifications in this filter</strong>
                    <p>New follows, comments, and requests will appear here.</p>
                </div>
            `;

        return { html, unread };
    }

    function renderNotificationBoard(payload, options) {
        const board = options.board;
        const badge = options.badge;
        const filterButtons = options.filterButtons;
        const notificationFilter = options.notificationFilter;

        if (!board || !badge) {
            return;
        }

        filterButtons.forEach(button => {
            const selected = button.getAttribute("data-notification-filter") === notificationFilter;
            button.classList.toggle("active", selected);
        });

        const rendered = renderNotificationBoardHtml(payload, options);
        badge.textContent = String(rendered.unread || 0);
        badge.hidden = Number(rendered.unread || 0) <= 0;
        board.innerHTML = rendered.html;
    }

    globalThis.StampbookSocialNotifications = {
        renderNotificationBoardHtml,
        renderNotificationBoard
    };
})();
