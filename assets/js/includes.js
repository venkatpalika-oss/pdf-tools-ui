document.addEventListener("DOMContentLoaded", () => {
  // Detect if we are inside /tools/ folder
  const isToolPage = window.location.pathname.includes("/tools/");

  // Decide base path accordingly
  const basePath = isToolPage ? "../" : "";

  // Load header
  fetch(basePath + "includes/header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-header").innerHTML = html;
    });

  // Load footer
  fetch(basePath + "includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-footer").innerHTML = html;
    });
});
