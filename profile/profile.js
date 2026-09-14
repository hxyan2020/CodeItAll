const $ = (sel, root = document) => root.querySelector(sel);

const LAB_HREF = {
  python: "../lab/?project=",
  cpp: "../cpp/lab/?project=",
  javascript: "../js/lab/?project=",
  html: "../html/lab/?project=",
  sql: "../sql/lab/?project=",
  dissect: "../dissect/?url=",
};

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function render() {
  const P = window.CIAProgress;
  if (!P) return;

  const profile = P.getProfile();
  const stats = P.getStats();
  $("#heroName").textContent = profile.displayName;
  const storage = P.isLoggedIn() ? "synced to your account" : "stored on this device";
  $("#profileMeta").textContent = `Profile started ${P.formatWhen(profile.createdAt)} · last activity ${P.formatWhen(
    profile.updatedAt
  )} · ${storage}`;
  renderAuth();

  const trackBits = Object.entries(stats.byTrack)
    .map(([t, n]) => `${P.trackLabel(t)} ${n}`)
    .join(" · ");

  $("#statsRow").innerHTML = [
    ["Completed", String(stats.completedCount)],
    ["History events", String(stats.historyCount)],
    ["Tracks touched", String(Object.keys(stats.byTrack).length || 0)],
    ["Top detail", trackBits || "Start a lab to begin"],
  ]
    .map(
      ([label, value]) =>
        `<article class="stat"><strong title="${escapeHtml(value)}">${escapeHtml(
          value.length > 28 ? value.slice(0, 26) + "…" : value
        )}</strong><span>${escapeHtml(label)}</span></article>`
    )
    .join("");

  const completions = Object.values(P.getCompletions()).sort((a, b) =>
    String(b.at).localeCompare(String(a.at))
  );
  const doneHost = $("#doneList");
  if (!completions.length) {
    doneHost.innerHTML =
      '<li class="empty">Nothing marked complete yet. Open a lab, run the steps, or tap <em>Mark complete</em>.</li>';
  } else {
    doneHost.innerHTML = completions
      .map((c) => {
        const base = LAB_HREF[c.track] || "../lab/?project=";
        const href =
          c.track === "dissect"
            ? base + encodeURIComponent(c.projectId)
            : base + encodeURIComponent(c.projectId);
        return `<li>
          <a href="${href}">${escapeHtml(c.title || c.projectId)}</a>
          <div class="meta">
            <span class="chip ${escapeHtml(c.track)}">${escapeHtml(P.trackLabel(c.track))}</span>
            <span>${escapeHtml(P.formatWhen(c.at))}</span>
          </div>
        </li>`;
      })
      .join("");
  }

  const history = P.getHistory(80);
  const histHost = $("#historyList");
  if (!history.length) {
    histHost.innerHTML =
      '<li class="empty">Your learning history will appear here as you use the labs and Website Dissect.</li>';
  } else {
    histHost.innerHTML = history
      .map((h) => {
        const title = h.projectTitle || h.projectId || P.typeLabel(h.type);
        return `<li>
          <div class="title">${escapeHtml(title)}</div>
          <div class="meta">
            <span class="chip ${escapeHtml(h.track)}">${escapeHtml(P.trackLabel(h.track))}</span>
            <span>${escapeHtml(P.typeLabel(h.type))}</span>
            <span>${escapeHtml(P.formatWhen(h.at))}</span>
            ${h.detail ? `<span>${escapeHtml(h.detail)}</span>` : ""}
          </div>
        </li>`;
      })
      .join("");
  }
}

let authMode = "login"; // "login" | "register"
let accountMe = null; // /auth/me payload when signed in

function setNote(sel, msg, kind = "") {
  const el = $(sel);
  if (!el) return;
  el.textContent = msg || "";
  el.className = "auth-note" + (kind ? " " + kind : "");
}

