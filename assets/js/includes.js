function loadInclude(id, url) {
  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error("Include not found");
      return response.text();
    })
    .then(html => {
      document.getElementById(id).innerHTML = html;
    })
    .catch(() => {
      // Fail silently (prevents GitHub 404 page injection)
    });
}

document.addEventListener("DOMContentLoaded", () => {
  loadInclude("site-header", "../includes/header.html");
  loadInclude("site-footer", "../includes/footer.html");
});
