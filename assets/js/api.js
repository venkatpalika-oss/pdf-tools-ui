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
  // Ensure endpoint always starts with "/"
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
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  // Attach JWT automatically if exists
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {

    const response = await fetch(apiUrl(endpoint), {
      ...options,
      headers
    });

    /* ============================
       Handle Unauthorized Globally
    ============================ */

    if (response.status === 401) {
      console.warn("Session expired or invalid token.");
      logout(); // Clears token + reloads
      return null;
    }

    /* ============================
       Handle Non-OK Responses
    ============================ */

    if (!response.ok) {
      console.error(`API Error ${response.status}`);
      return null;
    }

    // Safe JSON parsing
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return null;

  } catch (error) {
    console.error("Network / API failure:", error);
    return null;
  }
}
