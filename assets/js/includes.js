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

      // Fix dynamic links
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

    /* ================= TOKEN EXISTS ================= */

    const parent = authButton.parentElement;
    if (!parent) return;

    authButton.style.display = "none";

    /* ================= SHOW LOGOUT IMMEDIATELY ================= */

    let logoutBtn = document.querySelector(".logout-btn");

    if (!logoutBtn) {

      logoutBtn = document.createElement("button");
      logoutBtn.className = "btn-primary logout-btn";
      logoutBtn.textContent = "Logout";

      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });

      parent.appendChild(logoutBtn);
    }

    /* ================= TRY FETCH USER ================= */

    let user = null;

    try {

      const data = await apiRequest("/api/auth/me");

      if (data?.user) user = data.user;
      else user = data;

    } catch (err) {
      console.warn("Auth fetch failed:", err);
    }

    /* ================= IF USER INVALID KEEP LOGOUT ================= */

    if (!user || !user.email) {
      return;
    }

    /* ================= UPGRADE TO DROPDOWN ================= */

    if (logoutBtn) logoutBtn.remove();

    if (document.querySelector(".user-dropdown")) return;

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

    const accountLink = document.createElement("a");
    accountLink.href = "/account.html";
    accountLink.textContent = "Account";

    const upgradeLink = document.createElement("a");
    upgradeLink.href = "/#pricing";
    upgradeLink.textContent = "Upgrade to Pro";

    if (user.plan === "free") {
      upgradeLink.classList.add("upgrade-glow");
    }

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

    parent.appendChild(dropdownWrapper);

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
