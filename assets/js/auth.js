// ============================================
// PaperlyTools - Auth Manager (PRODUCTION)
// Static GitHub Pages Compatible
// JWT + SaaS UI Extension
// ============================================

const TOKEN_KEY = "paperly_token";

/* ============================================
   TOKEN STORAGE
============================================ */

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

/* ============================================
   JWT PARSER (Safe)
============================================ */

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    return JSON.parse(jsonPayload);
  } catch (err) {
    console.error("JWT parse error:", err);
    return null;
  }
}

/* ============================================
   CURRENT USER DATA (From JWT)
============================================ */

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const payload = parseJwt(token);
  if (!payload) return null;

  return payload;
}

/* ============================================
   PLAN HELPERS
============================================ */

export function getUserPlan() {
  const user = getCurrentUser();
  if (!user) return "free";
  return user.plan || "free";
}

export function isProUser() {
  const plan = getUserPlan();
  return plan === "pro" || plan === "aipro";
}

export function isAIProUser() {
  const plan = getUserPlan();
  return plan === "aipro";
}

/* ============================================
   HEADER UI STATE HANDLER (Premium SaaS Feel)
============================================ */

export function initAuthUI() {
  const user = getCurrentUser();

  const loginBtn = document.querySelector(".nav-login");
  const signupBtn = document.querySelector(".nav-signup");
  const userBadge = document.querySelector(".user-badge");
  const upgradeBtn = document.querySelector(".nav-upgrade");

  if (!user) {
    // Logged OUT state
    if (loginBtn) loginBtn.style.display = "inline-flex";
    if (signupBtn) signupBtn.style.display = "inline-flex";
    if (userBadge) userBadge.style.display = "none";
    return;
  }

  // Logged IN state
  if (loginBtn) loginBtn.style.display = "none";
  if (signupBtn) signupBtn.style.display = "none";

  const plan = user.plan || "free";

  if (userBadge) {
    userBadge.style.display = "inline-flex";
    userBadge.innerHTML = `
      <span class="badge-glow ${plan}">
        ${plan.toUpperCase()}
      </span>
    `;
  }

  if (plan === "free" && upgradeBtn) {
    upgradeBtn.classList.add("pulse-upgrade");
  }
}

/* ============================================
   LOGOUT
============================================ */

export function logout() {
  removeToken();
  window.location.href = "/login.html";
}
