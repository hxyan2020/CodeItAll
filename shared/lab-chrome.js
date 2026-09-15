/**
 * CodeItAll lab chrome — theme (dark/light) + fullscreen
 * Include before each lab's lab.js so editors can read cmTheme().
 */
(function () {
  const THEME_KEY = "codeitall-lab-theme";

  const api = {
    getTheme() {
      return document.documentElement.getAttribute("data-theme") === "light"
        ? "light"
        : "dark";
    },
    cmTheme() {
      return api.getTheme() === "light" ? "default" : "material-darker";
    },
    applyCmThemes() {
      const theme = api.cmTheme();
      document.querySelectorAll(".CodeMirror").forEach((el) => {
        if (el.CodeMirror) el.CodeMirror.setOption("theme", theme);
      });
    },
    setTheme(theme) {
      const next = theme === "light" ? "light" : "dark";
      if (next === "light") {
        document.documentElement.setAttribute("data-theme", "light");
      } else {
        document.documentElement.removeAttribute("data-theme");
      }
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (_) {
        /* ignore */
      }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", next === "light" ? "#f3f4f6" : "#000000");
      syncThemeButton();
      api.applyCmThemes();
    },
    toggleTheme() {
      api.setTheme(api.getTheme() === "light" ? "dark" : "light");
    },
    isFullscreen() {
      return Boolean(
        document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement
      );
    },
    async toggleFullscreen() {
      const target = document.getElementById("app") || document.documentElement;
      try {
        if (!api.isFullscreen()) {
          if (target.requestFullscreen) await target.requestFullscreen();
          else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
          else if (target.msRequestFullscreen) target.msRequestFullscreen();
        } else if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      } catch (err) {
        console.warn("Fullscreen unavailable:", err);
      }
      syncFullscreenButton();
    },
  };

  window.CodeItAllLab = api;

  function syncThemeButton() {
    const btn = document.getElementById("themeBtn");
    if (!btn) return;
    const light = api.getTheme() === "light";
    btn.setAttribute("aria-pressed", light ? "true" : "false");
    btn.title = light ? "Switch to dark mode" : "Switch to light mode";
    btn.setAttribute("aria-label", btn.title);
    const ico = btn.querySelector(".lab-chrome-ico");
    const label = btn.querySelector(".lab-chrome-label");
    if (ico) ico.textContent = light ? "☾" : "☀";
    if (label) label.textContent = light ? "Dark" : "Light";
  }

  function syncFullscreenButton() {
    const btn = document.getElementById("fullscreenBtn");
    if (!btn) return;
    const on = api.isFullscreen();
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.title = on ? "Exit fullscreen" : "Expand to fullscreen";
    btn.setAttribute("aria-label", btn.title);
    const ico = btn.querySelector(".lab-chrome-ico");
    const label = btn.querySelector(".lab-chrome-label");
    if (ico) ico.textContent = on ? "⛶" : "⛶";
    if (label) label.textContent = on ? "Exit" : "Full screen";
  }

  function ensureButtons() {
    const actions = document.querySelector(".top-actions");
    if (!actions) return;

    let themeBtn = document.getElementById("themeBtn");
    if (!themeBtn) {
      themeBtn = document.createElement("button");
      themeBtn.type = "button";
      themeBtn.id = "themeBtn";
      themeBtn.className = "btn ghost lab-chrome-btn";
      themeBtn.innerHTML =
        '<span class="lab-chrome-ico" aria-hidden="true">☀</span>' +
        '<span class="lab-chrome-label">Light</span>';
      actions.insertBefore(themeBtn, actions.firstChild);
    }
    if (!themeBtn.dataset.chromeBound) {
      themeBtn.addEventListener("click", () => api.toggleTheme());
      themeBtn.dataset.chromeBound = "1";
    }

    let fsBtn = document.getElementById("fullscreenBtn");
    if (!fsBtn) {
      fsBtn = document.createElement("button");
      fsBtn.type = "button";
      fsBtn.id = "fullscreenBtn";
      fsBtn.className = "btn ghost lab-chrome-btn";
      fsBtn.innerHTML =
        '<span class="lab-chrome-ico" aria-hidden="true">⛶</span>' +
        '<span class="lab-chrome-label">Full screen</span>';
      if (themeBtn.nextSibling) actions.insertBefore(fsBtn, themeBtn.nextSibling);
      else themeBtn.after(fsBtn);
    }
    if (!fsBtn.dataset.chromeBound) {
      fsBtn.addEventListener("click", () => api.toggleFullscreen());
      fsBtn.dataset.chromeBound = "1";
    }

    syncThemeButton();
    syncFullscreenButton();
  }

  // Restore theme ASAP (script may load after first paint if deferred — also set in head snippet)
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") api.setTheme(saved);
  } catch (_) {
    /* ignore */
  }

  function boot() {
    ensureButtons();
    document.addEventListener("fullscreenchange", syncFullscreenButton);
    document.addEventListener("webkitfullscreenchange", syncFullscreenButton);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
