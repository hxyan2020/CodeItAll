/**
 * Add-to-home-screen control for the mobile menu.
 * Pattern follows When I Die: native install prompt when available,
 * otherwise short iOS / Android instructions.
 */
(function () {
  const MANIFEST_HREF = "/site.webmanifest";
  const SW_HREF = "/sw.js";
  const APPLE_ICON = "/assets/pwa-icon-192.png";

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
      "  .nav-install { display: block; margin-top: 0.2rem; }",
      "  .nav-install-btn {",
      "    display: flex; align-items: center; gap: 0.55rem;",
      "    width: 100%; min-height: 44px; padding: 0.35rem 0.55rem;",
      "    border: 0; border-radius: 10px; background: transparent;",
      "    color: #000; font: inherit; font-weight: 700; font-size: 1rem;",
      "    text-align: left; cursor: pointer;",
      "  }",
      "  .nav-install-btn:hover, .nav-install-btn:focus-visible {",
      "    background: rgba(0, 0, 0, 0.05); outline: none;",
      "  }",
      "  .nav-install-btn:disabled { opacity: 0.5; }",
      "  .nav-install-ico { width: 16px; height: 16px; flex-shrink: 0; }",
      "  .nav-install-help {",
      "    margin: 0.15rem 0 0.35rem;",
      "    padding: 0.55rem 0.7rem;",
      "    border-radius: 10px;",
      "    background: #f4f4f4;",
      "    color: #404040;",
      "    font-size: 0.8rem;",
      "    font-weight: 400;",
      "    line-height: 1.45;",
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

  function phoneIcon() {
    return (
      '<svg class="nav-install-ico" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<rect x="7" y="2" width="10" height="20" rx="2" stroke="currentColor" stroke-width="1.8"/>' +
      '<circle cx="12" cy="18.2" r="0.9" fill="currentColor"/>' +
      "</svg>"
    );
  }

  function helpCopy() {
    if (isIosDevice()) {
      return "Tap the Share button, then choose Add to Home Screen.";
    }
    return "Tap the browser menu, then choose Install app or Add to Home screen.";
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

    const help = document.createElement("p");
    help.className = "nav-install-help";
    help.hidden = true;
    help.textContent = helpCopy();

    btn.addEventListener("click", async function () {
      if (deferredPrompt) {
        btn.disabled = true;
        try {
          deferredPrompt.prompt();
          const choice = await deferredPrompt.userChoice;
          if (choice && choice.outcome === "accepted") {
            standalone = true;
            item.remove();
          }
        } catch (_) {
          help.hidden = false;
        }
        deferredPrompt = null;
        btn.disabled = false;
        closeMenu();
        return;
      }
      help.hidden = !help.hidden;
    });

    item.appendChild(btn);
    item.appendChild(help);
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