function providerLabel(me) {
  if (!me) return "—";
  const parts = [];
  if (me.hasGoogle) parts.push("Google");
  if (me.hasPassword) parts.push("Email & password");
  if (!parts.length) {
    const p = String(me.authProvider || "");
    if (p.includes("google")) parts.push("Google");
    if (p.includes("password")) parts.push("Email & password");
  }
  return parts.join(" + ") || "Account";
}

function configurePasswordForm(me) {
  const hasPw = !!(me && me.hasPassword);
  const oldInput = $("#oldPw");
  const oldLabel = $("#oldPwLabel");
  const hint = $("#pwHint");
  const btn = $("#togglePwBtn");
  if (btn) btn.textContent = hasPw ? "Reset password" : "Set a password";
  if (hint) {
    hint.textContent = hasPw
      ? "Enter your current password, then choose a new one."
      : "This account signed in with Google. Set a password so you can also use email sign-in.";
  }
  if (oldInput && oldLabel) {
    oldInput.classList.toggle("hide", !hasPw);
    oldLabel.classList.toggle("hide", !hasPw);
    oldInput.required = hasPw;
    if (!hasPw) oldInput.value = "";
  }
}

async function refreshAccountMe() {
  const P = window.CIAProgress;
  accountMe = null;
  if (!P.isLoggedIn()) return null;
  try {
    accountMe = await P.fetchMe();
  } catch (_) {
    accountMe = {
      email: P.getAuth().email,
      hasPassword: true,
      hasGoogle: false,
      authProvider: "password",
    };
  }
  return accountMe;
}

function renderAuth() {
  const P = window.CIAProgress;
  const loggedIn = P.isLoggedIn();
  $("#authOut").classList.toggle("hide", loggedIn);
  $("#authIn").classList.toggle("hide", !loggedIn);
  if (loggedIn) {
    const email = (accountMe && accountMe.email) || P.getAuth().email || "your account";
    $("#authEmailLabel").textContent = email;
    $("#authProviderLabel").textContent = providerLabel(accountMe);
    $("#authLead").textContent = "Your progress is saved to your account and syncs across devices.";
    configurePasswordForm(accountMe);
  } else {
    $("#authLead").textContent =
      "Sign in to save your progress to the cloud and pick up on any device.";
    accountMe = null;
  }
}

function setAuthMode(mode) {
  authMode = mode === "register" ? "register" : "login";
  document.querySelectorAll(".auth-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.mode === authMode);
  });
  $("#authSubmit").textContent = authMode === "register" ? "Create account" : "Sign in";
  $("#authPassword").setAttribute(
    "autocomplete",
    authMode === "register" ? "new-password" : "current-password"
  );
  setNote("#authNote", "");
}

function wireAuth() {
  const P = window.CIAProgress;

  document.querySelectorAll(".auth-tab").forEach((t) =>
    t.addEventListener("click", () => setAuthMode(t.dataset.mode))
  );

  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = $("#authEmail").value.trim();
    const password = $("#authPassword").value;
    const btn = $("#authSubmit");
    btn.disabled = true;
    setNote("#authNote", authMode === "register" ? "Creating your account…" : "Signing in…");
    try {
      if (authMode === "register") await P.register(email, password);
      else await P.login(email, password);
      setNote("#authNote", "");
      $("#authPassword").value = "";
      await refreshAccountMe();
      render();
    } catch (err) {
      setNote("#authNote", String(err.message || err), "err");
    } finally {
      btn.disabled = false;
    }
  });

  $("#forgotLink").addEventListener("click", async () => {
    const email = $("#authEmail").value.trim();
    if (!email) {
      setNote("#authNote", "Enter your email above first, then tap “Forgot password?”.", "err");
      return;
    }
    setNote("#authNote", "Sending a reset link…");
    try {
      const res = await P.forgotPassword(email);
      setNote(
        "#authNote",
        res.email_delivery
          ? "Check your inbox for a reset link (expires in 1 hour)."
          : "If that email has an account, a reset link is on its way.",
        "ok"
      );
    } catch (err) {
      setNote("#authNote", String(err.message || err), "err");
    }
  });

  $("#logoutBtn").addEventListener("click", async () => {
    await P.logout();
    accountMe = null;
    $("#changePwForm").classList.add("hide");
    render();
  });

  $("#togglePwBtn").addEventListener("click", () => {
    $("#changePwForm").classList.toggle("hide");
    configurePasswordForm(accountMe);
    setNote("#authNoteIn", "");
  });

  $("#changePwForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    setNote("#authNoteIn", "Updating password…");
    try {
      const oldPw = accountMe && !accountMe.hasPassword ? "" : $("#oldPw").value;
      await P.changePassword(oldPw, $("#newPw").value);
      $("#oldPw").value = "";
      $("#newPw").value = "";
      $("#changePwForm").classList.add("hide");
      await refreshAccountMe();
      renderAuth();
      setNote("#authNoteIn", "Password updated. You can sign in with email next time.", "ok");
    } catch (err) {
      setNote("#authNoteIn", String(err.message || err), "err");
    }
  });

  initGoogleSignIn(P);
}

