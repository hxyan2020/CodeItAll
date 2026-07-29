/**
 * CodeItAll JS Lab — step editor + in-browser JavaScript runtime
 * Separate track from Python Lab (Pyodide) and C++ Lab (g++).
 */
const state = {
  ready: true,
  busy: false,
  projects: [],
  currentId: null,
  cellEls: [],
  editors: [],
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function setStatus(text, kind = "ready") {
  const el = $("#runtimeStatus");
  if (!el) return;
  el.textContent = text;
  el.className = `status-pill ${kind}`;
}

function renderMarkdown(md) {
  if (!md) return "";
  try {
    if (window.marked?.parse) return window.marked.parse(md, { breaks: true });
  } catch (_) {
    /* fall through */
  }
  return `<p>${escapeHtml(md)}</p>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


const CIA_TRACK = "javascript";

function currentProject() {
  return state.projects.find((p) => p.id === state.currentId) || null;
}

function syncMarkDoneBtn() {
  const btn = $("#markDoneBtn");
  if (!btn) return;
  const p = currentProject();
  const done = !!(p && window.CIAProgress?.isComplete?.(CIA_TRACK, p.id));
  btn.textContent = done ? "Completed ✓" : "Mark complete";
  btn.classList.toggle("is-done", done);
  btn.disabled = !p;
}

function refreshProgressUi() {
  window.CIAProgress?.paintList?.($("#projectList"), CIA_TRACK);
  syncMarkDoneBtn();
}

function toggleMarkDone() {
  const p = currentProject();
  if (!p || !window.CIAProgress) return;
  if (window.CIAProgress.isComplete(CIA_TRACK, p.id)) {
    window.CIAProgress.unmarkComplete(CIA_TRACK, p.id);
  } else {
    window.CIAProgress.markComplete(CIA_TRACK, p.id, p.title);
  }
  refreshProgressUi();
}


function stringifyArg(v) {
  if (typeof v === "string") return v;
  if (typeof v === "undefined") return "undefined";
  if (typeof v === "symbol") return String(v);
  try {
    return typeof v === "object" ? JSON.stringify(v) : String(v);
  } catch (_) {
    return String(v);
  }
}

async function loadProjects() {
  const careerHit = window.CIACareer?.projectsForLab?.(CIA_TRACK);
  let data;
  if (careerHit) {
    data = { projects: careerHit.projects };
    window.CIACareer.injectBanner(careerHit.pack, true);
  } else {
    const res = await fetch("./projects.json", { cache: "no-store" });
    data = await res.json();
  }
  state.projects = data.projects || [];
  const list = $("#projectList");
  list.innerHTML = "";
  state.projects.forEach((p, i) => {
    const btn = document.createElement("button");
    btn.className = "project-item" + (i === 0 ? " active" : "");
    btn.type = "button";
    btn.dataset.id = p.id;
    const level = p.level ? ` · ${p.level}` : "";
    btn.innerHTML = `<strong>${escapeHtml(p.title)}</strong><span>${p.cells.length} steps${level}</span>`;
    btn.addEventListener("click", () => {
      openProject(p.id);
      closeMobilePanels();
      setMobileTab("code");
      $("#mainPane")?.scrollTo({ top: 0, behavior: "smooth" });
    });
    list.appendChild(btn);
  });
  refreshProgressUi();
  if (state.projects[0]) openProject(state.projects[0].id);
}

function destroyEditors() {
  window.LabExplain?.hide?.();
  state.editors.forEach((ed) => {
    try {
      window.LabExplain?.detach?.(ed);
      ed.toTextArea?.();
    } catch (_) {
      /* ignore */
    }
  });
  state.editors = [];
}

function openProject(id) {
  const project = state.projects.find((p) => p.id === id);
  if (!project) return;
  state.currentId = id;
  window.LabExplain?.setProject?.({
    title: project.title || '',
    description: project.description || '',
    id: project.id || '',
  });
  $$(".project-item").forEach((el) => el.classList.toggle("active", el.dataset.id === id));
  $("#projectTitle").textContent = project.title;
  $("#projectDesc").textContent =
    project.description || "Edit steps, run in the browser, ask AI when stuck.";

  destroyEditors();
  const host = $("#cells");
  host.innerHTML = "";
  state.cellEls = [];

  project.cells.forEach((cell, idx) => {
    const wrap = document.createElement("article");
    wrap.className = "cell";
    wrap.dataset.index = String(idx);
    wrap.innerHTML = `
      <div class="step-md">${renderMarkdown(cell.markdown || `### Step ${idx + 1}`)}</div>
      <div class="cell-toolbar">
        <div class="cell-label">Step ${idx + 1}</div>
        <div class="cell-actions">
          <button type="button" class="btn ok run-btn">Run</button>
          <button type="button" class="btn accent ask-btn">Ask AI</button>
        </div>
      </div>
      <textarea class="code-source" spellcheck="false"></textarea>
      <div class="output" aria-live="polite"></div>
    `;
    const ta = $("textarea", wrap);
    ta.value = cell.source || "";
    host.appendChild(wrap);
    state.cellEls.push(wrap);

    let editor = null;
    if (window.CodeMirror) {
      editor = CodeMirror.fromTextArea(ta, {
        mode: "javascript",
        theme: "material-darker",
        lineNumbers: true,
        indentUnit: 2,
        tabSize: 2,
        lineWrapping: true,
        viewportMargin: Infinity,
        extraKeys: {
          "Ctrl-Enter": () => runCell(idx),
          "Cmd-Enter": () => runCell(idx),
          Tab: (cm) => cm.replaceSelection("  ", "end"),
        },
      });
      editor.setSize("100%", Math.max(180, (cell.source || "").split("\n").length * 18 + 48));
      state.editors[idx] = editor;
      window.LabExplain?.attach?.(editor, "javascript");
    }

    $(".run-btn", wrap).addEventListener("click", () => runCell(idx));
    $(".ask-btn", wrap).addEventListener("click", () => {
      askAiForCell(idx);
      openAiPanel();
    });
  });

  requestAnimationFrame(() => {
    state.editors.forEach((ed) => ed?.refresh?.());
  });
}

function getCellSource(idx) {
  const ed = state.editors[idx];
  if (ed) return ed.getValue();
  return $("textarea", state.cellEls[idx])?.value || "";
}

function setCellSource(idx, code) {
  const ed = state.editors[idx];
  if (ed) {
    ed.setValue(code);
    return;
  }
  const ta = $("textarea", state.cellEls[idx]);
  if (ta) ta.value = code;
}

function clearOutput(idx) {
  $(".output", state.cellEls[idx]).innerHTML = "";
}

function appendOutput(idx, nodeOrHtml, isError = false) {
  const out = $(".output", state.cellEls[idx]);
  if (typeof nodeOrHtml === "string") {
    const div = document.createElement("div");
    div.className = isError ? "err" : "";
    div.textContent = nodeOrHtml;
    out.appendChild(div);
  } else {
    out.appendChild(nodeOrHtml);
  }
}

function appendToast(msg) {
  const box = $("#aiMessages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `<div class="who">Lab</div>${escapeHtml(msg)}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function makeLabHelpers(idx) {
  const out = $(".output", state.cellEls[idx]);
  return {
    canvas(w = 320, h = 180) {
      const c = document.createElement("canvas");
      c.width = w;
      c.height = h;
      c.style.display = "block";
      c.style.maxWidth = "100%";
      c.style.marginTop = "0.5rem";
      c.style.borderRadius = "8px";
      out.appendChild(c);
      return c;
    },
    html(markup) {
      const wrap = document.createElement("div");
      wrap.className = "lab-html";
      wrap.style.marginTop = "0.5rem";
      wrap.innerHTML = markup;
      out.appendChild(wrap);
      return wrap;
    },
  };
}

function makeConsole(idx, lines) {
  const write = (kind, args) => {
    const line = args.map(stringifyArg).join(" ");
    lines.push({ kind, line });
    appendOutput(idx, kind === "error" ? "[error] " + line : line, kind === "error");
  };
  return {
    log: (...a) => write("log", a),
    info: (...a) => write("info", a),
    warn: (...a) => write("warn", a),
    error: (...a) => write("error", a),
    clear: () => {
      lines.length = 0;
      clearOutput(idx);
    },
  };
}

async function runCell(idx) {
  if (state.busy) {
    appendOutput(idx, "Already running another step — wait a moment.", true);
    return;
  }
  state.busy = true;
  clearOutput(idx);
  const src = getCellSource(idx);
  const label = $(".cell-label", state.cellEls[idx]);
  label.textContent = `Step ${idx + 1} · running…`;
  setStatus("Running…", "loading");

  const lines = [];
  const labConsole = makeConsole(idx, lines);
  const lab = makeLabHelpers(idx);

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction("console", "lab", `"use strict";\n${src}`);
    await fn(labConsole, lab);
    // Let short timers / promises from demos finish
    await new Promise((r) => setTimeout(r, 650));
    label.textContent = `Step ${idx + 1}`;
    setStatus("JS ready", "ready");
    if (!$(".output", state.cellEls[idx]).childElementCount) {
      appendOutput(idx, "✓ Finished (no console output).");
    }
  } catch (err) {
    appendOutput(idx, String(err?.stack || err), true);
    label.textContent = `Step ${idx + 1} · error`;
    setStatus("Runtime error", "error");
    maybeOfferAi(idx);
  } finally {
    state.busy = false;
  }
}

async function runAll() {
  for (let i = 0; i < state.cellEls.length; i++) {
    await runCell(i);
    if ($(".output .err", state.cellEls[i])) break;
  }
}

function maybeOfferAi(idx) {
  const box = $("#aiMessages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `
    <div class="who">AI Assist</div>
    Step ${idx + 1} failed. Tap <strong>Ask AI</strong> on that step for a fix.
  `;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function getSettings() {
  return {
    endpoint: localStorage.getItem("cia_js_ai_endpoint") || localStorage.getItem("cia_ai_endpoint") || "/api/assist",
    apiKey: localStorage.getItem("cia_js_ai_key") || localStorage.getItem("cia_ai_key") || "",
    model: localStorage.getItem("cia_js_ai_model") || localStorage.getItem("cia_ai_model") || "gpt-4o-mini",
  };
}

function saveSettingsFromForm() {
  localStorage.setItem("cia_js_ai_endpoint", $("#aiEndpoint").value.trim() || "/api/assist");
  localStorage.setItem("cia_js_ai_key", $("#aiKey").value.trim());
  localStorage.setItem("cia_js_ai_model", $("#aiModel").value.trim() || "gpt-4o-mini");
  appendToast("AI settings saved on this device.");
}

function pushMsg(role, text) {
  const box = $("#aiMessages");
  const el = document.createElement("div");
  el.className = `msg ${role}`;
  el.innerHTML = `<div class="who">${role === "user" ? "You" : "AI Assist"}</div>${formatAiHtml(text)}`;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function formatAiHtml(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(
      /```([\s\S]*?)```/g,
      "<pre style='margin:.5rem 0;padding:.6rem;background:#000;border-radius:8px;overflow:auto'>$1</pre>"
    )
    .replace(/\n/g, "<br>");
}

async function askAiForCell(idx) {
  const code = getCellSource(idx);
  const err = $(".output .err", state.cellEls[idx])?.textContent || "";
  const project = state.projects.find((p) => p.id === state.currentId);
  const question = err
    ? `This JavaScript step failed. Explain the error and give a corrected full program.\n\nError:\n${err}\n\nCode:\n${code}`
    : `Review this JavaScript step from "${project?.title || "project"}". Suggest improvements or explain what it does for a learner.\n\nCode:\n${code}`;
  $("#aiInput").value = question;
  await sendAi(question, { code, error: err, cellIndex: idx });
}

async function sendAi(prompt, context = {}) {
  const text = (prompt || $("#aiInput").value || "").trim();
  if (!text) return;
  pushMsg("user", text);
  $("#aiInput").value = "";
  pushMsg("assistant", "Thinking…");
  const thinking = $("#aiMessages").lastElementChild;

  const project = state.projects.find((p) => p.id === state.currentId);
  const payload = {
    message: text,
    language: "javascript",
    project_id: project?.id,
    project_title: project?.title,
    project_description: project?.description,
    cell_index: context.cellIndex ?? null,
    code: context.code || "",
    error: context.error || "",
  };

  try {
    const reply = await callAi(payload);
    thinking.innerHTML = `<div class="who">AI Assist</div>${formatAiHtml(reply)}`;
    const match = reply.match(/```(?:javascript|js)?\n([\s\S]*?)```/i);
    if (match && context.cellIndex != null) {
      const apply = document.createElement("button");
      apply.className = "btn ok";
      apply.style.marginTop = "0.6rem";
      apply.textContent = `Apply fix to step ${context.cellIndex + 1}`;
      apply.onclick = () => {
        setCellSource(context.cellIndex, match[1].trim() + "\n");
        appendToast(`Applied AI suggestion to step ${context.cellIndex + 1}. Run it to verify.`);
      };
      thinking.appendChild(apply);
    }
  } catch (err) {
    thinking.innerHTML = `<div class="who">AI Assist</div><span class="err">${escapeHtml(
      String(err)
    )}</span><br><br>${formatAiHtml(localTutor(payload))}`;
  }
}

async function callAi(payload) {
  const settings = getSettings();

  try {
    const headers = { "Content-Type": "application/json" };
    if (settings.apiKey) headers.Authorization = `Bearer ${settings.apiKey}`;
    const res = await fetch(settings.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...payload, model: settings.model }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.reply) return data.reply;
      if (data.choices?.[0]?.message?.content) return data.choices[0].message.content;
    }
    if (settings.endpoint.startsWith("http") && !res.ok) {
      const t = await res.text();
      throw new Error(`AI endpoint error ${res.status}: ${t.slice(0, 200)}`);
    }
  } catch (e) {
    if (settings.endpoint.startsWith("http") && settings.apiKey) throw e;
  }

  if (settings.apiKey) {
    const base =
      settings.endpoint.includes("openai.com") || settings.endpoint === "/api/assist"
        ? "https://api.openai.com/v1/chat/completions"
        : settings.endpoint;
    const res = await fetch(base, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [
          {
            role: "system",
            content:
              "You are CodeItAll JS Lab AI Assist. Help beginners learn JavaScript. Be concise. When fixing code, return a full corrected program inside a ```js fence.",
          },
          {
            role: "user",
            content: [
              `Project: ${payload.project_title || ""}`,
              payload.project_description || "",
              payload.error ? `Error:\n${payload.error}` : "",
              payload.code ? `Code:\n${payload.code}` : "",
              payload.message,
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
        temperature: 0.2,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI-compatible error ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  return localTutor(payload);
}

function localTutor(payload) {
  const err = payload.error || "";
  const tips = [];
  tips.push(
    "Offline tutor (no API key). Add an OpenAI-compatible key in AI Settings for smarter help."
  );
  if (/SyntaxError/i.test(err)) {
    tips.push("Check brackets, quotes, and commas. JS is picky about matching pairs.");
  }
  if (/ReferenceError/i.test(err)) {
    tips.push("A name is undefined — check spelling, or declare the variable before use.");
  }
  if (/TypeError/i.test(err)) {
    tips.push("You may be calling a method on null/undefined, or passing the wrong type.");
  }
  if (/is not a function/i.test(err)) {
    tips.push("That value is not a function — log typeof it before calling.");
  }
  if (!err && payload.code) {
    tips.push("Looks runnable — click Run. Use console.log to see values.");
  }
  return tips.join("\n\n");
}

function closeMobilePanels() {
  const app = $("#app");
  app?.classList.remove("show-projects", "show-ai");
  const backdrop = $("#backdrop");
  if (backdrop) backdrop.hidden = true;
}

function openProjectsPanel() {
  const app = $("#app");
  app?.classList.remove("show-ai");
  app?.classList.add("show-projects");
  const backdrop = $("#backdrop");
  if (backdrop) backdrop.hidden = false;
  setMobileTab("projects");
}

function openAiPanel() {
  const app = $("#app");
  app?.classList.remove("show-projects");
  app?.classList.add("show-ai");
  const backdrop = $("#backdrop");
  if (backdrop) backdrop.hidden = false;
  setMobileTab("ai");
}

function setMobileTab(panel) {
  $$(".mob-tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.panel === panel);
  });
}

function wireMobileChrome() {
  $("#openProjectsBtn")?.addEventListener("click", openProjectsPanel);
  $("#closeProjectsBtn")?.addEventListener("click", () => {
    closeMobilePanels();
    setMobileTab("code");
  });
  $("#closeAiBtn")?.addEventListener("click", () => {
    closeMobilePanels();
    setMobileTab("code");
  });
  $("#backdrop")?.addEventListener("click", () => {
    closeMobilePanels();
    setMobileTab("code");
  });
  $("#tabProjects")?.addEventListener("click", openProjectsPanel);
  $("#tabCode")?.addEventListener("click", () => {
    closeMobilePanels();
    setMobileTab("code");
  });
  $("#tabAi")?.addEventListener("click", openAiPanel);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobilePanels();
      setMobileTab("code");
    }
  });
}

