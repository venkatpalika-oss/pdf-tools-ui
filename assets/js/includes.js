document.addEventListener("DOMContentLoaded", () => {

  const isToolPage = window.location.pathname.includes("/tools/");
  const base = isToolPage ? "../" : "";

  /* ================= LOAD HEADER ================= */

  fetch(base + "includes/header.html")
    .then(res => res.text())
    .then(html => {

      const headerContainer = document.getElementById("site-header");
      if (!headerContainer) return;

      headerContainer.innerHTML = html;

      /* ================= FIX DYNAMIC LINKS ================= */

      document.querySelectorAll(".dynamic-link").forEach(link => {
        const target = link.getAttribute("data-path");
        if (target) link.href = base + target;
      });

      initHeaderAuth();
    });

  /* ================= LOAD FOOTER ================= */

  fetch(base + "includes/footer.html")
    .then(res => res.text())
    .then(html => {

      const footerContainer = document.getElementById("site-footer");
      if (footerContainer) footerContainer.innerHTML = html;

    });

  /* ================= AUTH HEADER ================= */

  async function initHeaderAuth() {

    const { getToken, logout } = await import("/assets/js/auth.js");

    const authButton = document.getElementById("authButton");
    const dashboardLink = document.querySelector('[data-path="dashboard.html"]');

    if (!authButton) return;

    const token = getToken();

    /* ================= NOT LOGGED IN ================= */

    if (!token) {

      authButton.textContent = "Login";
      authButton.href = base + "login.html";
      authButton.style.display = "inline-block";

      if (dashboardLink) {
        dashboardLink.style.display = "none";
      }

      return;
    }

    /* ================= LOGGED IN ================= */

    const parent = authButton.parentElement;
    if (!parent) return;

    authButton.style.display = "none";

    if (dashboardLink) {
      dashboardLink.style.display = "inline-block";
      dashboardLink.href = base + "dashboard.html";
    }

    /* Prevent duplicate logout buttons */

    if (parent.querySelector(".logout-btn")) return;

    const logoutBtn = document.createElement("button");

    logoutBtn.className = "btn-primary logout-btn";
    logoutBtn.textContent = "Logout";

    logoutBtn.addEventListener("click", (e) => {

      e.preventDefault();

      logout();

    });

    parent.appendChild(logoutBtn);

  }

});