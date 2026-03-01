document.addEventListener("DOMContentLoaded", () => {

  const isToolPage = window.location.pathname.includes("/tools/");
  const base = isToolPage ? "../" : "";

  /* ================= LOAD HEADER ================= */

  fetch(base + "includes/header.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-header").innerHTML = html;

      // Fix all relative links automatically
      document.querySelectorAll(".dynamic-link").forEach(link => {
        const target = link.getAttribute("data-path");
        link.href = base + target;
      });

      // Inject auth state after header loads
      initHeaderAuth(base);
    });

  /* ================= LOAD FOOTER ================= */

  fetch(base + "includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-footer").innerHTML = html;
    });

  /* ================= AUTH HEADER LOGIC ================= */

  async function initHeaderAuth(basePath) {

    const { getToken, logout } = await import(basePath + "assets/js/auth.js");
    const { apiRequest } = await import(basePath + "assets/js/api.js");

    const token = getToken();

    // Target your actual login button
    const authButton = document.querySelector(".btn-primary");

    if (!authButton) return;

    /* ===== NOT LOGGED IN ===== */
    if (!token) {
      authButton.innerHTML = `
        <a href="${basePath}login.html" style="margin-right:12px;">Login</a>
        <a href="${basePath}signup.html">Sign Up</a>
      `;
      authButton.removeAttribute("href");
      return;
    }

    /* ===== LOGGED IN ===== */

    const data = await apiRequest("/api/auth/me");

    if (!data || !data.user) return;

    const user = data.user;

    if (user.plan === "free") {
      const FREE_DAILY_LIMIT = 3;
      const remaining = FREE_DAILY_LIMIT - user.dailyUsageCount;

      authButton.innerHTML = `
        ${user.email} | ${user.dailyUsageCount}/${FREE_DAILY_LIMIT}
        <span id="logoutInline" style="margin-left:10px;color:#ff6b6b;cursor:pointer;">
          Logout
        </span>
      `;
    } else {
      authButton.innerHTML = `
        ${user.email} | PRO
        <span id="logoutInline" style="margin-left:10px;color:#ff6b6b;cursor:pointer;">
          Logout
        </span>
      `;
    }

    authButton.removeAttribute("href");

    const logoutBtn = document.getElementById("logoutInline");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        logout();
      });
    }
  }

});
