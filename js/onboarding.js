// SatWizz sign-up / log-in modal. Exposes window.SatWizz.onboarding.
// open({ reason, onGuest }) shows the overlay; reason is "save", "combo" or "invite".
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});
  const auth = () => SW.auth;

  const COPY = {
    save: {
      title: "Save your progress",
      body: "Create a free account to keep your streak, XP and cast on every device.",
    },
    combo: {
      title: "3 in a row! Don't lose that streak",
      body: "Make a free account so your streak and XP follow you to any phone or laptop.",
    },
    invite: {
      title: "A friend invited you 🔥",
      body: "Sign in to accept their friend request, start a friend streak and see where you rank.",
    },
  };

  const GOOGLE_G =
    '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">' +
    '<path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>' +
    '<path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>' +
    '<path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>' +
    '<path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>' +
    "</svg>";

  let root = null;
  let opts = {};
  let mode = "signup";
  let returnFocus = null;

  const isOpen = () => root !== null;

  function open(options = {}) {
    if (root) return;
    opts = options;
    mode = options.mode || "signup";
    returnFocus = document.activeElement;
    render();
    document.addEventListener("keydown", onKey, true);
    root.querySelector("#auth-google").focus();
  }

  function close() {
    if (!root) return;
    document.removeEventListener("keydown", onKey, true);
    root.remove();
    root = null;
    if (returnFocus && typeof returnFocus.focus === "function") returnFocus.focus({ preventScroll: true });
  }

  function continueAsGuest() {
    close();
    if (typeof opts.onGuest === "function") opts.onGuest();
  }

  function render() {
    const copy = COPY[opts.reason] || COPY.save;
    const ready = auth() && auth().available();
    root = document.createElement("div");
    root.className = "modal-backdrop";
    root.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" aria-describedby="auth-body">
        <div class="modal-brand">Sat<span>Wizz</span></div>
        <h2 id="auth-title">${copy.title}</h2>
        <p id="auth-body" class="muted">${copy.body}</p>
        ${ready ? "" : `<p class="notice">${
          auth() && auth().reason() === "sdk-missing"
            ? "The sign-in service didn't load. Check your connection and reload, or keep playing as a guest."
            : "Cloud accounts aren't set up on this copy of SatWizz yet. You can keep playing as a guest."
        }</p>`}
        <button class="btn google wide" type="button" id="auth-google">${GOOGLE_G}<span>Continue with Google</span></button>
        <div class="divider" role="separator"><span>or use email</span></div>
        <div class="seg auth-tabs" role="tablist" aria-label="Account">
          <button type="button" role="tab" id="tab-signup" aria-controls="auth-form">Sign Up</button>
          <button type="button" role="tab" id="tab-login" aria-controls="auth-form">Log In</button>
        </div>
        <form id="auth-form" class="stack" novalidate>
          <div class="field">
            <label for="auth-email">Email</label>
            <input class="input" id="auth-email" type="email" autocomplete="email" inputmode="email" required>
          </div>
          <div class="field">
            <label for="auth-pass">Password</label>
            <input class="input" id="auth-pass" type="password" minlength="6" required>
          </div>
          <p class="form-msg" id="auth-msg" role="alert"></p>
          <button class="btn wide" type="submit" id="auth-submit"></button>
        </form>
        <button class="linkbtn" type="button" id="auth-guest">Continue as Guest</button>
        <p class="fine">As a guest, progress is saved in this browser only.</p>
      </div>`;
    document.body.append(root);

    root.addEventListener("mousedown", (e) => { if (e.target === root) continueAsGuest(); });
    root.querySelector("#tab-signup").addEventListener("click", () => setMode("signup"));
    root.querySelector("#tab-login").addEventListener("click", () => setMode("login"));
    root.querySelector("#auth-guest").addEventListener("click", continueAsGuest);
    root.querySelector("#auth-google").addEventListener("click", google);
    root.querySelector("#auth-form").addEventListener("submit", submit);
    setMode(mode);
  }

  function setMode(next) {
    mode = next;
    const signup = mode === "signup";
    root.querySelector("#tab-signup").setAttribute("aria-selected", String(signup));
    root.querySelector("#tab-login").setAttribute("aria-selected", String(!signup));
    root.querySelector("#tab-signup").setAttribute("aria-pressed", String(signup));
    root.querySelector("#tab-login").setAttribute("aria-pressed", String(!signup));
    root.querySelector("#auth-pass").setAttribute("autocomplete", signup ? "new-password" : "current-password");
    root.querySelector("#auth-submit").textContent = signup ? "Sign Up" : "Log In";
    message("");
  }

  function message(text, kind = "error") {
    const el = root && root.querySelector("#auth-msg");
    if (!el) return;
    el.textContent = text;
    el.dataset.kind = kind;
  }

  function busy(on, label) {
    const btn = root.querySelector("#auth-submit");
    btn.disabled = on;
    root.querySelector("#auth-google").disabled = on;
    if (label) btn.textContent = label;
  }

  function friendly(err) {
    const m = (err && err.message) || "Something went wrong. Try again.";
    if (/invalid login credentials/i.test(m)) return "That email and password don't match. Check them or switch to Sign Up.";
    if (/already registered|already exists/i.test(m)) return "There's already an account with that email. Switch to Log In.";
    if (/email not confirmed/i.test(m)) return "Confirm your email first. Check your inbox for the link.";
    if (/failed to fetch|network/i.test(m)) return "Couldn't reach the server. Check your connection and try again.";
    return m;
  }

  async function google() {
    message("");
    try {
      busy(true);
      await auth().signInWithGoogle();
    } catch (e) {
      message(friendly(e));
      busy(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    const email = root.querySelector("#auth-email").value.trim();
    const password = root.querySelector("#auth-pass").value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return message("Enter a valid email address.");
    if (password.length < 6) return message("Use a password with at least 6 characters.");

    const signup = mode === "signup";
    busy(true, signup ? "Creating account…" : "Logging in…");
    try {
      if (signup) {
        const { needsConfirmation } = await auth().signUp(email, password);
        if (needsConfirmation) {
          setMode("login");
          busy(false);
          message(`Check ${email} for a confirmation link, then log in here.`, "info");
          return;
        }
      } else {
        await auth().signIn(email, password);
      }
      close(); // the app's auth listener pulls and merges cloud data
    } catch (err) {
      busy(false);
      setMode(mode);
      message(friendly(err));
    }
  }

  function onKey(e) {
    if (!root) return;
    if (e.key === "Escape") {
      e.preventDefault();
      continueAsGuest();
      return;
    }
    if (e.key === "Tab") {
      const items = [...root.querySelectorAll("button:not(:disabled), input")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    // Capture-phase stop: the app's feed shortcuts never see keys typed here.
    e.stopPropagation();
  }

  SW.onboarding = { open, close, isOpen };
})();
