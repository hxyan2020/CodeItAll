/**
 * CodeItAll Website Dissect — client UI
 */
const state = {
  report: null,
  busy: false,
  activeSrc: "html",
};

const SRC_VIEWS = {
  html: { view: "#htmlView", key: "html", empty: "No HTML was returned." },
  css: { view: "#cssView", key: "css", empty: "No inline <style> CSS found on this page." },
  js: { view: "#jsView", key: "js", empty: "No inline <script> code found on this page." },
};

const $ = (sel, root = document) => root.querySelector(sel);

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setStatus(msg, kind = "") {
  const el = $("#statusLine");
  el.textContent = msg;
  el.className = "fine" + (kind ? " " + kind : "");
}

function renderAccess(notes) {
  const host = $("#accessNotes");
  host.innerHTML = (notes || [])
    .map((n) => {
      const cls = n.level === "block" ? "block" : n.level === "warn" ? "warn" : "info";
      return `<article class="note ${cls}"><h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(
        n.detail
      )}</p></article>`;
    })
    .join("");
}

function renderMeta(report) {
  $("#metaRow").innerHTML = [
    ["Status", String(report.status)],
    ["Title", report.title],
    ["Final URL", report.final_url],
    ["Bytes", String(report.bytes)],
    ["Truncated", report.truncated ? "yes" : "no"],
  ]
    .map(
      ([k, v]) =>
        `<div class="pill"><strong>${escapeHtml(k)}</strong><span>${escapeHtml(v)}</span></div>`
    )
    .join("");
}