async function handleGoogleCredential(response) {
  const P = window.CIAProgress;
  const cred = response && response.credential;
  if (!cred) {
    setNote("#authNote", "Google did not return a credential. Try again.", "err");
    return;
  }
  setNote("#authNote", "Signing in with Google…");
  try {
    await P.loginWithGoogle(cred);
    setNote("#authNote", "");
    await refreshAccountMe();
    render();
  } catch (err) {
    setNote("#authNote", String(err.message || err), "err");
  }
}

function renderGoogleButton(clientId) {
  const host = $("#googleBtnHost");
  if (!host || !window.google?.accounts?.id) return false;
  host.innerHTML = "";
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: handleGoogleCredential,
    auto_select: false,
    cancel_on_tap_outside: true,
    context: "signin",
    ux_mode: "popup",
  });
  window.google.accounts.id.renderButton(host, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(420, host.clientWidth || 320),
  });
  return true;
}

async function initGoogleSignIn(P) {
  const block = $("#googleAuthBlock");
  const note = $("#googleFallbackNote");
  if (!block) return;

  // Always show the Google block so users see the option; hide divider if disabled.
  block.hidden = false;

  let config = { googleEnabled: false, googleClientId: "" };
  try {
    config = await P.fetchAuthConfig();
  } catch (_) {
    /* ignore */
  }

  if (!config.googleEnabled || !config.googleClientId) {
    if (note) note.hidden = false;
    return;
  }
  if (note) note.hidden = true;

  const tryRender = () => {
    if (renderGoogleButton(config.googleClientId)) return true;
    return false;
  };
  if (tryRender()) return;

  // GIS script loads async — retry briefly.
  let tries = 0;
  const timer = setInterval(() => {
    tries += 1;
    if (tryRender() || tries > 40) clearInterval(timer);
  }, 250);
}

function wire() {
  const header = $("#header");
  const toggle = $("#menuToggle");
  toggle?.addEventListener("click", () => {
    const open = header.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.querySelectorAll("#nav a").forEach((a) =>
    a.addEventListener("click", () => {
      header.classList.remove("open");
      toggle?.setAttribute("aria-expanded", "false");
    })
  );

  $("#clearHistoryBtn").addEventListener("click", () => {
    if (!confirm("Clear learning history events? Completed projects stay marked.")) return;
    window.CIAProgress.clearHistory();
    render();
  });

  $("#resetBtn").addEventListener("click", () => {
    if (!confirm("Reset your whole profile on this device? This cannot be undone.")) return;
    window.CIAProgress.clearAll();
    render();
  });

  wireAuth();
  render();

  // If already signed in, pull the latest cloud copy and re-render.
  if (window.CIAProgress.isLoggedIn()) {
    Promise.all([window.CIAProgress.pullAndMerge(), refreshAccountMe()])
      .then(() => render())
      .catch(() => {});
  }
}

wire();
