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

    const { getToken, logout } = await import("/assets/js/auth.js");
    const { apiRequest } = await import("/assets/js/api.js");

    const authButton = document.getElementById("authButton");
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

    /* ===== CREATE DROPDOWN WRAPPER ===== */

    const wrapper = document.createElement("div");
    wrapper.className = "user-dropdown";

    const badge = document.createElement("button");
    badge.className = "btn-primary user-badge";

    if (user.plan === "free") {
      badge.textContent = `${user.email} (${user.dailyUsageCount}/3)`;
      badge.classList.add("free-user");
    } else {
      badge.textContent = `${user.email} (PRO)`;
      badge.classList.add("pro-user");
    }

    const menu = document.createElement("div");
    menu.className = "user-menu";

    /* ===== ACCOUNT LINK ===== */

    const accountLink = document.createElement("a");
    accountLink.href = "/account.html";
    accountLink.textContent = "Account";

    /* ===== UPGRADE LINK ===== */

    const upgradeLink = document.createElement("a");
    upgradeLink.href = "/#pricing";
    upgradeLink.textContent = "Upgrade to Pro";

    if (user.plan === "free") {
      upgradeLink.classList.add("upgrade-glow");
    }

    /* ===== LOGOUT LINK ===== */

    const logoutLink = document.createElement("a");
    logoutLink.href = "#";
    logoutLink.textContent = "Logout";
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });

    menu.appendChild(accountLink);
    menu.appendChild(upgradeLink);
    menu.appendChild(logoutLink);

    wrapper.appendChild(badge);
    wrapper.appendChild(menu);

    authButton.replaceWith(wrapper);

    /* ===== TOGGLE DROPDOWN ===== */

    badge.addEventListener("click", () => {
      menu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!wrapper.contains(e.target)) {
        menu.classList.remove("active");
      }
    });

  }

});
