/**
 * CodeItAll learner profile + learning history (this device, localStorage).
 * No server accounts — data stays in the browser until the user clears it.
 */
(function (global) {
  const STORAGE_KEY = "cia_profile_v1";
  const TOKEN_KEY = "cia_auth_token";
  const EMAIL_KEY = "cia_auth_email";
  const AUTH_API = "/api/auth";
  const MAX_HISTORY = 400;
  const TRACK_LABELS = {
    python: "Python",
    cpp: "C++",
    javascript: "JavaScript",
    html: "HTML",
    sql: "SQL",
    dissect: "Dissect",
    profile: "Profile",
    career: "Career Lab",
  };
  const TYPE_LABELS = {
    opened: "Opened",
    ran_step: "Ran a step",
    ran_all: "Ran all steps",
    completed: "Marked complete",
    asked_ai: "Asked AI",
    dissected: "Dissected a site",
    renamed: "Updated profile",
  };

  function uid() {
    if (global.crypto?.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function defaultProfile() {
    return {
      id: uid(),
      displayName: "Learner",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      completions: {},
      history: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const fresh = defaultProfile();
        save(fresh);
        return fresh;
      }
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") throw new Error("bad");
      if (!data.id) data.id = uid();
      if (!data.displayName) data.displayName = "Learner";
      if (!data.completions || typeof data.completions !== "object") data.completions = {};
      if (!Array.isArray(data.history)) data.history = [];
      return data;
    } catch (_) {
      const fresh = defaultProfile();
      save(fresh);
      return fresh;
    }
  }

  function save(data) {
    data.updatedAt = nowIso();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    schedulePush();
    return data;
  }

  /* ------------------------------------------------------------------ *
   * Accounts + cloud sync
   * ------------------------------------------------------------------ */
  function getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY) || "";
    } catch (_) {
      return "";
    }
  }

  function getAuth() {
    return { token: getToken(), email: localStorage.getItem(EMAIL_KEY) || "" };
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function setAuth(token, email) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (email) localStorage.setItem(EMAIL_KEY, email);
  }

  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EMAIL_KEY);
  }

  async function authFetch(path, options = {}) {
    const headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(AUTH_API + path, { ...options, headers });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {
      data = {};
    }
    if (!res.ok) {
      const err = new Error(data.detail || data.message || `Request failed (${res.status})`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  function mergeProfiles(local, remote) {
    if (!remote || typeof remote !== "object") return local;
    const out = {
      id: local.id || remote.id || uid(),
      displayName:
        local.displayName && local.displayName !== "Learner"
          ? local.displayName
          : remote.displayName || local.displayName || "Learner",
      createdAt:
        [local.createdAt, remote.createdAt].filter(Boolean).sort()[0] || nowIso(),
      updatedAt: nowIso(),
      completions: {},
      history: [],
    };
    // Completions: union, keep the latest per key.
    const lc = local.completions || {};
    const rc = remote.completions || {};
    for (const key of new Set([...Object.keys(lc), ...Object.keys(rc)])) {
      const a = lc[key];
      const b = rc[key];
      if (a && b) out.completions[key] = (a.at || "") >= (b.at || "") ? a : b;
      else out.completions[key] = a || b;
    }
    // History: union by id, newest first, capped.
    const seen = new Set();
    const all = [...(local.history || []), ...(remote.history || [])];
    all.sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));
    for (const h of all) {
      const key = h.id || `${h.at}:${h.type}:${h.projectId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.history.push(h);
      if (out.history.length >= MAX_HISTORY) break;
    }
    return out;
  }

  let pushTimer = null;
  function schedulePush() {
    if (!isLoggedIn()) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(pushNow, 900);
  }

  async function pushNow() {
    if (!isLoggedIn()) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const data = raw ? JSON.parse(raw) : load();
      await authFetch("/progress", { method: "PUT", body: JSON.stringify({ data }) });
    } catch (_) {
      /* offline / token expired — keep local copy */
    }
  }

  async function pullAndMerge() {
    if (!isLoggedIn()) return load();
    try {
      const res = await authFetch("/progress", { method: "GET" });
      const local = load();
      const merged = mergeProfiles(local, res.data || {});
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      await pushNow();
      return merged;
    } catch (e) {
      if (e.status === 401) clearAuth();
      return load();
    }
  }

  async function register(email, password) {
    const data = await authFetch("/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuth(data.token, data.email);
    await pullAndMerge();
    return data;
  }

  async function login(email, password) {
    const data = await authFetch("/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setAuth(data.token, data.email);
    await pullAndMerge();
    return data;
  }

  async function logout() {
    try {
      await authFetch("/logout", { method: "POST" });
    } catch (_) {
      /* ignore */
    }
    clearAuth();
  }

  async function changePassword(oldPassword, newPassword) {
    return authFetch("/change-password", {
      method: "POST",
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    });
  }

  async function forgotPassword(email) {
    return authFetch("/forgot", { method: "POST", body: JSON.stringify({ email }) });
  }

  async function resetPassword(token, newPassword) {
    return authFetch("/reset", {
      method: "POST",
      body: JSON.stringify({ token, new_password: newPassword }),
    });
  }

  function completionKey(track, projectId) {
    return `${track}:${projectId}`;
  }

  function getProfile() {
    const p = load();
    return {
      id: p.id,
      displayName: p.displayName,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  function setDisplayName(name) {
    const p = load();
    const next = String(name || "").trim().slice(0, 48) || "Learner";
    const prev = p.displayName;
    p.displayName = next;
    if (prev !== next) {
      p.history.unshift({
        id: uid(),
        at: nowIso(),
        track: "profile",
        type: "renamed",
        projectId: "",
        projectTitle: "",
        detail: `Name set to “${next}”`,
      });
      if (p.history.length > MAX_HISTORY) p.history.length = MAX_HISTORY;
    }
    save(p);
    return getProfile();
  }

  function track(evt) {
    const p = load();
    const entry = {
      id: uid(),
      at: nowIso(),
      track: String(evt.track || "lab"),
      type: String(evt.type || "opened"),
      projectId: String(evt.projectId || ""),
      projectTitle: String(evt.projectTitle || ""),
      detail: String(evt.detail || "").slice(0, 240),
    };
    // Dedupe noisy reopen of same project within 20s
    const last = p.history[0];
    if (
      last &&
      entry.type === "opened" &&
      last.type === "opened" &&
      last.track === entry.track &&
      last.projectId === entry.projectId &&
      Date.now() - Date.parse(last.at) < 20000
    ) {
      return entry;
    }
    p.history.unshift(entry);
    if (p.history.length > MAX_HISTORY) p.history.length = MAX_HISTORY;
    save(p);
    return entry;
  }

  function markComplete(trackName, projectId, projectTitle) {
    if (!trackName || !projectId) return null;
    const p = load();
    const key = completionKey(trackName, projectId);
    const existed = !!p.completions[key];
    p.completions[key] = {
      at: nowIso(),
      title: projectTitle || projectId,
      track: trackName,
      projectId,
    };
    if (!existed) {
      p.history.unshift({
        id: uid(),
        at: nowIso(),
        track: trackName,
        type: "completed",
        projectId,
        projectTitle: projectTitle || projectId,
        detail: "Marked complete",
      });
      if (p.history.length > MAX_HISTORY) p.history.length = MAX_HISTORY;
    }
    save(p);
    return p.completions[key];
  }

  function unmarkComplete(trackName, projectId) {
    const p = load();
    delete p.completions[completionKey(trackName, projectId)];
    save(p);
  }

  function isComplete(trackName, projectId) {
    return !!load().completions[completionKey(trackName, projectId)];
  }

  function getHistory(limit) {
    const n = Math.max(1, Math.min(MAX_HISTORY, limit || 100));
    return load().history.slice(0, n);
  }

  function getCompletions() {
    return { ...load().completions };
  }

  function getStats() {
    const p = load();
    const byTrack = {};
    Object.values(p.completions).forEach((c) => {
      const t = c.track || "other";
      byTrack[t] = (byTrack[t] || 0) + 1;
    });
    const types = {};
    p.history.forEach((h) => {
      types[h.type] = (types[h.type] || 0) + 1;
    });
    return {
      displayName: p.displayName,
      completedCount: Object.keys(p.completions).length,
      historyCount: p.history.length,
      byTrack,
      types,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  function clearHistory() {
    const p = load();
    p.history = [];
    save(p);
  }

  function clearAll() {
    localStorage.removeItem(STORAGE_KEY);
    return load();
  }

  function paintList(listEl, trackName) {
    if (!listEl) return;
    listEl.querySelectorAll(".project-item[data-id]").forEach((el) => {
      const done = isComplete(trackName, el.dataset.id);
      el.classList.toggle("done", done);
      el.setAttribute("data-done", done ? "1" : "0");
    });
  }

  function noteOpen(trackName, project) {
    if (!project) return;
    track({
      track: trackName,
      type: "opened",
      projectId: project.id,
      projectTitle: project.title,
      detail: `Opened in ${TRACK_LABELS[trackName] || trackName} Lab`,
    });
  }

  function noteRunStep(trackName, project, stepIdx, ok) {
    if (!project || !ok) return;
    track({
      track: trackName,
      type: "ran_step",
      projectId: project.id,
      projectTitle: project.title,
      detail: `Step ${(stepIdx ?? 0) + 1} succeeded`,
    });
  }

  function noteRunAll(trackName, project, ok) {
    if (!project) return;
    track({
      track: trackName,
      type: "ran_all",
      projectId: project.id,
      projectTitle: project.title,
      detail: ok ? "Finished every step" : "Stopped early (error)",
    });
    if (ok) markComplete(trackName, project.id, project.title);
  }

  function noteAi(trackName, project) {
    if (!project) return;
    track({
      track: trackName,
      type: "asked_ai",
      projectId: project.id,
      projectTitle: project.title,
      detail: "Asked AI Assist",
    });
  }

  function noteDissect(url, title) {
    track({
      track: "dissect",
      type: "dissected",
      projectId: url || "",
      projectTitle: title || url || "Website",
      detail: `Inspected ${url || "a URL"}`,
    });
  }

  function formatWhen(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_) {
      return iso;
    }
  }

  function typeLabel(type) {
    return TYPE_LABELS[type] || type;
  }

  function trackLabel(trackName) {
    return TRACK_LABELS[trackName] || trackName;
  }

  function exportJson() {
    return JSON.stringify(load(), null, 2);
  }

  global.CIAProgress = {
    STORAGE_KEY,
    getProfile,
    setDisplayName,
    // accounts + cloud sync
    isLoggedIn,
    getAuth,
    register,
    login,
    logout,
    changePassword,
    forgotPassword,
    resetPassword,
    pullAndMerge,
    syncNow: pushNow,
    track,
    markComplete,
    unmarkComplete,
    isComplete,
    getHistory,
    getCompletions,
    getStats,
    clearHistory,
    clearAll,
    paintList,
    noteOpen,
    noteRunStep,
    noteRunAll,
    noteAi,
    noteDissect,
    formatWhen,
    typeLabel,
    trackLabel,
    exportJson,
  };
})(typeof window !== "undefined" ? window : globalThis);
