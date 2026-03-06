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

    /* ================= NOT LOGGED IN ================= */

    if (!token) {
      authButton.textContent = "Login";
      authButton.href = "/login.html";
      authButton.style.display = "inline-block";
      return;
    }

    /* ================= FETCH USER INFO ================= */

    let user = null;

    try {

      const data = await apiRequest("/api/auth/me");

      if (data?.user) {
        user = data.user;
      } else {
        user = data;
      }

    } catch (err) {
      console.warn("Auth fetch failed:", err);
    }

    /* ================= FALLBACK: TOKEN EXISTS BUT USER DATA FAILED ================= */

    if (!user) {

      console.warn("User data unavailable. Showing logout only.");

      const logoutBtn = document.createElement("button");
      logoutBtn.className = "btn-primary logout-btn";
      logoutBtn.textContent = "Logout";

      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });

      authButton.style.display = "none";

      if (authButton.parentElement) {
        authButton.parentElement.appendChild(logoutBtn);
      }

      return;
    }

    /* ================= CREATE USER DROPDOWN ================= */

    const dropdownWrapper = document.createElement("div");
    dropdownWrapper.className = "user-dropdown";

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

    /* ================= ACCOUNT ================= */

    const accountLink = document.createElement("a");
    accountLink.href = "/account.html";
    accountLink.textContent = "Account";

    /* ================= UPGRADE ================= */

    const upgradeLink = document.createElement("a");
    upgradeLink.href = "/#pricing";
    upgradeLink.textContent = "Upgrade to Pro";

    if (user.plan === "free") {
      upgradeLink.classList.add("upgrade-glow");
    }

    /* ================= LOGOUT ================= */

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

    dropdownWrapper.appendChild(badge);
    dropdownWrapper.appendChild(menu);

    authButton.style.display = "none";

    if (authButton.parentElement) {
      authButton.parentElement.appendChild(dropdownWrapper);
    }

    /* ================= DROPDOWN TOGGLE ================= */

    badge.addEventListener("click", (e) => {
      e.stopPropagation();
      menu.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
      if (!dropdownWrapper.contains(e.target)) {
        menu.classList.remove("active");
      }
    });

  }

});