function wireUi() {
  $("#runAllBtn").addEventListener("click", runAll);
  $("#aiSendBtn").addEventListener("click", () => sendAi());
  $("#aiSaveBtn").addEventListener("click", saveSettingsFromForm);
  $("#aiInput").addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      sendAi();
    }
  });
  $("#homeBtn")?.addEventListener("click", () => {
    window.location.href = "../../index.html";
  });
  wireMobileChrome();

  const s = getSettings();
  $("#aiEndpoint").value = s.endpoint;
  $("#aiKey").value = s.apiKey;
  $("#aiModel").value = s.model;

  const params = new URLSearchParams(location.search);
  const want = params.get("project");
  if (want) {
    const ready = setInterval(() => {
      if (state.projects.length) {
        clearInterval(ready);
        if (state.projects.some((p) => p.id === want)) openProject(want);
      }
    }, 50);
  }
}

async function main() {
  wireUi();
  setStatus("JS ready", "ready");
  try {
    await loadProjects();
  } catch (err) {
    setStatus("Load failed", "error");
    $("#runCellHint").textContent = "Failed to load JS projects.json.";
    console.error(err);
  }
}


/* CIA progress hooks */
(function wireCiaProgressHooks() {
  const _open = openProject;
  openProject = function (id) {
    _open(id);
    window.CIAProgress?.noteOpen?.(CIA_TRACK, currentProject());
    refreshProgressUi();
  };

  const _runCell = runCell;
  runCell = async function (idx) {
    await _runCell(idx);
    const out = state.cellEls?.[idx] && $(".output", state.cellEls[idx]);
    const ok = !!(out && !out.querySelector(".err"));
    window.CIAProgress?.noteRunStep?.(CIA_TRACK, currentProject(), idx, ok);
  };

  const _runAll = runAll;
  runAll = async function () {
    await _runAll();
    const failed = (state.cellEls || []).some((el) => $(".output", el)?.querySelector(".err"));
    window.CIAProgress?.noteRunAll?.(CIA_TRACK, currentProject(), !failed);
    refreshProgressUi();
  };

  if (typeof sendAi === "function") {
    const _sendAi = sendAi;
    sendAi = async function (...args) {
      window.CIAProgress?.noteAi?.(CIA_TRACK, currentProject());
      return _sendAi.apply(this, args);
    };
  }

  $("#markDoneBtn")?.addEventListener("click", toggleMarkDone);
  $("#profileBtn")?.addEventListener("click", () => {
    window.location.href = "../../profile/";
  });
})();

main();
