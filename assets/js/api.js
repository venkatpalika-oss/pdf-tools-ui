// ============================================
// PaperlyTools - API Layer (Production)
// ============================================

import { getToken, logout } from "./auth.js";

const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

export function apiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();

  const headers = {
    ...(options.headers || {})
  };

  // Attach JWT automatically
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(apiUrl(endpoint), {
      ...options,
      headers
    });

    // Global 401 handler
    if (response.status === 401) {
      alert("Session expired. Please login again.");
      logout();
      return null;
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("API Error:", error);
    alert("Network error. Please try again.");
    return null;
  }
}
