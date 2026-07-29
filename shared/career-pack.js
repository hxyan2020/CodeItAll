/**
 * Career Lab pack — sessionStorage bridge between /career/ and language labs.
 */
(function (global) {
  const STORAGE_KEY = "cia_career_pack_v1";

  const LAB_HREF = {
    python: "../lab/?career=1",
    javascript: "../js/lab/?career=1",
    sql: "../sql/lab/?career=1",
    html: "../html/lab/?career=1",
    cpp: "../cpp/lab/?career=1",
  };

  // When used from inside a lab folder, paths differ
  const LAB_HREF_FROM_LAB = {
    python: { fromPython: "./?career=1" },
  };

  function save(pack) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(pack));
  }

  function load() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || !Array.isArray(data.projects)) return null;
      return data;
    } catch (_) {
      return null;
    }
  }

  function clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function labPath(language, basePrefix) {
    // basePrefix e.g. "" from career page using relative docs paths
    const map = {
      python: "lab/?career=1",
      javascript: "js/lab/?career=1",
      sql: "sql/lab/?career=1",
      html: "html/lab/?career=1",
      cpp: "cpp/lab/?career=1",
    };
    const rel = map[language] || map.python;
    return (basePrefix || "") + rel;
  }

  /**
   * From a lab.js context: return projects if career mode matches this track language.
   * Track names: python, javascript, sql, html, cpp
   */
  function projectsForLab(trackLang) {
    const params = new URLSearchParams(location.search);
    if (params.get("career") !== "1") return null;
    const pack = load();
    if (!pack) return null;
    const lang = String(pack.language || "").toLowerCase();
    const want = String(trackLang || "").toLowerCase();
    if (lang !== want && !(lang === "js" && want === "javascript")) return null;
    return {
      pack,
      projects: pack.projects,
    };
  }

  function bannerHtml(pack) {
    if (!pack) return "";
    const task = pack.task ? ` · focus: ${pack.task}` : "";
    return `<div class="career-banner" id="careerBanner">
      <strong>Career Lab</strong>
      <span>${escape(pack.job)} · ${escape(pack.industry)}${escape(task)}</span>
      <a href="../career/">Edit role</a>
    </div>`;
  }

  function bannerHtmlPython(pack) {
    // python lab sits at docs/lab/
    if (!pack) return "";
    const task = pack.task ? ` · focus: ${pack.task}` : "";
    return `<div class="career-banner" id="careerBanner">
      <strong>Career Lab</strong>
      <span>${escape(pack.job)} · ${escape(pack.industry)}${escape(task)}</span>
      <a href="../career/">Edit role</a>
    </div>`;
  }

  function bannerHtmlNested(pack) {
    if (!pack) return "";
    const task = pack.task ? ` · focus: ${pack.task}` : "";
    return `<div class="career-banner" id="careerBanner">
      <strong>Career Lab</strong>
      <span>${escape(pack.job)} · ${escape(pack.industry)}${escape(task)}</span>
      <a href="../../career/">Edit role</a>
    </div>`;
  }

  function escape(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function injectBanner(pack, nested) {
    if (!pack || document.getElementById("careerBanner")) return;
    const html = nested ? bannerHtmlNested(pack) : bannerHtmlPython(pack);
    const app = document.getElementById("app");
    const bar = document.querySelector(".topbar");
    if (bar) bar.insertAdjacentHTML("afterend", html);
    document.body.classList.add("career-mode");
    app?.classList.add("career-mode");
    // Brand label: Career Lab inside existing language runtime
    const brand = document.querySelector(".topbar .brand span");
    if (brand && !brand.dataset.careerLabeled) {
      brand.dataset.careerLabeled = "1";
      brand.textContent = "Career · " + brand.textContent;
    }
  }

  global.CIACareer = {
    STORAGE_KEY,
    LAB_HREF,
    save,
    load,
    clear,
    labPath,
    projectsForLab,
    injectBanner,
  };
})(typeof window !== "undefined" ? window : globalThis);
