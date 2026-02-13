const API_BASE = "https://pdf-tools-api-c4f5.onrender.com";

export function apiUrl(endpoint) {
  return `${API_BASE}${endpoint}`;
}
