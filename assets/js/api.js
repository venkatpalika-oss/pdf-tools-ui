// ============================================
// PaperlyTools - API Layer (Production Stable)
// ============================================

import { getToken, logout } from "./auth.js";

/*
  IMPORTANT:
  This must always point to your backend server.
  Do NOT use relative paths like "/api/..."
*/
const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

/* ============================================
   Build Full API URL
============================================ */

export function apiUrl(endpoint) {

  if (!endpoint.startsWith("/")) {
    endpoint = "/" + endpoint;
  }

  return `${API_BASE}${endpoint}`;
}

/* ============================================
   Main API Request Wrapper
============================================ */

export async function apiRequest(endpoint, options = {}) {

  const token = getToken();

  const headers = {
    ...(options.headers || {})
  };

  /*
    Only set JSON header if body is NOT FormData.
    Required for file uploads.
  */
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Attach JWT automatically
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {

    const response = await fetch(apiUrl(endpoint), {
      ...options,
      headers
    });

    const contentType = response.headers.get("content-type");

    let data = null;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    }

    /* ============================
       Handle Unauthorized
    ============================ */

    if (response.status === 401) {

      console.warn("Session expired or invalid token.");

      logout(); // Clears token + reloads

      return {
        error: "Session expired. Please login again."
      };

    }

    /* ============================
       Handle Limit / Paywall
    ============================ */

    if (response.status === 403) {

      console.warn("Access blocked:", data?.error);

      return {
        error: data?.error || "Access denied.",
        usage: data?.usage
      };

    }

    /* ============================
       Handle Other Errors
    ============================ */

    if (!response.ok) {

      console.error(`API Error ${response.status}`);

      return {
        error: data?.error || "Server error"
      };

    }

    return data;

  }

  catch (error) {

    console.error("Network / API failure:", error);

    return {
      error: "Network error. Please try again."
    };

  }

}
