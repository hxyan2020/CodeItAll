/**
 * CodeItAll Lab — in-browser Python notebook + AI assist
 * Runtime: Pyodide (core packages first so Run works quickly)
 * Editors: CodeMirror Python theme (material-darker palette)
 */
const PYODIDE_CDN = "https://cdn.jsdelivr.net/pyodide/v0.27.5/full/";

const state = {
  pyodide: null,
  ready: false,
  busy: false,
  projects: [],
  currentId: null,
  cellEls: [],
  editors: [],
  bootPromise: null,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function setStatus(text, kind = "loading") {
  const el = $("#runtimeStatus");
  if (!el) return;
  el.textContent = text;
  el.className = `status-pill ${kind}`;
}

function prepareSource(src) {
  return src
    .replace(/^%\w+.*$/gm, "")
    .replace(/^!.*$/gm, "# (shell command skipped in browser lab)")
    .replace(/from IPython\.display import[^\n]+/g, "# IPython.display patched by Lab")
    .replace(/\bdisplay\(/g, "lab_display(")
    .replace(/\bIPImage\(/g, "lab_image(");
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


const CIA_TRACK = "python";

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


async function loadProjects() {
  const careerHit = window.CIACareer?.projectsForLab?.(CIA_TRACK);
  let data;
  if (careerHit) {
    data = { projects: careerHit.projects };
    window.CIACareer.injectBanner(careerHit.pack, false);
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
    btn.innerHTML = `<strong>${escapeHtml(p.title)}</strong><span>${p.cells.length} steps · editable</span>`;
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
    project.description || "Edit cells, run them, and ask AI when you get stuck.";

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
        <div class="cell-label">In [${idx + 1}]</div>
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
        mode: "python",
        theme: "material-darker",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        viewportMargin: Infinity,
        extraKeys: {
          "Ctrl-Enter": () => runCell(idx),
          "Cmd-Enter": () => runCell(idx),
          Tab: (cm) => cm.replaceSelection("    ", "end"),
        },
      });
      editor.setSize("100%", Math.max(160, (cell.source || "").split("\n").length * 20 + 40));
      state.editors[idx] = editor;
      window.LabExplain?.attach?.(editor, "python");
    }

    $(".run-btn", wrap).addEventListener("click", () => runCell(idx));
    $(".ask-btn", wrap).addEventListener("click", () => {
      askAiForCell(idx);
      openAiPanel();
    });
  });

  // Refresh CodeMirror after layout (mobile drawers, fonts)
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

window.labShow = function labShow(payload) {
  const idx = window.__labActiveCell ?? 0;
  if (!state.cellEls[idx]) return;
  const out = $(".output", state.cellEls[idx]);
  if (!payload || !payload.kind) return;
  if (payload.kind === "text") {
    const div = document.createElement("div");
    div.textContent = payload.data || "";
    out.appendChild(div);
  } else if (payload.kind === "image") {
    const img = document.createElement("img");
    img.alt = "cell output";
    img.src = payload.data;
    out.appendChild(img);
  } else if (payload.kind === "html") {
    const iframe = document.createElement("iframe");
    iframe.srcdoc = payload.data;
    iframe.title = "HTML output";
    out.appendChild(iframe);
  }
};

function markReady(message) {
  state.ready = true;
  setStatus("Python ready", "ready");
  $("#runAllBtn").disabled = false;
  $("#runCellHint").textContent =
    message || "Runtime ready — edit any cell and click Run (Ctrl/Cmd+Enter).";
}

async function installOptionalPackages(pyodide) {
  try {
    setStatus("Extra packages…", "loading");
    await pyodide.loadPackage(["micropip", "pandas"]);
    await pyodide.runPythonAsync(`
import micropip
pkgs = ["scipy", "jinja2", "qrcode", "python-barcode", "fpdf2", "plotly", "wordcloud"]
for p in pkgs:
    try:
        await micropip.install(p)
    except Exception:
        pass
`);
  } catch (err) {
    console.warn("Optional package install failed:", err);
  }
  if (state.ready) setStatus("Python ready", "ready");
}

async function bootPyodide() {
  setStatus("Loading Python…", "loading");
  $("#runCellHint").textContent =
    "Downloading Python to your browser (first time ~15–30s). Core packages load first so you can run soon.";

  const pyodide = await loadPyodide({ indexURL: PYODIDE_CDN });
  state.pyodide = pyodide;
  setStatus("Core packages…", "loading");

  // Core only — enough for most beginner image/text projects
  await pyodide.loadPackage(["numpy", "matplotlib", "pillow"]);

  await pyodide.runPythonAsync(`
import sys, io, base64
from pathlib import Path
from js import labShow as _lab_show_js
from pyodide.ffi import to_js

OUTPUT_DIR = Path("/home/pyodide/outputs")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

def lab_js_show(kind, data):
    _lab_show_js(to_js({"kind": kind, "data": data}))

def lab_display(obj):
    try:
        from PIL import Image as PILImage
    except Exception:
        PILImage = None
    try:
        import matplotlib.pyplot as plt
        from matplotlib.figure import Figure
    except Exception:
        plt = None
        Figure = None

    if PILImage is not None and isinstance(obj, PILImage.Image):
        buf = io.BytesIO()
        obj.save(buf, format="PNG")
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        lab_js_show("image", f"data:image/png;base64,{b64}")
        return
    if Figure is not None and isinstance(obj, Figure):
        buf = io.BytesIO()
        obj.savefig(buf, format="png", bbox_inches="tight", facecolor=obj.get_facecolor())
        b64 = base64.b64encode(buf.getvalue()).decode("ascii")
        lab_js_show("image", f"data:image/png;base64,{b64}")
        return
    if hasattr(obj, "_repr_html_"):
        lab_js_show("html", obj._repr_html_())
        return
    lab_js_show("text", repr(obj))

def lab_image(filename=None, data=None, **kwargs):
    if filename:
        with open(filename, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("ascii")
        lab_js_show("image", f"data:image/png;base64,{b64}")
    elif data:
        lab_js_show("image", data)

class _ShowFig:
    def __call__(self, *a, **k):
        import matplotlib.pyplot as plt
        fig = plt.gcf()
        lab_display(fig)
        plt.close(fig)

import matplotlib
matplotlib.use("AGG")
import matplotlib.pyplot as plt
plt.show = _ShowFig()
`);

  // Enable Run immediately — do not wait for optional packages
  markReady("Python ready. Extra libraries install in the background (pandas, qrcode, …).");

  // Background extras for later projects
  installOptionalPackages(pyodide);
}

async function ensureReady(idx) {
  if (state.busy) {
    if (idx != null) appendOutput(idx, "Already running another cell — wait a moment.", true);
    else appendToast("Already running a cell…");
    return false;
  }
  if (!state.ready) {
    const msg =
      "Python is still starting. Status: " +
      ($("#runtimeStatus")?.textContent || "loading") +
      ". Wait until the pill says “Python ready”, then click Run again.";
    if (idx != null) {
      clearOutput(idx);
      appendOutput(idx, msg, true);
    } else appendToast(msg);
    return false;
  }
  return true;
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

async function runCell(idx) {
  if (!(await ensureReady(idx))) return;
  state.busy = true;
  window.__labActiveCell = idx;
  clearOutput(idx);
  const src = prepareSource(getCellSource(idx));
  const label = $(".cell-label", state.cellEls[idx]);
  label.textContent = `In [${idx + 1}] · running…`;

  try {
    const project = state.projects.find((p) => p.id === state.currentId);
    const slug = project ? project.id.replace(/^\d+_/, "") : "lab";
    await state.pyodide.runPythonAsync(`
from pathlib import Path
OUTPUT_DIR = Path("/home/pyodide/outputs") / ${JSON.stringify(slug)}
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
`);

    let stdout = "";
    state.pyodide.setStdout({
      batched: (s) => {
        stdout += s + "\n";
      },
    });
    state.pyodide.setStderr({
      batched: (s) => {
        stdout += s + "\n";
      },
    });

    const result = await state.pyodide.runPythonAsync(src);
    if (stdout.trim()) appendOutput(idx, stdout.trimEnd());
    if (result !== undefined && result !== null) {
      const text = String(result);
      if (text && text !== "None") appendOutput(idx, text);
    }
    await state.pyodide.runPythonAsync(`
import matplotlib.pyplot as plt
if plt.get_fignums():
    for n in list(plt.get_fignums()):
        lab_display(plt.figure(n))
    plt.close("all")
`);
    label.textContent = `In [${idx + 1}]`;
    if (!$(".output", state.cellEls[idx]).childElementCount) {
      appendOutput(idx, "✓ Cell finished (no printed output).");
    }
  } catch (err) {
    appendOutput(idx, String(err), true);
    label.textContent = `In [${idx + 1}] · error`;
    maybeOfferAi(idx, String(err));
  } finally {
    state.busy = false;
  }
}

async function runAll() {
  for (let i = 0; i < state.cellEls.length; i++) {
    await runCell(i);
    const out = $(".output", state.cellEls[i]);
    if (out.querySelector(".err")) break;
  }
}

function maybeOfferAi(idx) {
  const box = $("#aiMessages");
  if (!box) return;
  const el = document.createElement("div");
  el.className = "msg assistant";
  el.innerHTML = `
    <div class="who">AI Assist</div>
    Cell ${idx + 1} failed. Tap <strong>Ask AI</strong> on that cell for a fix.
  `;
  box.appendChild(el);
  box.scrollTop = box.scrollHeight;
}

function getSettings() {
  return {
    endpoint: localStorage.getItem("cia_ai_endpoint") || "/api/assist",
    apiKey: localStorage.getItem("cia_ai_key") || "",
    model: localStorage.getItem("cia_ai_model") || "gpt-4o-mini",
  };
}

function saveSettingsFromForm() {
  localStorage.setItem("cia_ai_endpoint", $("#aiEndpoint").value.trim() || "/api/assist");
  localStorage.setItem("cia_ai_key", $("#aiKey").value.trim());
  localStorage.setItem("cia_ai_model", $("#aiModel").value.trim() || "gpt-4o-mini");
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
    ? `This cell failed while running. Explain the error and give corrected Python code.\n\nError:\n${err}\n\nCode:\n${code}`
    : `Review this cell from "${project?.title || "project"}". Suggest improvements or explain what it does. Keep advice practical for a learner.\n\nCode:\n${code}`;
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
    const match = reply.match(/```(?:python)?\n([\s\S]*?)```/);
    if (match && context.cellIndex != null) {
      const apply = document.createElement("button");
      apply.className = "btn ok";
      apply.style.marginTop = "0.6rem";
      apply.textContent = `Apply fix to cell ${context.cellIndex + 1}`;
      apply.onclick = () => {
        setCellSource(context.cellIndex, match[1].trim() + "\n");
        appendToast(`Applied AI suggestion to cell ${context.cellIndex + 1}. Run it to verify.`);
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
              "You are CodeItAll Lab AI Assist. Help beginners learn Python by editing notebook cells. Be concise. When fixing code, return a full corrected cell inside a ```python fence.",
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
  const code = payload.code || "";
  const tips = [];
  tips.push(
    "Offline tutor (no API key configured). Add an OpenAI-compatible key in AI Settings for smarter help."
  );

  if (/ModuleNotFoundError|No module named/i.test(err)) {
    tips.push(
      "A package is still installing or unavailable in the browser. Wait for “Python ready”, then try again. Prefer numpy, pandas, matplotlib, pillow, jinja2, qrcode, plotly."
    );
  }
  if (/UnicodeEncodeError|FPDFUnicodeEncodingException|latin-1/i.test(err)) {
    tips.push(
      "PDF core fonts only support Latin-1. Replace fancy dashes (—) with ASCII '-' and avoid emoji in fpdf Helvetica text."
    );
  }
  if (/NameError/i.test(err)) {
    const m = err.match(/name '(\w+)' is not defined/);
    tips.push(
      m
        ? `Variable/function '${m[1]}' is undefined. Run earlier cells first, or define it in this cell.`
        : "A name is undefined — run previous cells top-to-bottom."
    );
  }
  if (/SyntaxError/i.test(err)) {
    tips.push("There's a syntax error. Check indentation, missing colons, and unmatched quotes/parentheses.");
  }
  if (/FileNotFoundError/i.test(err)) {
    tips.push(
      "A file path was not found. In Lab, files save under OUTPUT_DIR inside the browser filesystem."
    );
  }
  if (!err && code) {
    tips.push(
      "This cell looks runnable. Try Run, then Ask AI again if an error appears. Tip: change the 🎛️ TWEAK parameters near the top of the cell."
    );
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
    window.location.href = "../index.html";
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
  await loadProjects();
  try {
    await bootPyodide();
  } catch (err) {
    setStatus("Runtime failed", "error");
    $("#runCellHint").textContent =
      "Failed to load Python. Check your network (CDN) and refresh the page.";
    appendToast("Failed to load Python runtime: " + err);
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
    window.location.href = "../profile/";
  });
})();

main();
