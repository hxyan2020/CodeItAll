/* CodeItAll lightweight analytics beacon.
 * Privacy-friendly: no cookies, no fingerprinting beyond a per-tab session id.
 * Fires once per page load; the server records path, title, referrer and time.
 * Bots that don't run JS never reach the endpoint, so counts reflect real visits. */
(function () {
  try {
    if (navigator.doNotTrack === "1" || window.__ciaTracked) return;
    window.__ciaTracked = true;

    // per-tab session id (sessionStorage clears when the tab closes)
    var sid = "";
    try {
      sid = sessionStorage.getItem("cia_sid") || "";
      if (!sid) {
        sid = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
        sessionStorage.setItem("cia_sid", sid);
      }
    } catch (e) {}

    // normalise path so /lab and /lab/index.html group together
    var path = location.pathname.replace(/index\.html$/, "").replace(/\/{2,}/g, "/");
    if (path.length > 1) path = path.replace(/\/$/, "") || "/";

    var payload = {
      path: path || "/",
      title: (document.title || "").slice(0, 200),
      ref: document.referrer || "",
      sid: sid,
    };

    var body = JSON.stringify(payload);
    var url = "/api/mail/track";

    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
        keepalive: true,
      }).catch(function () {});
    }
  } catch (e) {
    /* analytics must never break the page */
  }
})();
