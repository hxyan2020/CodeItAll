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

const COUNTRY_DIALS = [
  ["SG", "+65", "Singapore"],
  ["US", "+1", "United States"],
  ["GB", "+44", "United Kingdom"],
  ["AU", "+61", "Australia"],
  ["IN", "+91", "India"],
  ["CN", "+86", "China"],
  ["HK", "+852", "Hong Kong"],
  ["MO", "+853", "Macau"],
  ["TW", "+886", "Taiwan"],
  ["MY", "+60", "Malaysia"],
  ["ID", "+62", "Indonesia"],
  ["TH", "+66", "Thailand"],
  ["PH", "+63", "Philippines"],
  ["VN", "+84", "Vietnam"],
  ["JP", "+81", "Japan"],
  ["KR", "+82", "South Korea"],
  ["AE", "+971", "United Arab Emirates"],
  ["SA", "+966", "Saudi Arabia"],
  ["QA", "+974", "Qatar"],
  ["KW", "+965", "Kuwait"],
  ["BH", "+973", "Bahrain"],
  ["OM", "+968", "Oman"],
  ["IL", "+972", "Israel"],
  ["TR", "+90", "Turkey"],
  ["ZA", "+27", "South Africa"],
  ["NG", "+234", "Nigeria"],
  ["KE", "+254", "Kenya"],
  ["EG", "+20", "Egypt"],
  ["GH", "+233", "Ghana"],
  ["CA", "+1", "Canada"],
  ["MX", "+52", "Mexico"],
  ["BR", "+55", "Brazil"],
  ["AR", "+54", "Argentina"],
  ["CL", "+56", "Chile"],
  ["CO", "+57", "Colombia"],
  ["PE", "+51", "Peru"],
  ["DE", "+49", "Germany"],
  ["FR", "+33", "France"],
  ["ES", "+34", "Spain"],
  ["IT", "+39", "Italy"],
  ["NL", "+31", "Netherlands"],
  ["BE", "+32", "Belgium"],
  ["CH", "+41", "Switzerland"],
  ["AT", "+43", "Austria"],
  ["SE", "+46", "Sweden"],
  ["NO", "+47", "Norway"],
  ["DK", "+45", "Denmark"],
  ["FI", "+358", "Finland"],
  ["IE", "+353", "Ireland"],
  ["PT", "+351", "Portugal"],
  ["PL", "+48", "Poland"],
  ["CZ", "+420", "Czechia"],
  ["RO", "+40", "Romania"],
  ["HU", "+36", "Hungary"],
  ["GR", "+30", "Greece"],
  ["UA", "+380", "Ukraine"],
  ["RU", "+7", "Russia"],
  ["KZ", "+7", "Kazakhstan"],
  ["PK", "+92", "Pakistan"],
  ["BD", "+880", "Bangladesh"],
  ["LK", "+94", "Sri Lanka"],
  ["NP", "+977", "Nepal"],
  ["MM", "+95", "Myanmar"],
  ["KH", "+855", "Cambodia"],
  ["LA", "+856", "Laos"],
  ["BN", "+673", "Brunei"],
  ["NZ", "+64", "New Zealand"],
  ["FJ", "+679", "Fiji"],
];

function sessionMethodLabel(method) {
  const m = String(method || "").toLowerCase();
  if (m === "google") return "Google";
  if (m === "sms" || m === "phone") return "Phone SMS";
  if (m === "password") return "Email & password";
  return "Account";
}

function providerLabel(me) {
  if (!me) return "—";
  const parts = [];
  if (me.hasGoogle) parts.push("Google");
  if (me.hasPhone) parts.push("Phone SMS");
  if (me.hasPassword) parts.push("Email & password");
  if (!parts.length) {
    const p = String(me.authProvider || me.loginMethod || "");
    if (p.includes("google")) parts.push("Google");
    if (p.includes("sms") || p.includes("phone")) parts.push("Phone SMS");
    if (p.includes("password")) parts.push("Email & password");
  }
  return parts.join(" + ") || "Account";
}

