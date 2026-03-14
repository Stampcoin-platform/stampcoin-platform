(function () {
    function bindSocialEventHandlers(ctx) {
        const {
            requestJson,
            registerSubmit,
            renderFeedback,
            renderJson,
            getActiveUserId,
            getPostByElementTarget,
            loadCommunityPosts,
            loadFriendsBoard,
            loadGroups,
            loadNotifications,
            renderNotificationBoard,
            getNotificationFilter,
            setNotificationFilter,
            getNotificationCache,
            getNotificationOffset,
            setNotificationOffset,
            notificationPageSize,
            setSocialView,
            handleSocialRoute,
            syncTopNav
        } = ctx;

        document.getElementById("communityFeed")?.addEventListener("click", async event => {
            const actionBtn = event.target.closest("button[data-action]");
            const menuActionBtn = event.target.closest("button[data-post-menu-action]");

            if (menuActionBtn) {
                const action = menuActionBtn.getAttribute("data-post-menu-action");
                const post = getPostByElementTarget(menuActionBtn);
                if (post && action) {
                    const actionLabel = action === "save"
                        ? "Post saved to your collection."
                        : action === "pin"
                            ? "Post pinned at the top of your feed."
                            : "Report submitted. Moderation team notified.";
                    renderFeedback("stampbookComposerResult", actionLabel, false);
                }
                const menu = menuActionBtn.closest(".feed-menu");
                if (menu) {
                    menu.hidden = true;
                }
                return;
            }

            if (!actionBtn) {
                document.querySelectorAll(".feed-menu").forEach(menu => {
                    menu.hidden = true;
                });
                return;
            }

            const action = actionBtn.getAttribute("data-action");
            if (action === "menu") {
                const postEl = actionBtn.closest(".feed-post");
                const currentMenu = postEl?.querySelector(".feed-menu");
                if (!currentMenu) return;
                const shouldOpen = currentMenu.hidden;
                document.querySelectorAll(".feed-menu").forEach(menu => {
                    menu.hidden = true;
                });
                currentMenu.hidden = !shouldOpen;
                return;
            }

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
                await loadCommunityPosts({ showSkeleton: false });
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
                await loadCommunityPosts({ showSkeleton: false });
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
            setNotificationFilter(button.getAttribute("data-notification-filter") || "all");
            renderNotificationBoard(getNotificationCache());
        });

        document.getElementById("notificationBoard")?.addEventListener("click", async event => {
            if (event.target.closest("#notifLoadMoreBtn")) {
                setNotificationOffset(getNotificationOffset() + notificationPageSize);
                await loadNotifications(true);
                return;
            }

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

        document.getElementById("floatingComposeBtn")?.addEventListener("click", () => {
            if (window.location.hash !== "#stampbook-social") {
                window.location.hash = "#stampbook-social";
            }
            setSocialView("feed");
            window.setTimeout(() => {
                const textarea = document.getElementById("sbPostText");
                textarea?.focus();
                textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 80);
        });

        window.addEventListener("hashchange", () => {
            handleSocialRoute();
            syncTopNav();
        });
    }

    globalThis.StampbookSocialEvents = {
        bindSocialEventHandlers
    };
})();
