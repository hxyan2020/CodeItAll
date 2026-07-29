const $ = (sel, root = document) => root.querySelector(sel);

let lastPack = null;
let pool = []; // all projects the generator can offer for the current inputs
let basePack = null; // pack metadata (industry/job/brief/mode) without projects
let shown = 0; // how many projects are currently revealed

function setStatus(msg, kind = "") {
  const el = $("#statusLine");
  el.textContent = msg;
  el.className = "fine" + (kind ? " " + kind : "");
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function projectCardHTML(p) {
  return `<li>
    <h3>${escapeHtml(p.title)}</h3>
    <p>${escapeHtml(p.description || "")}</p>
    <div class="steps">${(p.cells || []).length} interactive steps</div>
  </li>`;
}

function renderShown({ scrollToLast = false } = {}) {
  if (!basePack) return;
  const displayed = pool.slice(0, shown);
  lastPack = { ...basePack, projects: displayed };
  window.CIACareer.save(lastPack);

  $("#results").hidden = false;
  $("#briefBox").textContent = basePack.brief || "";
  $("#packMeta").innerHTML = [
    basePack.industry,
    basePack.job,
    basePack.language,
    basePack.mode === "openai" ? "AI pack" : "Curated pack",
    basePack.task ? `Focus: ${basePack.task}` : null,
  ]
    .filter(Boolean)
    .map((t) => `<span>${escapeHtml(t)}</span>`)
    .join("");

  $("#projectCards").innerHTML = displayed.map(projectCardHTML).join("");

  const moreBtn = $("#moreBtn");
  if (shown < pool.length) {
    moreBtn.hidden = false;
    moreBtn.disabled = false;
    moreBtn.textContent = "Generate more projects";
  } else {
    moreBtn.hidden = true;
  }

  window.CIAProgress?.track?.({
    track: "career",
    type: "opened",
    projectId: `${basePack.language}:${basePack.job}`,
    projectTitle: `${basePack.job} · ${basePack.industry}`,
    detail: `Generated ${displayed.length} ${basePack.language} project(s)`,
  });

  if (scrollToLast) {
    $("#projectCards").lastElementChild?.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function restorePack(pack) {
  pool = pack.projects || [];
  basePack = { ...pack, projects: undefined };
  shown = pool.length;
  renderShown();
}

async function generate() {
  const payload = {
    industry: $("#industry").value.trim(),
    job: $("#job").value.trim(),
    task: $("#task").value.trim(),
    language: $("#language").value,
    count: 6, // fetch the full available pool; we reveal them one at a time
  };
  if (!payload.industry || !payload.job) {
    setStatus("Industry and job title are required.", "err");
    return;
  }

  $("#genBtn").disabled = true;
  setStatus("Building practitioner projects…", "");
  try {
    const res = await fetch("/api/career", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.detail || data.message || `Failed (${res.status})`);
    if (!data.projects?.length) throw new Error("No projects returned.");

    pool = data.projects;
    basePack = { ...data, projects: undefined };
    shown = 1; // start with one project, let the user generate more
    renderShown();
    setStatus(
      pool.length > 1
        ? "Project ready — hit “Generate more projects” to add another, or open the lab."
        : "Project ready — open the lab to run it.",
      "ok"
    );
  } catch (err) {
    setStatus(String(err.message || err), "err");
  } finally {
    $("#genBtn").disabled = false;
  }
}

function generateMore() {
  if (!basePack || shown >= pool.length) return;
  const more = $("#moreBtn");
  more.disabled = true;
  more.textContent = "Generating…";
  // Small delay so the action reads as "generating" a fresh project.
  setTimeout(() => {
    shown = Math.min(shown + 1, pool.length);
    renderShown({ scrollToLast: true });
    if (shown >= pool.length) {
      setStatus(
        "That’s every project we have for this role — tweak the task or role for different ones.",
        "ok"
      );
    } else {
      setStatus("Added a new project. Generate more or open the lab.", "ok");
    }
  }, 350);
}

function openLab() {
  if (!lastPack) {
    const existing = window.CIACareer.load();
    if (existing) lastPack = existing;
  }
  if (!lastPack) {
    setStatus("Generate a pack first.", "err");
    return;
  }
  window.CIACareer.save(lastPack);
  const href = "../" + window.CIACareer.labPath(lastPack.language);
  window.location.href = href;
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

  $("#careerForm").addEventListener("submit", (e) => {
    e.preventDefault();
    generate();
  });
  $("#openLabBtn").addEventListener("click", openLab);
  $("#regenBtn").addEventListener("click", generate);
  $("#moreBtn").addEventListener("click", generateMore);

  const existing = window.CIACareer.load();
  if (existing?.projects?.length) {
    restorePack(existing);
    setStatus("Restored your last career pack from this session.", "ok");
  }
}

wire();