function renderOverview(ov) {
  const panel = $("#overviewPanel");
  if (!ov) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  $("#overviewSummary").textContent = ov.summary || "No description was available in the public HTML.";
  const kind = $("#overviewKind");
  if (ov.product) {
    kind.textContent = ov.product;
    kind.hidden = false;
  } else {
    kind.hidden = true;
  }
  const tags = ov.tech || [];
  $("#techTags").innerHTML = tags.length
    ? tags.map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`).join("")
    : '<span class="tech-none">No common frameworks or libraries were detected in the public HTML.</span>';
}

function renderStructure(s) {
  const tags = Object.entries(s.tag_counts || {})
    .slice(0, 12)
    .map(([t, c]) => `<li><code>&lt;${escapeHtml(t)}&gt;</code> × ${c}</li>`)
    .join("");
  const heads = (s.headings || [])
    .slice(0, 10)
    .map((h) => `<li><strong>${escapeHtml(h.level)}</strong> ${escapeHtml(h.text || "")}</li>`)
    .join("");
  $("#structureSummary").innerHTML = `
    <p><strong>Landmarks:</strong> ${(s.landmarks || []).join(", ") || "none detected"}</p>
    <p><strong>Counts:</strong> ${(s.sample_links || []).length} sample links · ${(s.forms || []).length} forms · ${(s.scripts || []).length} scripts · ${(s.images || []).length} images</p>
    <p><strong>Top tags</strong></p><ul>${tags}</ul>
    <p><strong>Headings</strong></p><ul>${heads || "<li>(none)</li>"}</ul>
  `;
}

function renderWalk(steps) {
  $("#walkthrough").innerHTML = (steps || [])
    .map(
      (st) =>
        `<li><h3>${escapeHtml(st.heading)}</h3><p>${escapeHtml(st.body || "")}</p></li>`
    )
    .join("");
}

function renderSource(report) {
  const highlight = (el) => {
    if (window.hljs && el.textContent) {
      el.removeAttribute("data-highlighted");
      window.hljs.highlightElement(el);
    }
  };
  Object.entries(SRC_VIEWS).forEach(([name, cfg]) => {
    const el = $(cfg.view);
    const code = report[cfg.key] || "";
    el.className = el.className.replace(/\s*hljs\b/g, "");
    el.textContent = code || cfg.empty;
    el.classList.toggle("empty", !code);
    if (code) highlight(el);
    const tab = $(`.src-tab[data-src="${name}"]`);
    if (tab) tab.classList.toggle("has-code", !!code);
  });
  switchSrc("html");
}

function switchSrc(name) {
  state.activeSrc = name;
  document.querySelectorAll(".src-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.src === name);
  });
  document.querySelectorAll(".src-pane").forEach((p) => {
    p.classList.toggle("hide", p.dataset.src !== name);
  });
}

function showReport(report) {
  state.report = report;
  $("#results").hidden = false;
  renderMeta(report);
  renderOverview(report.overview);
  renderAccess(report.access_notes);
  renderStructure(report.structure || {});
  renderWalk(report.walkthrough);
  renderSource(report);
  $("#chatLog").innerHTML = "";
  pushChat(
    "assistant",
    "I’ve dissected the public HTML. What do you want to do next? Pick a chip or type a request in plain language."
  );
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

async function runDissect(url) {
  if (state.busy) return;
  state.busy = true;
  $("#goBtn").disabled = true;
  setStatus("Fetching public HTML…", "");
  try {
    const res = await fetch("/api/dissect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.detail || data.message || `Request failed (${res.status})`);
    }
    showReport(data);
    window.CIAProgress?.noteDissect?.(data.final_url || url, data.title || url);
    setStatus(data.disclaimer || "Done.", "ok");
  } catch (err) {
    setStatus(String(err.message || err), "err");
  } finally {
    state.busy = false;
    $("#goBtn").disabled = false;
  }
}

function pushChat(role, text) {
  const box = $("#chatLog");
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  const html = escapeHtml(text)
    .replace(/```([\s\S]*?)```/g, "<pre>$1</pre>")
    .replace(/\n/g, "<br>");
  el.innerHTML = `<div class="who">${role === "user" ? "You" : "Dissect coach"}</div>${html}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function dissectContext() {
  const r = state.report;
  if (!r) return "";
  const blocked = (r.access_notes || [])
    .filter((n) => n.level === "block" || n.level === "warn")
    .map((n) => `- ${n.title}: ${n.detail}`)
    .join("\n");
  const heads = (r.structure?.headings || [])
    .slice(0, 12)
    .map((h) => `${h.level}: ${h.text}`)
    .join(" | ");
  return [
    `Inspected URL: ${r.final_url}`,
    `Title: ${r.title}`,
    `HTTP status: ${r.status}`,
    `Landmarks: ${(r.structure?.landmarks || []).join(", ")}`,
    `Headings: ${heads}`,
    `Access notes:\n${blocked}`,
    `HTML excerpt (truncated):\n${(r.html || "").slice(0, 6000)}`,
    r.css ? `Inline CSS excerpt (truncated):\n${r.css.slice(0, 2500)}` : "",
    r.js ? `Inline JS excerpt (truncated):\n${r.js.slice(0, 2500)}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function askCustomize(question) {
  const q = (question || "").trim();
  if (!q || !state.report) return;
  pushChat("user", q);
  pushChat("assistant", "Thinking…");
  const thinking = $("#chatLog").lastElementChild;

  const payload = {
    message: q,
    language: "dissect",
    project_title: `Dissect: ${state.report.title}`,
    project_description: dissectContext(),
    code: (state.report.html || "").slice(0, 12000),
  };

  try {
    const res = await fetch("/api/assist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    let reply = "";
    if (res.ok) {
      const data = await res.json();
      reply = data.reply || data.choices?.[0]?.message?.content || "";
    }
    if (!reply) {
      reply = offlineCustomize(q);
    }
    thinking.innerHTML = `<div class="who">Dissect coach</div>${escapeHtml(reply)
      .replace(/```([\s\S]*?)```/g, "<pre>$1</pre>")
      .replace(/\n/g, "<br>")}`;
  } catch (err) {
    thinking.innerHTML = `<div class="who">Dissect coach</div>${escapeHtml(
      offlineCustomize(q) + "\n\n(Note: " + String(err.message || err) + ")"
    ).replace(/\n/g, "<br>")}`;
  }
}

function offlineCustomize(q) {
  const r = state.report;
  const blocks = (r.access_notes || []).filter((n) => n.level === "block");
  const parts = [
    "Here’s a plain-language plan based on the public HTML only:",
    "",
    `1) Page title: “${r.title}”.`,
    `2) Landmarks spotted: ${(r.structure?.landmarks || []).join(", ") || "mostly generic containers"}.`,
    `3) Forms: ${(r.structure?.forms || []).length}; scripts: ${(r.structure?.scripts || []).length}.`,
  ];
  if (blocks.length) {
    parts.push(
      "",
      "Blocked / unavailable pieces:",
      ...blocks.map((b) => `- ${b.title}: ${b.detail}`)
    );
  }
  parts.push(
    "",
    `Your goal: ${q}`,
    "",
    "Suggested next step: open HTML Lab and rebuild a tiny skeleton with header / main / footer matching the headings list — don’t copy brand assets or paywalled text."
  );
  return parts.join("\n");
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

  $("#dissectForm").addEventListener("submit", (e) => {
    e.preventDefault();
    runDissect($("#urlInput").value.trim());
  });

  $("#srcTabs")?.addEventListener("click", (e) => {
    const tab = e.target.closest(".src-tab");
    if (tab) switchSrc(tab.dataset.src);
  });

  $("#copyHtmlBtn").addEventListener("click", async () => {
    const key = state.activeSrc || "html";
    const label = key.toUpperCase();
    try {
      await navigator.clipboard.writeText(state.report?.[key] || "");
      setStatus(`${label} copied to clipboard.`, "ok");
    } catch (_) {
      setStatus("Could not copy — select the code manually.", "err");
    }
  });

  $("#chips").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-q]");
    if (!btn) return;
    $("#chatInput").value = btn.dataset.q;
    askCustomize(btn.dataset.q);
  });

  $("#chatForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = $("#chatInput").value;
    $("#chatInput").value = "";
    askCustomize(q);
  });

  const params = new URLSearchParams(location.search);
  const q = params.get("url");
  if (q) {
    $("#urlInput").value = q;
    runDissect(q);
  }
}

wire();