function configurePasswordForm(me) {
  const canReset = !!(me && (me.canResetPassword || me.hasPassword));
  const btn = $("#togglePwBtn");
  const form = $("#changePwForm");
  if (btn) {
    btn.classList.toggle("hide", !canReset);
    btn.textContent = "Reset password";
  }
  if (form && !canReset) form.classList.add("hide");
  const hint = $("#pwHint");
  if (hint) hint.textContent = "Enter your current password, then choose a new one.";
  const oldInput = $("#oldPw");
  const oldLabel = $("#oldPwLabel");
  if (oldInput && oldLabel) {
    oldInput.classList.remove("hide");
    oldLabel.classList.remove("hide");
    oldInput.required = canReset;
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
    const identity =
      (accountMe && (accountMe.display || accountMe.phone || accountMe.email)) ||
      P.getAuth().email ||
      "your account";
    $("#authEmailLabel").textContent = identity;
    const sessionEl = $("#authSessionLabel");
    if (sessionEl) {
      sessionEl.textContent = "Signed in with " + sessionMethodLabel(accountMe && accountMe.loginMethod);
    }
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
  initSmsLogin(P);
}

function fillCountrySelect() {
  const sel = $("#smsCountry");
  if (!sel || sel.options.length) return;
  const locale = (navigator.language || "en-SG").toUpperCase();
  const guess = locale.split("-")[1] || "SG";
  COUNTRY_DIALS.forEach(([iso, dial, name]) => {
    const opt = document.createElement("option");
    opt.value = dial;
    opt.textContent = `${name} (${dial})`;
    opt.dataset.iso = iso;
    if (iso === guess) opt.selected = true;
    sel.appendChild(opt);
  });
  const other = document.createElement("option");
  other.value = "";
  other.textContent = "Other — type full number with + country code";
  sel.appendChild(other);
  const prefix = $("#smsPrefix");
  if (prefix) prefix.textContent = sel.value || "+";
  sel.addEventListener("change", () => {
    const p = $("#smsPrefix");
    if (p) p.textContent = sel.value || "+";
    const phone = $("#smsPhone");
    if (phone && !sel.value) phone.placeholder = "+15551234567";
  });
}

function smsPayload() {
  return {
    countryCode: ($("#smsCountry") && $("#smsCountry").value) || "",
    phone: ($("#smsPhone") && $("#smsPhone").value.trim()) || "",
  };
}

async function initSmsLogin(P) {
  fillCountrySelect();
  const block = $("#smsAuthBlock");
  const note = $("#smsFallbackNote");
  const form = $("#smsForm");
  if (!form) return;
  let smsEnabled = true;
  try {
    const config = await P.fetchAuthConfig();
    smsEnabled = !!config.smsEnabled;
  } catch (_) {
    smsEnabled = true;
  }
  if (block) block.hidden = false;
  if (note) note.hidden = smsEnabled;
  form.classList.toggle("hide", !smsEnabled);
  if (!smsEnabled) return;

  let codeSent = false;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#smsSubmit");
    const { countryCode, phone } = smsPayload();
    const codeEl = $("#smsCode");
    const wrap = $("#smsCodeWrap");
    btn.disabled = true;
    try {
      if (!codeSent || !(codeEl && codeEl.value.trim())) {
        setNote("#authNote", "Sending SMS code…");
        const res = await P.requestSmsCode(phone, countryCode);
        codeSent = true;
        if (wrap) wrap.classList.remove("hide");
        if (codeEl) {
          codeEl.required = true;
          codeEl.focus();
        }
        btn.textContent = "Verify & sign in";
        setNote("#authNote", res.message || "Code sent. Check your phone.", "ok");
      } else {
        setNote("#authNote", "Verifying code…");
        await P.loginWithSms(phone, codeEl.value.trim(), countryCode);
        setNote("#authNote", "");
        await refreshAccountMe();
        render();
      }
    } catch (err) {
      setNote("#authNote", String(err.message || err), "err");
    } finally {
      btn.disabled = false;
    }
  });
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
  block.hidden = false;

  // Known production Client ID — used if /api/auth/config is briefly unavailable.
  const FALLBACK_CLIENT_ID =
    "607701003212-pk5nbp8k8lf9cumcm4ait9usbjc2jt6k.apps.googleusercontent.com";

  let config = { googleEnabled: false, googleClientId: "" };
  try {
    config = await P.fetchAuthConfig();
  } catch (_) {
    /* ignore */
  }

  const clientId =
    (config.googleEnabled && config.googleClientId) || FALLBACK_CLIENT_ID;

  if (!clientId) {
    if (note) note.hidden = false;
    return;
  }
  if (note) note.hidden = true;

  const tryRender = () => renderGoogleButton(clientId);
  if (tryRender()) return;

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
