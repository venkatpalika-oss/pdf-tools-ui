document.addEventListener("DOMContentLoaded", () => {

  const isToolPage = window.location.pathname.includes("/tools/");
  const base = isToolPage ? "../" : "";

  /* ================= LOAD HEADER ================= */

  fetch(base + "includes/header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-header").innerHTML = html;

      // Fix dynamic links
      document.querySelectorAll(".dynamic-link").forEach(link => {
        const target = link.getAttribute("data-path");
        link.href = base + target;
      });

      initHeaderAuth();
    });

  /* ================= LOAD FOOTER ================= */

  fetch(base + "includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-footer").innerHTML = html;
    });

  /* ================= AUTH HEADER LOGIC ================= */

  async function initHeaderAuth() {

    // ✅ Absolute imports (important fix)
    const { getToken, logout } = await import("/assets/js/auth.js");
    const { apiRequest } = await import("/assets/js/api.js");

    const authButton = document.querySelector(".btn-primary");
    if (!authButton) return;

    const token = getToken();

    /* ===== NOT LOGGED IN ===== */
    if (!token) {
      authButton.textContent = "Login";
      authButton.href = "/login.html";
      return;
    }

    /* ===== LOGGED IN ===== */

    const data = await apiRequest("/api/auth/me");

    if (!data || !data.user) {
      authButton.textContent = "Login";
      authButton.href = "/login.html";
      return;
    }

    const user = data.user;

    if (user.plan === "free") {
      authButton.textContent =
        `${user.email} (${user.dailyUsageCount}/3)`;
    } else {
      authButton.textContent =
        `${user.email} (PRO)`;
    }

    authButton.removeAttribute("href");
    authButton.addEventListener("click", logout);
  }

});
