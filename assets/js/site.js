/* =====================================================================
   PaperlyTools – site-wide setup (loaded on every page)
   ---------------------------------------------------------------------
   Paste your IDs below and push. Leave blank to keep them off.

   GA_ID            Google Analytics 4 measurement ID, e.g. "G-ABC123XYZ"
   ADSENSE_CLIENT   AdSense publisher ID, e.g. "ca-pub-1234567890123456"
                    (also put the same pub ID in /ads.txt)
===================================================================== */
(function () {
  var GA_ID = "";
  var ADSENSE_CLIENT = "";

  // Don't load ads or analytics on private account / payment pages
  var PRIVATE = /\/(login|signup|dashboard|checkout|verify-email)\.html$/;
  var isPrivate = PRIVATE.test(location.pathname);

  function addScript(src, attrs) {
    var s = document.createElement("script");
    s.async = true;
    s.src = src;
    for (var k in attrs || {}) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }

  if (GA_ID) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
    addScript("https://www.googletagmanager.com/gtag/js?id=" + GA_ID);
  }

  if (ADSENSE_CLIENT && !isPrivate) {
    // Auto ads: Google places ads automatically once the site is approved
    addScript("https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + ADSENSE_CLIENT, { crossorigin: "anonymous" });
  }
})();
