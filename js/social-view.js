// SatWizz "Ranks" tab: live leaderboards (Global Top 50 / Friends League),
// friend streaks with Lock In nudges, friend requests, search and invites.
//
// The app mounts it with a context of shared helpers:
//   SatWizz.socialView.mount({ container, getState, save, esc, toast, openSignup,
//                              avatarEmoji, sfx, inviteUrl })
// and gets back { render, invalidate }.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});
  const CACHE_MS = 20 * 1000;

  function mount(ctx) {
    const auth = SW.auth;
    const { container, esc, toast } = ctx;
    const cache = new Map(); // key -> { at, data }
    let searchResults = null;
    let renderSeq = 0;

    const S = () => ctx.getState();
    const fmt = (n) => Number(n || 0).toLocaleString();
    const medal = (rank) => ["🥇", "🥈", "🥉"][rank - 1] || `#${rank}`;
    const signedIn = () => auth.available() && auth.user();

    async function cached(key, load, force) {
      const hit = cache.get(key);
      if (!force && hit && Date.now() - hit.at < CACHE_MS) return hit.data;
      const data = await load();
      cache.set(key, { at: Date.now(), data });
      return data;
    }
    const invalidate = () => cache.clear();

    // ---------- shell ----------
    function render(force) {
      const st = S();
      const scope = st.lbScope === "friends" ? "friends" : "global";
      const metric = st.lbMetric === "sparks" ? "sparks" : "xp";
      container.innerHTML = `
        <div class="stack ranks">
          <div class="seg subtabs" role="tablist" aria-label="Leaderboard">
            <button type="button" role="tab" data-scope="global" aria-selected="${scope === "global"}">🌍 Global Top 50</button>
            <button type="button" role="tab" data-scope="friends" aria-selected="${scope === "friends"}">🤝 Friends League</button>
          </div>
          <div class="metric-row">
            <span class="label-sm">Rank by</span>
            <div class="seg small" role="group" aria-label="Rank by">
              <button type="button" data-metric="xp" aria-pressed="${metric === "xp"}">XP</button>
              <button type="button" data-metric="sparks" aria-pressed="${metric === "sparks"}">⚡ Sparks</button>
            </div>
          </div>
          <div id="ranks-body" class="stack"><div class="panel skeleton" aria-busy="true"><p class="muted">Loading the leaderboard…</p></div></div>
        </div>
        <div class="rank-bar" id="rank-bar" aria-live="polite"></div>`;
      container.querySelectorAll("[data-scope]").forEach((b) => b.addEventListener("click", () => {
        S().lbScope = b.dataset.scope;
        ctx.save();
        render();
      }));
      container.querySelectorAll("[data-metric]").forEach((b) => b.addEventListener("click", () => {
        S().lbMetric = b.dataset.metric;
        ctx.save();
        render();
      }));
      load(scope, metric, force);
    }

    function rankBar({ rank, value, metric }) {
      const st = S();
      const bar = container.querySelector("#rank-bar");
      if (!bar) return;
      const unit = metric === "sparks" ? "⚡" : "XP";
      bar.innerHTML = `
        <span class="lb-rank">${rank ? medal(rank) : "—"}</span>
        <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(st.avatar)}</span>
        <span class="lb-name"><b>Your rank</b><small>${rank ? `${st.username ? "@" + esc(st.username) + " · " : ""}🔥 ${st.streak}` : "Unranked · sign in to compete"}</small></span>
        <span class="lb-value">${fmt(value)} <small>${unit}</small></span>`;
    }

    // ---------- data ----------
    async function load(scope, metric, force) {
      const seq = ++renderSeq;
      const body = container.querySelector("#ranks-body");
      const st = S();
      const myValue = metric === "sparks" ? st.sparks : st.xp;

      if (st.demo) {
        body.innerHTML = `<section class="panel"><h2>Demo Mode is on</h2><p class="muted">Leaderboards are paused while Demo Mode is on, so demo numbers never reach the real rankings. Tap the SatWizz logo 5 times to turn it off.</p></section>`;
        rankBar({ rank: null, value: myValue, metric });
        return;
      }
      if (!signedIn()) {
        body.innerHTML = `
          <section class="panel ranks-cta">
            <span class="cta-emoji" aria-hidden="true">🏆</span>
            <h2>Climb the leaderboard</h2>
            <p class="muted">Sign in to see where you rank worldwide, add friends by @username, and keep friend streaks alive.</p>
            <button class="btn wide" type="button" id="ranks-signin">Save Progress &amp; join</button>
          </section>`;
        body.querySelector("#ranks-signin").addEventListener("click", () => ctx.openSignup("save"));
        rankBar({ rank: null, value: myValue, metric });
        return;
      }

      try {
        const [board, social] = await Promise.all([
          cached(`${scope}:${metric}`, () => auth.leaderboard(scope, metric, myValue), force),
          scope === "friends" ? cached("friends", () => auth.listFriends(), force) : Promise.resolve(null),
        ]);
        if (seq !== renderSeq) return; // a newer render started
        body.innerHTML = "";
        if (social) body.append(...friendsSections(social));
        body.append(boardSection(board, scope, metric));
        rankBar({ rank: board.myRank, value: myValue, metric });
        wire(body);
      } catch (e) {
        if (seq !== renderSeq) return;
        body.innerHTML = `<section class="panel"><h2>Couldn't load rankings</h2><p class="muted">${esc(e.message)}</p><button class="btn ghost" type="button" id="ranks-retry">Try again</button></section>`;
        body.querySelector("#ranks-retry").addEventListener("click", () => render(true));
        rankBar({ rank: null, value: myValue, metric });
      }
    }

    // ---------- sections ----------
    function boardSection(board, scope, metric) {
      const me = auth.user().id;
      const col = board.column;
      const unit = metric === "sparks" ? "⚡" : "XP";
      const sec = document.createElement("section");
      sec.className = "panel";
      const rows = board.rows.map((r, i) => `
        <li class="lb-row${r.user_id === me ? " me" : ""}${i < 3 ? " top" : ""}">
          <span class="lb-rank">${medal(i + 1)}</span>
          <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(r.avatar)}</span>
          <span class="lb-name"><b>${esc(r.display_name)}${r.user_id === me ? " (you)" : ""}</b><small>${r.username ? "@" + esc(r.username) + " · " : ""}🔥 ${fmt(r.current_streak)}</small></span>
          <span class="lb-value">${fmt(r[col])} <small>${unit}</small></span>
        </li>`).join("");
      sec.innerHTML = `
        <h2>${scope === "friends" ? "Friends League" : "Global Top 50"}</h2>
        ${board.rows.length
          ? `<ol class="lb-list">${rows}</ol>`
          : `<p class="muted">${scope === "friends" ? "Add friends to start a league." : "No one's on the board yet. Answer a question to be first."}</p>`}`;
      return sec;
    }

    function friendsSections(social) {
      const out = [];
      const st = S();

      // Friend streaks + Lock In
      const streaks = document.createElement("section");
      streaks.className = "panel";
      streaks.innerHTML = `
        <h2>Friend streaks</h2>
        <p class="muted">A friend streak grows each day you and a friend both practice within 24 hours.</p>
        ${social.friends.length ? `<ul class="friend-list">${social.friends.map((f) => `
          <li class="friend-row${f.practicedRecently ? "" : " idle"}">
            <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(f.profile.avatar)}</span>
            <span class="lb-name"><b>${esc(f.profile.display_name)}</b><small>${f.profile.username ? "@" + esc(f.profile.username) + " · " : ""}${f.practicedRecently ? "practiced today ✓" : lastSeen(f.lastPracticeAt)}</small></span>
            <span class="fstreak${f.streak ? "" : " cold"}" title="Friend streak">🔥 ${f.streak}</span>
            ${f.practicedRecently ? "" : `<button class="lock-btn" type="button" data-lock="${esc(f.profile.user_id)}" data-name="${esc(f.profile.display_name)}">Lock In 🔒</button>`}
          </li>`).join("")}</ul>` : '<p class="muted">No friends yet. Search by @username or share your invite link below.</p>'}`;
      out.push(streaks);

      // Requests
      if (social.incoming.length || social.outgoing.length) {
        const req = document.createElement("section");
        req.className = "panel";
        req.innerHTML = `
          <h2>Requests</h2>
          <ul class="friend-list">
            ${social.incoming.map((f) => `
              <li class="friend-row">
                <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(f.profile.avatar)}</span>
                <span class="lb-name"><b>${esc(f.profile.display_name)}</b><small>${f.profile.username ? "@" + esc(f.profile.username) : ""} wants to be friends</small></span>
                <button class="mini-btn on" type="button" data-accept="${f.id}">Accept</button>
                <button class="mini-btn" type="button" data-decline="${f.id}">Decline</button>
              </li>`).join("")}
            ${social.outgoing.map((f) => `
              <li class="friend-row">
                <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(f.profile.avatar)}</span>
                <span class="lb-name"><b>${esc(f.profile.display_name)}</b><small>Request sent · waiting</small></span>
                <button class="mini-btn" type="button" data-decline="${f.id}">Cancel</button>
              </li>`).join("")}
          </ul>`;
        out.push(req);
      }

      // Add friends
      const add = document.createElement("section");
      add.className = "panel";
      const link = ctx.inviteUrl();
      add.innerHTML = `
        <h2>Add friends</h2>
        <form class="search-row" id="friend-search" role="search">
          <label class="sr-only" for="friend-q">Search by username</label>
          <input class="input" id="friend-q" placeholder="@username" autocomplete="off" autocapitalize="none" spellcheck="false" inputmode="search">
          <button class="btn" type="submit">Search</button>
        </form>
        <ul class="friend-list" id="search-results">${renderResults()}</ul>
        <div class="invite">
          <span class="label-sm">Your invite link${st.username ? ` · you're @${esc(st.username)}` : ""}</span>
          ${link ? `<code class="invite-link" id="invite-link">${esc(link)}</code>
          <div class="row">
            <button class="btn ghost" type="button" id="copy-invite">Copy link</button>
            ${navigator.share ? '<button class="btn ghost" type="button" id="share-invite">Share</button>' : ""}
          </div>` : '<p class="muted">Your username is being set up…</p>'}
        </div>
        <div class="push-card" id="push-card"></div>`;
      out.push(add);
      return out;
    }

    function renderResults() {
      if (searchResults === null) return "";
      if (!searchResults.length) return '<li class="muted">No one found with that username.</li>';
      return searchResults.map((r) => `
        <li class="friend-row">
          <span class="avatar md" aria-hidden="true">${ctx.avatarEmoji(r.avatar)}</span>
          <span class="lb-name"><b>${esc(r.display_name)}</b><small>@${esc(r.username)} · ${fmt(r.total_xp)} XP</small></span>
          <button class="mini-btn on" type="button" data-add="${esc(r.username)}">Add</button>
        </li>`).join("");
    }

    function lastSeen(ts) {
      if (!ts) return "hasn't practiced yet";
      const days = Math.floor((Date.now() - ts) / 864e5);
      return days < 1 ? "not practiced today" : `last practiced ${days}d ago`;
    }

    // ---------- actions ----------
    function wire(body) {
      body.querySelectorAll("[data-lock]").forEach((b) => b.addEventListener("click", async () => {
        ctx.sfx.play("tap");
        b.disabled = true;
        b.textContent = "Sending…";
        try {
          const res = await auth.sendLockIn(b.dataset.lock);
          b.textContent = "Sent ✓";
          toast(`Lock In sent to ${b.dataset.name} 🔒${res.pushed ? "" : " They'll see it next time they open SatWizz."}`);
        } catch (e) {
          b.textContent = "Lock In 🔒";
          b.disabled = /again in a few hours/.test(e.message);
          toast(e.message);
        }
      }));
      body.querySelectorAll("[data-accept]").forEach((b) => b.addEventListener("click", () => respond(b, Number(b.dataset.accept), true)));
      body.querySelectorAll("[data-decline]").forEach((b) => b.addEventListener("click", () => respond(b, Number(b.dataset.decline), false)));
      wireAdd(body);
      wireInvite(body);
      renderPushCard(body.querySelector("#push-card"));
    }

    async function respond(btn, id, accept) {
      btn.disabled = true;
      try {
        await auth.respondFriendRequest(id, accept);
        toast(accept ? "Friend added 🎉 Your friend streak starts when you both practice." : "Request removed.");
        invalidate();
        render(true);
      } catch (e) {
        btn.disabled = false;
        toast(e.message);
      }
    }

    function wireAdd(body) {
      const form = body.querySelector("#friend-search");
      if (!form) return;
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const q = body.querySelector("#friend-q").value;
        try {
          searchResults = await auth.searchUsers(q);
        } catch (err) {
          toast(err.message);
          searchResults = [];
        }
        body.querySelector("#search-results").innerHTML = renderResults();
        wireAddButtons(body);
      });
      wireAddButtons(body);
    }

    function wireAddButtons(body) {
      body.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", async () => {
        b.disabled = true;
        try {
          const row = await auth.sendFriendRequest(b.dataset.add);
          toast(row && row.status === "accepted" ? `You and @${b.dataset.add} are now friends 🎉` : `Friend request sent to @${b.dataset.add}`);
          searchResults = null;
          invalidate();
          render(true);
        } catch (e) {
          b.disabled = false;
          toast(e.message);
        }
      }));
    }

    function wireInvite(body) {
      const link = body.querySelector("#invite-link");
      body.querySelector("#copy-invite")?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(link.textContent);
          toast("Invite link copied");
        } catch (e) {
          const range = document.createRange();
          range.selectNodeContents(link);
          const sel = getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          toast("Press and hold (or Ctrl+C) to copy the link");
        }
      });
      body.querySelector("#share-invite")?.addEventListener("click", () => {
        navigator.share({
          title: "Join me on SatWizz",
          text: "Practice SAT grammar with me and let's keep a streak going 🔥",
          url: link.textContent,
        }).catch(() => {});
      });
    }

    async function renderPushCard(el) {
      if (!el) return;
      const state = await auth.pushState();
      if (state === "enabled" || state === "not-configured" || state === "unsupported") {
        el.hidden = state !== "enabled";
        el.innerHTML = state === "enabled" ? '<p class="muted">🔔 Lock In alerts are on for this device.</p>' : "";
        return;
      }
      const copy = {
        default: "Get a notification when a friend tells you to Lock In.",
        denied: "Notifications are blocked for SatWizz. Allow them in your browser's site settings to get Lock In alerts.",
        "needs-install": "On iPhone, add SatWizz to your Home Screen (Share → Add to Home Screen) to get Lock In alerts.",
      }[state];
      el.innerHTML = `<p class="muted">🔔 ${copy}</p>${state === "default" ? '<button class="btn ghost" type="button" id="push-on">Turn on alerts</button>' : ""}`;
      el.querySelector("#push-on")?.addEventListener("click", async () => {
        try {
          await auth.enablePush();
          toast("Lock In alerts are on 🔔");
        } catch (e) {
          toast(e.message);
        }
        renderPushCard(el);
      });
    }

    return { render, invalidate };
  }

  SW.socialView = { mount };
})();
