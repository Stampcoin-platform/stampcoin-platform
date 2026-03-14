(function () {
    function renderStoriesHtml(storyItems, escapeHtml) {
        const gradients = [
            "linear-gradient(145deg, #245f97, #0d8b9d)",
            "linear-gradient(145deg, #2f4ca5, #1d7cc8)",
            "linear-gradient(145deg, #9b5d1f, #d48f37)",
            "linear-gradient(145deg, #136f5d, #2e9d7f)",
            "linear-gradient(145deg, #6b3d9a, #8f5bc6)"
        ];

        return (storyItems || []).map(function (story, index) {
            const name = String((story && story.name) || "Collector");
            const initials = name.slice(0, 2).toUpperCase();
            const tag = String((story && story.tag) || "Stampbook update");
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

    function renderPeopleSuggestionsHtml(peopleSuggestions, escapeHtml) {
        return (peopleSuggestions || []).map(function (person) {
            const name = String((person && person.name) || "Collector");
            const initials = name.slice(0, 2).toUpperCase();
            const mutual = (name.length % 4) + 1;
            return `
            <div class="person-row">
                <div class="person-card-main">
                    <span class="person-avatar">${escapeHtml(initials)}</span>
                    <div>
                        <strong>${escapeHtml(name)}</strong>
                        <p>${escapeHtml((person && person.role) || "")}</p>
                        <small>${mutual} mutual collector${mutual > 1 ? "s" : ""}</small>
                    </div>
                </div>
                <button type="button" data-follow-target="${escapeHtml((person && (person.id || person.name)) || "")}">Follow</button>
            </div>
        `;
        }).join("");
    }

    function renderCommunityFeedHtml(communityPosts, helpers) {
        const escapeHtml = helpers.escapeHtml;
        const formatDate = helpers.formatDate;

        return (communityPosts || []).map(function (post) {
            const likeCount = Number((post && post.reactions && post.reactions.like) || 0);
            const loveCount = Number((post && post.reactions && post.reactions.love) || 0);
            const wowCount = Number((post && post.reactions && post.reactions.wow) || 0);
            const commentCount = Array.isArray(post && post.comments) ? post.comments.length : 0;
            const shareCount = Number((post && post.shares) || 0);
            const totalReactions = likeCount + loveCount + wowCount;
            const postId = escapeHtml((post && (post.id || post.createdAt || post.title)) || "");
            const author = escapeHtml((post && post.authorId) || "stampbook-user");
            const initials = escapeHtml(String((post && post.authorId) || "SB").slice(0, 2).toUpperCase());

            return `
            <article class="feed-post" data-post-id="${postId}">
                <div class="feed-head">
                    <div class="feed-author">
                        <span class="feed-avatar">${initials}</span>
                        <span class="feed-author-meta">
                            <strong>${author}</strong>
                            <small>${escapeHtml(formatDate((post && post.createdAt) || Date.now()))} · STP Feed</small>
                        </span>
                    </div>
                    <button class="feed-more" type="button" data-action="menu" aria-label="Post options"><i class="fa-solid fa-ellipsis"></i></button>
                </div>
                <div class="feed-menu" hidden>
                    <button type="button" data-post-menu-action="save">Save post</button>
                    <button type="button" data-post-menu-action="pin">Pin to top</button>
                    <button type="button" data-post-menu-action="report">Report</button>
                </div>
                <h4>${escapeHtml((post && post.title) || "New stamp update")}</h4>
                <p>${escapeHtml((post && post.body) || "")}</p>
                ${(post && post.imageUrl) ? `<img src="${escapeHtml(post.imageUrl)}" alt="Stamp preview for ${escapeHtml((post && post.title) || "post")}" loading="lazy" decoding="async">` : ""}
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
                    ${((post && post.comments) || []).slice(-3).map(function (comment) {
                        return `<div class="comment-item"><strong>${escapeHtml((comment && comment.authorId) || "user")}</strong><span>${escapeHtml((comment && comment.text) || "")}</span></div>`;
                    }).join("")}
                </div>
            </article>
        `;
        }).join("");
    }

    function renderFriendsBoardHtml(payload, escapeHtml) {
        const incoming = Array.isArray(payload && payload.incoming) ? payload.incoming : [];
        const outgoing = Array.isArray(payload && payload.outgoing) ? payload.outgoing : [];
        const friends = Array.isArray(payload && payload.friends) ? payload.friends : [];

        if (!incoming.length && !outgoing.length && !friends.length) {
            return `
                <div class="social-empty">
                    <i class="fa-solid fa-user-group"></i>
                    <strong>No friend activity yet</strong>
                    <p>Send your first friend request to start building your collector circle.</p>
                </div>
            `;
        }

        return `
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

    function renderGroupsListHtml(groups, escapeHtml) {
        const rows = Array.isArray(groups) ? groups : [];
        return rows.length
            ? rows.slice(0, 8).map(group => `
                <div class="mini-row">
                    <span><strong>${escapeHtml(group.name)}</strong> (${Number((group.members || []).length)})</span>
                    <span class="mini-actions">
                        <a class="mini-link" href="#group/${escapeHtml(group.id)}">Open</a>
                        <button type="button" data-group-join="${escapeHtml(group.id)}">Join</button>
                    </span>
                </div>
            `).join("")
            : `
                <div class="social-empty">
                    <i class="fa-solid fa-layer-group"></i>
                    <strong>No groups created yet</strong>
                    <p>Create your first collector group and invite members.</p>
                </div>
            `;
    }

    function renderGroupOptionsHtml(groups, escapeHtml) {
        const rows = Array.isArray(groups) ? groups : [];
        return rows.length
            ? rows.map(group => `<option value="${escapeHtml(group.id)}">${escapeHtml(group.name)}</option>`).join("")
            : '<option value="">No groups</option>';
    }

    globalThis.StampbookSocialUI = {
        renderStoriesHtml,
        renderPeopleSuggestionsHtml,
        renderCommunityFeedHtml,
        renderFriendsBoardHtml,
        renderGroupsListHtml,
        renderGroupOptionsHtml
    };
})();
