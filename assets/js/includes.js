function loadInclude(id, url) {
  fetch(url)
    .then(res => res.text())
    .then(html => {
      document.getElementById(id).innerHTML = html;
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadInclude("site-header", "includes/header.html");
  loadInclude("site-footer", "includes/footer.html");
});
