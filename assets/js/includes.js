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

      // 🔐 Inject Auth State Into Header
      initHeaderAuth(base);
    });

  /* ================= LOAD FOOTER ================= */

  fetch(base + "includes/footer.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("site-footer").innerHTML = html;
    });


  /* ================= AUTH LOGIC ================= */

  async function initHeaderAuth(basePath) {

    const { getToken, logout } = await import(basePath + "assets/js/auth.js");
    const { apiRequest } = await import(basePath + "assets/js/api.js");

    const token = getToken();

    const loginBtn = document.querySelector(".login-btn");

    if (!loginBtn) return;

    if (!token) {
      // Not logged in → ensure Login works correctly
      loginBtn.href = basePath + "login.html";
      loginBtn.textContent = "Login";
      return;
    }

    // Logged in → fetch user
    const data = await apiRequest("/api/auth/me");

    if (!data || !data.user) return;

    const user = data.user;

    if (user.plan === "free") {
      const FREE_DAILY_LIMIT = 3;
      const remaining = FREE_DAILY_LIMIT - user.dailyUsageCount;

      loginBtn.innerHTML = `
        ${user.email} | ${user.dailyUsageCount}/${FREE_DAILY_LIMIT}
        <span style="color:#ff6b6b; margin-left:10px; cursor:pointer;" id="logoutInline">
          Logout
        </span>
      `;
    } else {
      loginBtn.innerHTML = `
        ${user.email} | PRO
        <span style="color:#ff6b6b; margin-left:10px; cursor:pointer;" id="logoutInline">
          Logout
        </span>
      `;
    }

    loginBtn.removeAttribute("href");

    const logoutBtn = document.getElementById("logoutInline");

    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        logout();
      });
    }
  }

});
