// SatWizz Privacy Policy and Terms of Service. Exposes window.SatWizz.legal.
//
// One source for both places the text appears:
//   • in the site: SatWizz.legal.open("privacy" | "terms") shows it in an
//     overlay (also opened by #privacy / #terms in the address bar);
//   • as standalone pages: scripts/build-single.js writes dist/privacy.html and
//     dist/terms.html from LEGAL below, so Google's sign-in screen can link them.
//
// Plain-English starting documents for a free student project, not legal advice.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const OWNER = "SatWizz";
  const EMAIL = "jshim7892@gmail.com";
  const UPDATED = "1 October 2026";
  const mail = `<a href="mailto:${EMAIL}">${EMAIL}</a>`;

  const LEGAL = {
    privacy: {
      title: "Privacy Policy",
      intro: `${OWNER} is a free Digital SAT practice website run by an independent developer based in India. This policy explains what we collect, why, who helps us run the site, and the choices you have. For the purposes of India's Digital Personal Data Protection Act, 2023, ${OWNER} is the "Data Fiduciary" (the one responsible for your data); under other laws, such as the EU GDPR, we are the "controller". Questions or requests: ${mail}.`,
      summary: [
        "Playing as a guest sends us nothing about your progress: it stays in your browser.",
        "If you make an account, we store your email and your SatWizz progress so it syncs across devices.",
        "No ads, no selling your data, no tracking or analytics cookies.",
        "You can delete your account and its data any time in Profile → Settings.",
        "Under 18? Ask a parent or guardian before making an account.",
      ],
      sections: [
        ["1. If you play as a guest", `
          <p>Your progress (streaks, XP, Sparks, purchases, chapter scores, vocab progress, badges and settings) is saved only in your browser's local storage on your device. We don't receive it. Clearing your browser data or using another browser starts you fresh.</p>
          <p>If you use <b>Suggest a feature / Report a bug</b>, we receive what you type, whether it's an idea or a bug, which screen you were on, and the time. Please don't put personal details in feedback.</p>`],
        ["2. If you make an account", `
          <p>We collect:</p>
          <ul>
            <li><b>Account details:</b> your email address. With <b>Continue with Google</b>, Google shares your email address and basic profile (name) with us; we never see your Google password. With email sign-up, your password is stored by our sign-in provider in hashed form; we can't read it.</li>
            <li><b>Profile:</b> the display name, username and avatar you choose.</li>
            <li><b>Progress:</b> streaks, XP, Sparks, Shop and avatar purchases, unlocked chapters, test and practice scores, missed questions, vocab progress, badges, your Focus meter, daily goal, chosen theme and any character names you type in.</li>
            <li><b>Friends:</b> friend requests and friendships, friend streaks, Lock In messages, and the time you last practised.</li>
            <li><b>Notifications (optional):</b> if you turn on Lock In alerts, your browser's push subscription (a web address and keys from your browser's push service).</li>
            <li><b>Sign-in and security logs:</b> our sign-in provider records sign-in events, including IP address, browser type and time, to keep accounts secure.</li>
          </ul>
          <p>We don't ask for and don't want sensitive information such as your phone number, address, school, ID numbers, health details or photos. Please don't put it in your display name, username, character names or feedback.</p>`],
        ["3. What other players can see", `
          <p>Signed-in players can see your <b>display name, username, avatar, XP, Sparks and current streak</b> on leaderboards and when they search for friends. Friends also see your friend streak and the Lock In messages you send them. Your email address is never shown to other players.</p>`],
        ["4. Why we use it", `
          <ul>
            <li>To run your account and sync your progress across devices.</li>
            <li>To show leaderboards, friends, friend streaks and Lock In alerts.</li>
            <li>To fix bugs and improve SatWizz using feedback.</li>
            <li>To keep the site safe, for example by enforcing the Terms of Service.</li>
          </ul>
          <p>We don't sell or rent your data, "share" it for cross-context advertising, show ads, or use your data to build advertising profiles. We don't make automated decisions about you that have legal or similarly significant effects; streaks, scores and unlocks are just the game's rules.</p>
          <p><b>Legal basis.</b> We use account data based on the consent you give when you create an account (you can withdraw it at any time by deleting your account), and to provide the service you asked for. We use feedback and basic logs because we have a legitimate interest in keeping the site working, safe and improving. Withdrawing consent doesn't affect anything we did before you withdrew it.</p>`],
        ["5. Services that help us run SatWizz", `
          <p>These providers process data for us only to provide their service:</p>
          <ul>
            <li><b>Supabase</b>: our database and sign-in system. Account data is stored on its servers in Tokyo, Japan.</li>
            <li><b>Google</b>: Google sign-in (if you use it), and Google Fonts, which loads the site's fonts (your browser contacts Google's servers, which see your IP address).</li>
            <li><b>Netlify</b>: hosts the website. Like any web host, it keeps basic server logs such as IP addresses.</li>
            <li><b>jsDelivr</b>: delivers the code library that connects to Supabase.</li>
            <li><b>Your browser's push service</b> (from Google, Apple or Mozilla), only if you turn on Lock In alerts.</li>
          </ul>
          <p>Because these services operate around the world, your data may be stored or processed outside India, including in Japan and the United States.</p>`],
        ["6. Cookies and local storage", `
          <p>SatWizz doesn't use advertising or analytics cookies. It uses your browser's local storage to save your progress, your light/dark choice, your agreement to these documents and unsent feedback, and (if you sign in) to keep you signed in. Because we don't track you, we don't need a cookie banner, and we treat "Do Not Track" and Global Privacy Control signals as already respected.</p>
          <p>To erase what's stored on your device, use Profile → Settings → <b>Reset progress</b>, or clear this site's data in your browser settings.</p>`],
        ["7. How long we keep it", `
          <p>We keep account data while your account exists. When you delete your account, your account and progress are removed from our database straight away; copies may stay in our providers' backups for a short time before they're overwritten. Feedback is kept while it's useful for improving the site; once your account is deleted it's no longer linked to you.</p>`],
        ["8. Your rights and choices", `
          <ul>
            <li><b>Delete:</b> Profile → Settings → <b>Delete my account</b> removes your account and cloud data. You can also email us.</li>
            <li><b>Correct:</b> change your display name, username and avatar in Profile any time.</li>
            <li><b>Access:</b> email us for a copy of the data we hold about you.</li>
            <li><b>Withdraw consent:</b> delete your account, or sign out and play as a guest.</li>
            <li><b>Notifications:</b> turn Lock In alerts off in Settings or in your browser.</li>
            <li><b>Nominate:</b> you can name someone to exercise your rights if you die or can't act for yourself; email us with their details.</li>
          </ul>
          <p>To protect your account, we may ask you to confirm a request from the email address on the account. We won't treat you differently for using your rights.</p>
          <p>Depending on where you live (for example under India's Digital Personal Data Protection Act, 2023, Korea's Personal Information Protection Act, the EU and UK GDPR, or US state laws such as California's) you may have further rights, including the right to complain to your local data protection authority (in India, the Data Protection Board of India). Please contact us first so we can try to fix it. We aim to reply to every request within 30 days.</p>`],
        ["9. Children and teenagers", `
          <p>SatWizz is made for students preparing for the SAT, many of whom are under 18.</p>
          <ul>
            <li>Anyone can play as a guest without giving us any personal data.</li>
            <li>If you are <b>under 18</b>, you need your parent's or guardian's permission before you create an account. When you sign up, you confirm that you're 18 or older or that you have this permission.</li>
            <li>Accounts aren't intended for children <b>under 13</b>.</li>
            <li>We don't track children's behaviour across sites or show them targeted ads.</li>
            <li>Parents or guardians can email ${mail} to review or delete their child's account. If we learn an account was made without the permission it needed, we'll delete it.</li>
          </ul>`],
        ["10. Security", `
          <p>Data travels over encrypted connections (HTTPS), and database rules let each player read and change only their own private data. No website is perfectly secure, so use a password you don't use elsewhere. If a breach affects your data, we'll tell you and the relevant authorities as the law requires.</p>`],
        ["11. Changes to this policy", `
          <p>If we change this policy, we'll update the date at the top, and for important changes we'll show a notice in the site.</p>`],
        ["12. Contact and grievances", `
          <p><b>Grievance Officer:</b> the ${OWNER} team, ${mail}. Use this address for privacy questions, data requests and complaints, including from parents and guardians. We aim to acknowledge complaints within 24 hours and resolve them within 15 days.</p>`],
      ],
    },

    terms: {
      title: "Terms of Service",
      intro: `These terms are the rules for using ${OWNER}, a free Digital SAT practice website. If you play as a guest, these rules apply while you use the site. To create an account, you'll be asked to agree to them and to our <a href="#privacy" data-legal="privacy">Privacy Policy</a> by ticking a box. If you don't agree, please don't use the site. Questions: ${mail}.`,
      summary: [
        "SatWizz is free, for personal study, and comes as-is.",
        "Sparks, Shop items and Derby wagers are play money with no real-world value.",
        "Be kind: no offensive usernames, cheating or attacks on the site.",
        "SatWizz isn't connected to the College Board.",
        "Under 18? You need a parent's or guardian's permission to make an account.",
      ],
      sections: [
        ["1. Who can use SatWizz", `
          <p>Anyone can practise as a guest. To create an account you must be at least 13, and if you are under 18 you need your parent's or guardian's permission. They agree to these terms on your behalf.</p>`],
        ["2. Your account", `
          <ul>
            <li>Keep your sign-in details private. You're responsible for what happens in your account.</li>
            <li>Choose a display name and username that aren't offensive, hateful, sexual, or impersonating someone else. We may change or remove ones that are.</li>
            <li>You can delete your account any time in Profile → Settings.</li>
          </ul>`],
        ["3. What you post", `
          <p>Display names, usernames, character names you type in, Lock In messages and feedback are your content. You're responsible for it, and it must not:</p>
          <ul>
            <li>include personal details about you or anyone else (phone numbers, addresses, school names);</li>
            <li>be offensive, hateful, sexual, threatening or bullying;</li>
            <li>use names, logos or characters you don't have the right to use, or pretend to be someone else.</li>
          </ul>
          <p>You let us store and show your content inside ${OWNER} so the features work (for example, your display name on leaderboards). We may remove content that breaks these rules.</p>`],
        ["4. Acceptable use", `
          <p>Don't:</p>
          <ul>
            <li>use bots, scripts or exploits to gain XP, Sparks, streaks or leaderboard places;</li>
            <li>harass other players, including through Lock In messages;</li>
            <li>try to break, overload or get unauthorised access to the site or other players' data;</li>
            <li>copy SatWizz's questions or content in bulk, or resell them.</li>
          </ul>`],
        ["5. Sparks, Shop items and the Derby", `
          <p>Sparks ⚡, Shop items, avatars, casts, Aura Shields, Focus Elixirs and Derby wagers are part of the game. They can't be bought with or exchanged for real money, have no cash value, aren't your property, and can't be transferred. We may rebalance prices or rewards, and progress can be lost (for example if you clear your browser data as a guest). The Derby is a game of skill using play money only; no real gambling takes place.</p>`],
        ["6. Our content", `
          <p>SatWizz's questions, explanations, word lists, games, design and code belong to ${OWNER}. You may use them for your own study. Practice questions are original and written for SatWizz; characters' names in questions are generic placeholders or names you choose.</p>
          <p><b>SAT® is a trademark registered by the College Board, which is not affiliated with, and does not endorse, ${OWNER}.</b> Other names used in ${OWNER} are fictional; any resemblance to real people is a coincidence.</p>
          <p><b>Copyright or trademark complaints.</b> We respect other people's rights. If you believe something on ${OWNER} uses your work, name or brand without permission, email ${mail} with what it is, where it appears and how to reach you. We'll review it and remove it promptly if needed.</p>`],
        ["7. Study help, not a guarantee", `
          <p>SatWizz is a practice tool. We work to keep questions accurate but can't promise they're error-free, and we don't guarantee any particular SAT score. Always check official College Board information for test dates, rules and formats.</p>`],
        ["8. Feedback", `
          <p>If you send ideas or bug reports, we may use them to improve SatWizz without owing you anything.</p>`],
        ["9. Availability and changes", `
          <p>SatWizz is provided free and may change, pause or shut down at any time. We may update features, content and these terms. We'll update the date at the top and, for important changes, show a notice in the site. Using SatWizz after a change means you accept the new terms.</p>`],
        ["10. Suspension", `
          <p>We may suspend or delete accounts that break these terms. You can stop using SatWizz at any time.</p>`],
        ["11. Disclaimer and liability", `
          <p>SatWizz is provided "as is" and "as available", without warranties of any kind. To the fullest extent the law allows, ${OWNER} isn't liable for indirect or consequential losses, or for lost progress, data or virtual items. Nothing in these terms limits rights you have by law that can't be limited.</p>`],
        ["12. Other services", `
          <p>${OWNER} relies on other services (such as Supabase, Google, Netlify and your browser's push service) that have their own terms. We aren't responsible for them, or for websites we link to.</p>`],
        ["13. Privacy", `
          <p>Our <a href="#privacy" data-legal="privacy">Privacy Policy</a> explains how we handle your data.</p>`],
        ["14. Governing law and disputes", `
          <p>These terms are governed by the laws of India. Before going to court, please email us so we can try to sort things out; most problems can be fixed quickly. If you live elsewhere, you keep any protections your local consumer law gives you.</p>`],
        ["15. The legal bits", `
          <ul>
            <li>If any part of these terms can't be enforced, the rest still applies.</li>
            <li>If we don't enforce a rule straight away, we can still enforce it later.</li>
            <li>These terms and the Privacy Policy are the whole agreement between you and ${OWNER} about the site.</li>
            <li>We may transfer these terms to someone who takes over running ${OWNER}; we'll tell you if that happens. You can't transfer your account.</li>
          </ul>`],
        ["16. Contact and grievances", `
          <p><b>Grievance Officer:</b> the ${OWNER} team, ${mail}. We aim to acknowledge complaints within 24 hours and resolve them within 15 days.</p>`],
      ],
    },
  };

  // The document body (shared by the overlay and the standalone pages).
  function bodyHtml(kind) {
    const d = LEGAL[kind];
    const other = kind === "privacy" ? "terms" : "privacy";
    return `
      <p class="legal-date">Last updated ${UPDATED}</p>
      <p>${d.intro}</p>
      <div class="legal-summary"><b>The short version</b><ul>${d.summary.map((s) => `<li>${s}</li>`).join("")}</ul></div>
      ${d.sections.map(([h, html]) => `<section><h3>${h}</h3>${html}</section>`).join("")}
      <p class="legal-foot">See also our <a href="#${other}" data-legal="${other}">${LEGAL[other].title}</a>.</p>`;
  }

  // ---------- In-site overlay ----------
  let sheet = null;
  let returnFocus = null;

  function open(kind) {
    if (!LEGAL[kind]) return;
    if (sheet) close(false);
    else returnFocus = document.activeElement;
    sheet = document.createElement("div");
    sheet.className = "legal-backdrop";
    sheet.innerHTML = `
      <div class="help-modal legal-modal" role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <div class="help-head">
          <h2 id="legal-title">${LEGAL[kind].title}</h2>
          <button class="linkbtn" type="button" data-close aria-label="Close ${LEGAL[kind].title}">✕ Close</button>
        </div>
        <div class="legal-body">${bodyHtml(kind)}</div>
      </div>`;
    document.body.append(sheet);
    sheet.addEventListener("mousedown", (e) => { if (e.target === sheet) close(); });
    sheet.querySelector("[data-close]").addEventListener("click", () => close());
    sheet.addEventListener("click", (e) => {
      const a = e.target.closest("[data-legal]");
      if (!a) return;
      e.preventDefault();
      open(a.dataset.legal);
    });
    // Window capture runs before the document-level handlers of the sign-in
    // modal and the help overlay, so Esc closes only this layer.
    window.addEventListener("keydown", onKey, true);
    sheet.querySelector("[data-close]").focus();
  }

  function close(restore = true) {
    if (!sheet) return;
    window.removeEventListener("keydown", onKey, true);
    sheet.remove();
    sheet = null;
    if (/^#(privacy|terms)$/.test(location.hash)) {
      history.replaceState(null, "", location.pathname + location.search);
    }
    if (restore && returnFocus && typeof returnFocus.focus === "function") returnFocus.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (!sheet) return;
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      const items = [...sheet.querySelectorAll("button, a")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation(); // nothing underneath reacts while the document is open
  }

  // Any [data-legal] link anywhere opens the overlay instead of navigating.
  function wire() {
    document.addEventListener("click", (e) => {
      const a = e.target.closest && e.target.closest("[data-legal]");
      if (!a || (sheet && sheet.contains(a))) return;
      e.preventDefault();
      open(a.dataset.legal);
    });
    const fromHash = () => {
      const m = /^#(privacy|terms)$/.exec(location.hash);
      if (m) open(m[1]);
    };
    window.addEventListener("hashchange", fromHash);
    fromHash();
  }

  const links = (sep = " · ") =>
    `<a href="#privacy" data-legal="privacy">Privacy Policy</a>${sep}<a href="#terms" data-legal="terms">Terms of Service</a>`;

  SW.legal = { LEGAL, OWNER, EMAIL, UPDATED, bodyHtml, open, close, isOpen: () => sheet !== null, links };
  if (typeof document !== "undefined" && document.addEventListener) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
    else wire();
  }
})();
