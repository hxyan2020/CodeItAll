/**
 * Add-to-home-screen control for the mobile menu.
 * Prefer the native Chrome/Edge install prompt; never lead with instructions.
 */
(function () {
  const MANIFEST_HREF = "/site.webmanifest";
  const SW_HREF = "/sw.js";
  const APPLE_ICON = "/assets/pwa-icon-192.png";
  const SECURE_INSTALL_URL = "https://codeitall-site.vercel.app/?install=1";

  function isIosDevice() {
    const ua = navigator.userAgent || "";
    return (
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }

  function isStandaloneMode() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.navigator.standalone === true
    );
  }

  function isSecureInstallContext() {
    try {
      return window.isSecureContext === true;
    } catch (_) {
      return location.protocol === "https:";
    }
  }

  function wantsAutoInstall() {
    try {
      return new URLSearchParams(location.search).get("install") === "1";
    } catch (_) {
      return false;
    }
  }

  function ensureHeadLinks() {
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement("link");
      link.rel = "manifest";
      link.href = MANIFEST_HREF;
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const icon = document.createElement("link");
      icon.rel = "apple-touch-icon";
      icon.href = APPLE_ICON;
      document.head.appendChild(icon);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const meta = document.createElement("meta");
      meta.name = "apple-mobile-web-app-capable";
      meta.content = "yes";
      document.head.appendChild(meta);
    }
    if (!document.querySelector('meta[name="mobile-web-app-capable"]')) {
      const meta = document.createElement("meta");
      meta.name = "mobile-web-app-capable";
      meta.content = "yes";
      document.head.appendChild(meta);
    }
  }

  function injectStyles() {
    if (document.getElementById("cia-install-style")) return;
    const style = document.createElement("style");
    style.id = "cia-install-style";
    style.textContent = [
      ".nav-install { display: none; list-style: none; }",
      "@media (max-width: 820px) {",
      "  .nav-install { display: block; margin-top: 0.35rem; padding-top: 0.35rem;",
      "    border-top: 1px solid rgba(0,0,0,0.08); }",
      "  .nav-install-btn {",
      "    display: flex; align-items: center; justify-content: center; gap: 0.55rem;",
      "    width: 100%; min-height: 44px; padding: 0.55rem 0.85rem;",
      "    border: 0; border-radius: 12px; background: #000;",
      "    color: #fff; font: inherit; font-weight: 700; font-size: 0.95rem;",
      "    text-align: center; cursor: pointer;",
      "  }",
      "  .nav-install-btn:hover, .nav-install-btn:focus-visible {",
      "    opacity: 0.88; outline: none;",
      "  }",
      "  .nav-install-btn:disabled { opacity: 0.5; }",
      "  .nav-install-ico { width: 16px; height: 16px; flex-shrink: 0; }",
      "  .nav-install-note {",
      "    margin: 0.45rem 0 0.1rem;",
      "    color: #666;",
      "    font-size: 0.75rem;",
      "    font-weight: 400;",
      "    line-height: 1.4;",
      "    text-align: center;",
      "  }",
      "}",
    ].join("\n");
    document.head.appendChild(style);
  }

  function closeMenu() {
    const header = document.getElementById("header");
    const toggle = document.getElementById("menuToggle");
    if (header) header.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  let deferredPrompt = null;
  let standalone = false;
  let installBtn = null;
  let installNote = null;

  function phoneIcon() {
    return (
      '<svg class="nav-install-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="12" cy="18.2" r="0.9" fill="currentColor"/>' +
      "</svg>"
    );
  }

  function setNote(text) {
    if (!installNote) return;
    if (!text) {
      installNote.hidden = true;
      installNote.textContent = "";
      return;
    }
    installNote.hidden = false;
    installNote.textContent = text;
  }

  async function runNativeInstall() {
    if (!deferredPrompt) return false;
    const promptEvent = deferredPrompt;
    deferredPrompt = null;
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice && choice.outcome === "accepted") {
      standalone = true;
      const existing = document.querySelector(".nav-install");
      if (existing) existing.remove();
      return true;
    }
    return false;
  }

  async function handleInstallClick() {
    if (installBtn) installBtn.disabled = true;
    setNote("");

    try {
      if (deferredPrompt) {
        await runNativeInstall();
        closeMenu();
        return;
      }

      // HTTP / non-secure: browsers block the install prompt — open HTTPS site.
      if (!isSecureInstallContext() && !isIosDevice()) {
        window.location.href = SECURE_INSTALL_URL;
        return;
      }

      // iOS never exposes a programmatic install API.
      if (isIosDevice()) {
        setNote("On iPhone: tap Share, then Add to Home Screen.");
        return;
      }

      // Secure Android/desktop but prompt not ready yet — wait briefly.
      setNote("Preparing install…");
      const ready = await waitForPrompt(2500);
      if (ready) {
        await runNativeInstall();
        closeMenu();
        return;
      }

      // Last resort: reopen secure origin with install flag (helps droplet → Vercel).
      if (location.hostname !== "codeitall-site.vercel.app") {
        window.location.href = SECURE_INSTALL_URL;
        return;
      }

      setNote("Install isn’t available in this browser yet. Try Chrome, then tap again.");
    } catch (_) {
      setNote("Couldn’t open the install dialog. Try again in Chrome.");
    } finally {
      if (installBtn && !standalone) installBtn.disabled = false;
    }
  }

  function waitForPrompt(ms) {
    if (deferredPrompt) return Promise.resolve(true);
    return new Promise(function (resolve) {
      const start = Date.now();
      const timer = setInterval(function () {
        if (deferredPrompt) {
          clearInterval(timer);
          resolve(true);
          return;
        }
        if (Date.now() - start >= ms) {
          clearInterval(timer);
          resolve(false);
        }
      }, 100);
    });
  }

  function mountButton() {
    if (standalone || isStandaloneMode()) return;
    const nav = document.getElementById("nav");
    if (!nav || nav.querySelector(".nav-install")) return;

    const item = document.createElement("li");
    item.className = "nav-install";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-install-btn";
    btn.innerHTML = phoneIcon() + "<span>Add to Home Screen</span>";
    installBtn = btn;

    const note = document.createElement("p");
    note.className = "nav-install-note";
    note.hidden = true;
    installNote = note;

    btn.addEventListener("click", function () {
      void handleInstallClick();
    });

    item.appendChild(btn);
    item.appendChild(note);
    nav.appendChild(item);
  }

  ensureHeadLinks();
  injectStyles();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register(SW_HREF).catch(function () {});
  }

  window.addEventListener("beforeinstallprompt", function (event) {
    event.preventDefault();
    deferredPrompt = event;
    if (wantsAutoInstall()) {
      void runNativeInstall().then(function () {
        closeMenu();
      });
    }
  });

  window.addEventListener("appinstalled", function () {
    deferredPrompt = null;
    standalone = true;
    const existing = document.querySelector(".nav-install");
    if (existing) existing.remove();
    closeMenu();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountButton);
  } else {
    mountButton();
  }
})();
