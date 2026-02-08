document.addEventListener("DOMContentLoaded", () => {
  const isToolPage = window.location.pathname.includes("/tools/");
  const base = isToolPage ? "../" : "";

  // Load header
  fetch(base + "includes/header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-header").innerHTML = html;

      // Fix header links dynamically
      document.querySelectorAll("[data-home]").forEach(el => {
        el.href = base + "index.html";
      });

      document.querySelectorAll("[data-tools]").forEach(el => {
        el.href = base + "tools/compress-pdf.html";
      });
    });

  // Load footer
  fetch(base + "includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-footer").innerHTML = html;
    });
});
