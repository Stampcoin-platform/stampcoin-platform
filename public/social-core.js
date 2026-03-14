(function () {
    function createSocialRuntime(ctx) {
        const {
            requestJson,
            escapeHtml,
            formatDate,
            socialState,
            getSelectedGroupId,
            loadSocialBootstrap,
            loadCommunityPosts,
            loadGroups,
            loadFriendsBoard,
            loadNotifications,
            setTheme,
            setCompactMode,
            setLeftRailCollapsed,
            compactModeStorageKey,
            leftRailStorageKey,
            notificationPollIntervalMs
        } = ctx;

        function parseSocialRoute() {
            const selected = getSelectedGroupId();
            if (socialState && typeof socialState.parseSocialRoute === "function") {
                return socialState.parseSocialRoute(window.location.hash || "", selected);
            }

            const hash = (window.location.hash || "").replace(/^#/, "").trim();
            if (hash.startsWith("profile/")) {
                return { view: "profile", value: decodeURIComponent(hash.slice("profile/".length)) };
            }
            if (hash.startsWith("group/")) {
                return { view: "group", value: decodeURIComponent(hash.slice("group/".length)) };
            }
            if (hash === "group") {
                return { view: "group", value: selected };
            }
            return { view: "feed", value: "" };
        }

        function setSocialView(viewName) {
            const feed = document.getElementById("stampbook-social");
            const profile = document.getElementById("socialProfileView");
            const group = document.getElementById("socialGroupView");
            if (!feed || !profile || !group) return;

            const views = [
                { el: feed, name: "feed" },
                { el: profile, name: "profile" },
                { el: group, name: "group" }
            ];

            views.forEach(({ el, name }) => {
                const show = viewName === name;
                if (!show) {
                    el.hidden = true;
                    el.classList.remove("section-enter", "section-enter-active");
                    return;
                }

                el.hidden = false;
                el.classList.add("section-enter");
                requestAnimationFrame(() => {
                    el.classList.add("section-enter-active");
                });
                window.setTimeout(() => {
                    el.classList.remove("section-enter", "section-enter-active");
                }, 260);
            });
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
            const normalizedHash = (socialState && typeof socialState.normalizeTopNavHash === "function")
                ? socialState.normalizeTopNavHash(hash)
                : hash;
            const tabs = document.querySelectorAll(".topnav .nav-tab");
            tabs.forEach(tab => {
                const target = tab.getAttribute("data-nav-target") || tab.getAttribute("href") || "";
                const active = target && normalizedHash.startsWith(target);
                tab.classList.toggle("active", active);
                if (active) {
                    tab.setAttribute("aria-current", "page");
                } else {
                    tab.removeAttribute("aria-current");
                }
            });
        }

        function initializeSocialExperience() {
            loadSocialBootstrap();
            loadCommunityPosts();
            loadGroups();
            loadFriendsBoard();
            loadNotifications();
            handleSocialRoute();
            syncTopNav();

            window.addEventListener("hashchange", () => {
                handleSocialRoute();
                syncTopNav();
            });

            setTheme(localStorage.getItem("stampbook-theme") || "classic");
            setCompactMode(localStorage.getItem(compactModeStorageKey) === "1");
            setLeftRailCollapsed(localStorage.getItem(leftRailStorageKey) === "1");

            return window.setInterval(() => {
                if (document.hidden) {
                    return;
                }
                loadNotifications();
            }, Number(notificationPollIntervalMs) || 30000);
        }

        return {
            setSocialView,
            handleSocialRoute,
            syncTopNav,
            initializeSocialExperience
        };
    }

    globalThis.StampbookSocialCore = {
        createSocialRuntime
    };
})();
